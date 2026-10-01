import { createHash, createHmac } from "node:crypto";
import { isIP } from "node:net";
import { AdminError } from "../admin/model";
import { reportServerError } from "../operations";
import { VoteError } from "./model";
export { limitedBody, privateHeaders } from "../blog/http";

export const validVoterToken = (value: string | undefined): value is string => !!value && /^[a-f0-9]{64}$/.test(value);
export const voterHash = (token: string) => createHash("sha256").update(`fan-vote:${token}`).digest("hex");
export function votingClientKey(request: Request) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const address = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() : "local";
  if (!secret || secret.length < 32 || (process.env.VERCEL === "1" && (!address || !isIP(address)))) throw new VoteError("unavailable", 503);
  return createHmac("sha256", secret).update(`fan-vote-limit:${address}`).digest("hex");
}
export function voteFailure(error: unknown) {
  const status = error instanceof VoteError || error instanceof AdminError ? error.status : 503;
  if (status >= 500) reportServerError(error, "fan-vote");
  return Response.json({ error: error instanceof VoteError ? error.code : status < 500 ? "invalid" : "unavailable" }, {
    status, headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", ...(status === 429 ? { "Retry-After": "3600" } : {}) },
  });
}
