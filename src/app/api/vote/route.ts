import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { castVote, readVote } from "@/lib/voting/store";
import { VoteError, voteCookie, voteCookieMaxAge } from "@/lib/voting/model";
import { limitedBody, privateHeaders, validVoterToken, voterHash, voteFailure, votingClientKey } from "@/lib/voting/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const existing = request.cookies.get(voteCookie)?.value;
    const token = validVoterToken(existing) ? existing : randomBytes(32).toString("hex");
    const state = await readVote(voterHash(token));
    const response = NextResponse.json(state, { headers: privateHeaders });
    response.cookies.set(voteCookie, token, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/api/vote", maxAge: voteCookieMaxAge });
    return response;
  } catch (error) { return voteFailure(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("origin") !== request.nextUrl.origin) throw new VoteError("origin", 403);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new VoteError("invalid", 415);
    const token = request.cookies.get(voteCookie)?.value;
    if (!validVoterToken(token)) throw new VoteError("cookies", 400);
    const raw = await limitedBody(request, 512);
    let input: unknown;
    try { input = JSON.parse(raw.toString("utf8")); } catch { throw new VoteError("invalid", 400); }
    const state = await castVote(input, voterHash(token), votingClientKey(request));
    return NextResponse.json(state, { status: state.accepted ? 201 : 200, headers: privateHeaders });
  } catch (error) { return voteFailure(error); }
}
