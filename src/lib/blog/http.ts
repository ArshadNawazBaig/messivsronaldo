import { ZodError } from "zod";
import { AdminError } from "../admin/model";
import { reportServerError } from "../operations";
export const privateHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
export function blogFailure(error: unknown) {
  const status = error instanceof AdminError ? error.status : error instanceof ZodError ? 422 : 500;
  if (status >= 500) reportServerError(error, "admin-blog");
  const message = error instanceof AdminError ? error.message : error instanceof ZodError ? error.issues.map(issue => issue.message).slice(0, 3).join(" ") : "The request could not be completed. Please try again. Your changes have not been discarded.";
  return Response.json({ error: message }, { status, headers: privateHeaders });
}
export async function limitedBody(request: Request, limit: number): Promise<Buffer> {
  if (Number(request.headers.get("content-length")) > limit) throw new AdminError("The upload is too large.", 413);
  const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  if (reader) while (true) {
    const chunk = await reader.read(); if (chunk.done) break;
    size += chunk.value.byteLength; if (size > limit) { await reader.cancel(); throw new AdminError("The upload is too large.", 413); }
    chunks.push(chunk.value);
  }
  return Buffer.concat(chunks);
}
