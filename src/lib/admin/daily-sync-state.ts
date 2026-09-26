import { z } from "zod";
import { snapshotDate } from "@/lib/data";
import { readSetting, writeSetting } from "./database";
import { dateSchema } from "./model";

const stateSchema = z.object({
  lastRunDate: dateSchema.nullable(),
  scannedThrough: dateSchema,
  pendingDates: z.array(dateSchema),
  status: z.enum(["waiting", "running", "success", "partial", "failed"]),
  message: z.string(),
});
export type DailySyncState = z.infer<typeof stateSchema>;
export const dailySyncSchedule = "Daily around 1 PM Pakistan time (08:00 UTC)";

export async function readDailySyncState(): Promise<DailySyncState> {
  const value = await readSetting("daily-sync");
  return value ? stateSchema.parse(JSON.parse(value)) : {
    lastRunDate: null, scannedThrough: snapshotDate, pendingDates: [], status: "waiting",
    message: "Waiting for the first scheduled update.",
  };
}
export async function saveDailySyncState(state: DailySyncState) {
  await writeSetting("daily-sync", JSON.stringify(stateSchema.parse(state)));
}
