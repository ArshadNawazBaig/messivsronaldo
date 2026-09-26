import { z } from "zod";
import { snapshotDate } from "@/lib/data";
import type { DailySyncState } from "./daily-sync-state";

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Use a valid calendar date");
export const matchSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9:_-]+$/),
  player: z.enum(["messi", "ronaldo"]), date: dateSchema,
  team: z.string().trim().min(2).max(80), opponent: z.string().trim().min(2).max(80), competition: z.string().trim().min(2).max(100),
  category: z.enum(["league", "club-cup", "international", "world-cup", "copa-euros"]),
  goals: z.number().int().min(0).max(20), assists: z.number().int().min(0).max(20), minutes: z.number().int().min(0).max(150),
  appearances: z.literal(1), headToHead: z.boolean().default(false),
  source: z.string().url().max(500).refine(v => new URL(v).protocol === "https:", "An HTTPS evidence URL is required"),
  provider: z.enum(["api-football", "manual"]), note: z.string().trim().min(5).max(500), locked: z.boolean().default(false),
});
export type MatchRecord = z.infer<typeof matchSchema>;
export interface ProviderConnection { key: string; messi: { player: number; club: number; country: number }; ronaldo: { player: number; club: number; country: number } }
export interface RunRecord { id: number; at: string; date: string; action: string; status: string; message: string }
export interface AdminState { revision: number; records: MatchRecord[]; history: RunRecord[]; providerConnected: boolean; baseline: string; today: string; connection: Omit<ProviderConnection, "key"> | null; automaticUpdates: DailySyncState & { scheduled: boolean; schedule: string }; }
export class AdminError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function checkDate(date: string, today = new Date().toISOString().slice(0, 10), append = false) {
  if (!dateSchema.safeParse(date).success || date > today || date < "2002-01-01") throw new AdminError("Choose a valid date between 2002 and today (UTC).");
  if (append && date <= snapshotDate) throw new AdminError(`The reviewed baseline already includes matches through ${snapshotDate}. Only later matches can be added; earlier dates can be checked without adding them again.`);
}
