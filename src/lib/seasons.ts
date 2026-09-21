// Transcribed from the Turkish Football Federation's TamSaha, July 2020,
// Messi/Ronaldo comparison table. Rows cover the shared Spanish era only.
// The main-competition Champions League scope excludes qualifiers.
export type CompetitionId = "league" | "ucl";
export type SeasonRecord = {
  slug: string;
  label: string;
  league: { messi: { goals: number; appearances: number }; ronaldo: { goals: number; appearances: number } };
  ucl: { messi: { goals: number; appearances: number }; ronaldo: { goals: number; appearances: number } };
};
const raw = [
  [2009, 35, 34, 29, 26, 11, 8, 6, 7],
  [2010, 33, 31, 34, 40, 13, 12, 12, 6],
  [2011, 37, 50, 38, 46, 11, 14, 10, 10],
  [2012, 32, 46, 34, 34, 11, 8, 12, 12],
  [2013, 31, 28, 30, 31, 7, 8, 11, 17],
  [2014, 38, 43, 35, 48, 13, 10, 12, 10],
  [2015, 33, 26, 36, 35, 7, 6, 12, 16],
  [2016, 34, 37, 29, 25, 9, 11, 13, 12],
  [2017, 36, 34, 27, 26, 10, 6, 13, 15],
] as const;
export const seasons: SeasonRecord[] = raw.map(([year, ma, mg, ra, rg, mca, mcg, rca, rcg]) => ({
  slug: `${year}-${String(year + 1).slice(2)}`,
  label: `${year}/${String(year + 1).slice(2)}`,
  league: { messi: { goals: mg, appearances: ma }, ronaldo: { goals: rg, appearances: ra } },
  ucl: { messi: { goals: mcg, appearances: mca }, ronaldo: { goals: rcg, appearances: rca } },
}));
export function seasonTotals(rows: SeasonRecord[], competition: CompetitionId) {
  return rows.reduce((total, row) => ({
    messi: { goals: total.messi.goals + row[competition].messi.goals, appearances: total.messi.appearances + row[competition].messi.appearances },
    ronaldo: { goals: total.ronaldo.goals + row[competition].ronaldo.goals, appearances: total.ronaldo.appearances + row[competition].ronaldo.appearances },
  }), { messi: { goals: 0, appearances: 0 }, ronaldo: { goals: 0, appearances: 0 } });
}
