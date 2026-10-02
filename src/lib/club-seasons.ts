import snapshot from "@/data/club-seasons.json";
import { calendarSummaryRows, type SummaryRow } from "./archive-summary";
import { ratio } from "./football";

// A separate reviewed snapshot: never add two calendar years to make a season.
// Since 2023/2024, Messi's sample follows the source's Ronaldo-season period.
export const clubSeasons = snapshot.seasons;
export const clubSeasonsReviewed = snapshot.reviewedAt;
export type ClubSeason = (typeof clubSeasons)[number];
export const clubSeasonTitle = (season: ClubSeason) => `Messi vs Ronaldo ${season.label}: Season Goals & Stats`;
export const clubSeasonDescription = (season: ClubSeason) => `${season.label} club season: Messi ${season.stats.goals.messi} goals and ${season.stats.assists.messi} assists; Ronaldo ${season.stats.goals.ronaldo} goals and ${season.stats.assists.ronaldo} assists. Compare appearances, minutes and scoring rates.`;

export function clubSeasonRows(season: ClubSeason): SummaryRow[] {
  return [...calendarSummaryRows(season.stats), {
    label: "Minutes per goal", decimals: 1, lowerIsBetter: true,
    values: { messi: ratio(season.stats.minutes.messi, season.stats.goals.messi), ronaldo: ratio(season.stats.minutes.ronaldo, season.stats.goals.ronaldo) },
  }];
}
