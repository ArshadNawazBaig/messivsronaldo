import { z, ZodError } from "zod";
import { revalidatePath } from "next/cache";
import { checkOrigin, login, logout, requireAdmin } from "@/lib/admin/auth";
import { AdminError, dateSchema } from "@/lib/admin/model";
import { backup, getAdminState, removeMatch, saveMatch, syncDate } from "@/lib/admin/service";
import { connectProvider } from "@/lib/admin/provider";
import { logRun, saveConnection, undoLast } from "@/lib/admin/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {"Cache-Control":"no-store", "X-Robots-Tag":"noindex, nofollow"};
function failure(error: unknown) {
  const status = error instanceof AdminError ? error.status : error instanceof ZodError ? 422 : 500;
  const message = error instanceof AdminError ? error.message : error instanceof ZodError ? "Some fields or provider records are invalid. Check the date, numbers, and evidence URL." : "The operation could not be completed. No new statistics were published.";
  return Response.json({error:message},{status,headers});
}
export async function GET(_request: Request, {params}:{params:Promise<{action:string}>}) {
  try {
    await requireAdmin(); const {action} = await params;
    if (action === "state") return Response.json(getAdminState(),{headers});
    if (action === "backup") return Response.json(backup(),{headers:{...headers,"Content-Disposition":"attachment; filename=rivalry-data-backup.json"}});
    return Response.json({error:"Not found"},{status:404,headers});
  } catch(error) { return failure(error); }
}
export async function POST(request: Request, {params}:{params:Promise<{action:string}>}) {
  try {
    checkOrigin(request); const {action} = await params;
    // Every operation is authorized before accepting its payload or calling the provider.
    if (action !== "login") await requireAdmin();
    const reader = request.body?.getReader(); const decoder = new TextDecoder(); let raw = ""; let bytes = 0;
    if (reader) { while (true) { const chunk = await reader.read(); if (chunk.done) break; bytes += chunk.value.byteLength; if (bytes > 12_000) { await reader.cancel(); throw new AdminError("Request is too large.",413); } raw += decoder.decode(chunk.value,{stream:true}); } raw += decoder.decode(); }
    let body: unknown; try { body = JSON.parse(raw); } catch { throw new AdminError("Invalid request body."); }
    if (action === "login") { const {password} = z.object({password:z.string().min(1).max(256)}).parse(body); await login(password); return Response.json({ok:true},{headers}); }
    if (action === "logout") { await logout(); return Response.json({ok:true},{headers}); }
    let message = "Saved.";
    if (action === "connect") {
      const {key} = z.object({key:z.string().trim().min(10).max(200)}).parse(body);
      try {
        saveConnection(await connectProvider(key));
      } catch (error) {
        if (error instanceof AdminError) logRun(new Date().toISOString().slice(0,10),"connection","failed",error.message);
        throw error;
      }
      logRun(new Date().toISOString().slice(0,10),"connection","connected","API-Football connected. Player and team identities verified.");
      message = "API-Football connected. Both players and their club/country identities were verified.";
    } else {
      const {revision} = z.object({revision:z.number().int().nonnegative()}).parse(body);
      if (action === "sync") { const {date} = z.object({date:dateSchema}).parse(body); message = await syncDate(date,revision); }
      else if (action === "match") { const {record} = z.object({record:z.unknown()}).parse(body); saveMatch(record,revision); message = "Match saved and public totals recalculated."; }
      else if (action === "remove") { const {id} = z.object({id:z.string().min(1).max(100)}).parse(body); removeMatch(id,revision); message = "Match removed and totals recalculated."; }
      else if (action === "undo") { undoLast(revision); message = "Previous published data restored."; }
      else throw new AdminError("Unknown admin action.",404);
    }
    revalidatePath("/","layout");
    return Response.json({message,state:getAdminState()},{headers});
  } catch(error) { return failure(error); }
}
