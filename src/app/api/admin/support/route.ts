import { defaultAdminPageSize } from "@/lib/admin/pagination";
import { z } from "zod";
import { checkOrigin, requireAdmin } from "@/lib/admin/auth";
import { AdminError } from "@/lib/admin/model";
import { limitedBody, privateHeaders, supportFailure } from "@/lib/support/http";
import { changeSupport, listSupport } from "@/lib/support/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const { status, offset, pageSize } = z.object({ status: z.enum(["all", "new", "reviewing", "resolved", "spam"]).default("all"), offset: z.coerce.number().int().min(0).max(10000).default(0), pageSize: z.coerce.number().pipe(z.union([z.literal(10),z.literal(20),z.literal(50)])).default(defaultAdminPageSize) }).parse(query);
    return Response.json(await listSupport(status, offset, undefined, Date.now(), pageSize), { headers: privateHeaders });
  } catch (error) { return supportFailure(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request); await requireAdmin();
    const raw = await limitedBody(request, 24_000);
    let input: unknown;
    try { input = JSON.parse(raw.toString("utf8")); } catch { throw new AdminError("Invalid request."); }
    return Response.json({ ticket: await changeSupport(input) }, { headers: privateHeaders });
  } catch (error) { return supportFailure(error); }
}
