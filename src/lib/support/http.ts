import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { ZodError } from "zod";
import { AdminError } from "../admin/model";
import { reportServerError } from "../operations";
export { limitedBody, privateHeaders } from "../blog/http";

export function supportClientKey(request: Request) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new AdminError("Support is temporarily unavailable. Please try again later.", 503);
  // On Vercel only use the platform-overwritten header, not a client-supplied XFF.
  const address = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() : "local";
  if (process.env.VERCEL === "1" && (!address || !isIP(address))) throw new AdminError("Support is temporarily unavailable. Please try again later.", 503);
  return createHmac("sha256", secret).update(`support:${address}`).digest("hex");
}
export function supportFailure(error: unknown) {
  const status = error instanceof AdminError ? error.status : error instanceof ZodError ? 422 : 500;
  if (status >= 500) reportServerError(error, "support");
  const message = error instanceof AdminError ? error.message : error instanceof ZodError ? "Check the form fields and try again." : "The report could not be saved. Please try again.";
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", ...(status === 429 ? { "Retry-After": "3600" } : {}) } });
}
