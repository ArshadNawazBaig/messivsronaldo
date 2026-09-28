import type { MatchRecord } from "./admin/model";

export const scoringFields = {
  freeKicks: "Direct free-kick goals",
  penalties: "Penalty goals",
  penaltyAttempts: "Penalties taken",
  outsideBox: "Outside-box goals (excluding free kicks)",
  insideBox: "Inside-box goals (excluding penalties)",
  leftFoot: "Left-foot goals",
  rightFoot: "Right-foot goals",
  headers: "Headed goals",
  otherBody: "Goals with other body parts",
} as const;
export type ScoringField = keyof typeof scoringFields;
export const locationFields = ["freeKicks", "penalties", "outsideBox", "insideBox"] as const;
export const bodyFields = ["leftFoot", "rightFoot", "headers", "otherBody"] as const;

// Missing classifications stay unknown. A complete partition (or no goals)
// proves that the remaining categories are zero; it does not prove no misses.
export function matchScoring(record: MatchRecord): Partial<Record<ScoringField, number>> & { hatTricks: number; "non-penalty-goals"?: number } {
  const result: Partial<Record<ScoringField, number>> = {};
  for (const field of Object.keys(scoringFields) as ScoringField[]) {
    if (record[field] !== undefined) result[field] = record[field];
  }
  for (const partition of [locationFields, bodyFields]) {
    if (partition.reduce((sum, field) => sum + (result[field] ?? 0), 0) === record.goals) {
      for (const field of partition) result[field] ??= 0;
    }
  }
  return { ...result, hatTricks: record.goals >= 3 ? 1 : 0,
    "non-penalty-goals": result.penalties === undefined ? undefined : record.goals - result.penalties };
}
