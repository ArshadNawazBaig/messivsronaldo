import type { Pair, PlayerId } from "./data";

/** Compare unrounded ratios. A missing denominator must not imply a zero rate. */
export function scoringComparison(goals: Pair, appearances: Pair, minutes?: Pair) {
  const exposure = minutes ?? appearances;
  const multiplier = minutes ? 90 : 1;
  const leader = (difference: number): PlayerId | null => difference === 0 ? null : difference > 0 ? "messi" : "ronaldo";
  const rates = {
    messi: exposure.messi > 0 ? goals.messi * multiplier / exposure.messi : null,
    ronaldo: exposure.ronaldo > 0 ? goals.ronaldo * multiplier / exposure.ronaldo : null,
  };
  const comparable = rates.messi !== null && rates.ronaldo !== null;
  return {
    goalLeader: leader(goals.messi - goals.ronaldo),
    goalGap: Math.abs(goals.messi - goals.ronaldo),
    rates,
    comparable,
    rateLeader: comparable ? leader(goals.messi * exposure.ronaldo - goals.ronaldo * exposure.messi) : null,
    basis: minutes ? "minutes" as const : "appearances" as const,
  };
}
