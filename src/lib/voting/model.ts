import { z } from "zod";

export const startingVotes = { messi: 4021, ronaldo: 3810 } as const;
export const voteSubmission = z.object({ player: z.enum(["messi", "ronaldo"]) }).strict();
export type VotePlayer = z.infer<typeof voteSubmission>["player"];
export type VoteState = {
  choice: VotePlayer | null;
  visitors: Record<VotePlayer, number>;
  totals: Record<VotePlayer, number>;
};
export const voteCookie = "rivalry-voter";
export const voteCookieMaxAge = 400 * 24 * 60 * 60;
export const voteLimit = 60;
export const voteLimitWindow = 60 * 60 * 1000;
export class VoteError extends Error {
  constructor(public code: "unavailable" | "invalid" | "cookies" | "rate-limit" | "origin", public status: number) { super(code); }
}
