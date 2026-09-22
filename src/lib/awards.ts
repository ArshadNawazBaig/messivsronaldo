import { players, sources, type PlayerId } from "./data";

export const awardSlugs = ["ballon-dor", "golden-boots", "man-of-the-match", "fifa-awards", "uefa-awards"] as const;
export type AwardSlug = typeof awardSlugs[number];
type AwardRow = { label: string; values: Record<PlayerId, number>; percent?: boolean };
type AwardComparison = {
  label: string;
  description: string;
  context: string;
  cardLabel: string;
  note: string;
  wins?: Record<PlayerId, readonly string[]>;
  rows?: AwardRow[];
  sources: { name: string; url: string }[];
};

// Award editions are separate from the match ledger. New match imports must
// never increment awards. Counts derive from the recorded winning editions.
export const awardsReviewed = "2026-09-22";
export const awardComparisons: Record<AwardSlug, AwardComparison> = {
  "ballon-dor": {
    label: "Ballon d’Or",
    description: "Compare Ballon d’Or wins, winning years and the award timeline for Messi and Ronaldo.",
    context: "Completed editions through 2025",
    cardLabel: "Ballon d’Or awards",
    wins: { messi: players.messi.awards.map(String), ronaldo: players.ronaldo.awards.map(String) },
    note: "Includes the joint FIFA Ballon d’Or editions from 2010 to 2015. No award was presented in 2020. The 2026 edition is not included.",
    sources: [{ name: "UEFA · Ballon d’Or", url: sources.ballon.url }],
  },
  "golden-boots": {
    label: "Golden Boots",
    description: "Compare Messi and Ronaldo’s European Golden Shoes and the league seasons in which they won them.",
    context: "European Golden Shoe",
    cardLabel: "European Golden Shoes",
    wins: { messi: ["2009/10", "2011/12", "2012/13", "2016/17", "2017/18", "2018/19"], ronaldo: ["2007/08", "2010/11", "2013/14", "2014/15"] },
    note: "The European Golden Shoe compares goals in European domestic leagues using competition weights. These totals exclude individual league and international tournament Golden Boots. Ronaldo shared the 2013/14 award with Luis Suárez.",
    sources: [
      { name: "FC Barcelona", url: "https://www.fcbarcelona.com/en/news/1475053/messis-6th-golden-shoe-on-display-in-musum" },
      { name: "LALIGA", url: "https://www.laliga.com/en-GB/news/cristiano-ronaldo-receives-his-fourth-golden-shoe" },
    ],
  },
  "man-of-the-match": {
    label: "Man of the Match",
    description: "Compare WhoScored Man of the Match selections in European leagues and the Champions League since 2009/10.",
    context: "European leagues + UCL · Since 2009/10",
    cardLabel: "Man of the Match",
    rows: [
      { label: "Man of the Match", values: { messi: 333, ronaldo: 168 } },
      { label: "Share of covered matches", values: { messi: 51, ronaldo: 30 }, percent: true },
    ],
    note: "These are WhoScored selections in the published European league and Champions League comparison since 2009/10, reviewed through 21 September 2026. Non-European leagues and internationals are excluded. This is partial career coverage, not a total of all official match awards. Percentages are rounded by the source.",
    sources: [{ name: "WhoScored · Messi vs Ronaldo App", url: "https://www.messivsronaldo.app/detailed-stats/man-of-the-match-awards/" }],
  },
  "fifa-awards": {
    label: "FIFA awards",
    description: "Compare The Best FIFA Men’s Player wins and award editions for Messi and Ronaldo.",
    context: "The Best FIFA Men’s Player · 2016–2025",
    cardLabel: "The Best FIFA awards",
    wins: { messi: ["2019", "2022", "2023"], ronaldo: ["2016", "2017"] },
    note: "The Best began in 2016. Earlier FIFA World Player of the Year and joint FIFA Ballon d’Or awards are excluded. Years refer to award editions, which can be presented in the following calendar year.",
    sources: [{ name: "FIFA", url: "https://www.fifa.com/en/the-best-fifa-football-awards/2025/articles/all-award-winners-history" }],
  },
  "uefa-awards": {
    label: "UEFA awards",
    description: "Compare UEFA Men’s Player of the Year awards and the winning seasons for Messi and Ronaldo.",
    context: "UEFA Men’s Player of the Year",
    cardLabel: "UEFA player awards",
    wins: { messi: ["2010/11", "2014/15"], ronaldo: ["2013/14", "2015/16", "2016/17"] },
    note: "This award began in 2011 as UEFA Best Player in Europe. The earlier UEFA Club Footballer of the Year prize is separate: Ronaldo won it in 2008 and Messi in 2009. Those earlier awards are not included in these totals.",
    sources: [{ name: "UEFA", url: "https://www.uefa.com/uefachampionsleague/news/0254-0e99d68ce583-a9362a08b3eb-1000--who-has-won-the-uefa-men-s-player-of-the-year-award/" }],
  },
};

export const honoursNavigation = [
  { href: "/honours", label: "Overall trophies" },
  ...awardSlugs.map(slug => ({ href: `/${slug}`, label: awardComparisons[slug].label })),
];

export function isAwardSlug(slug: string): slug is AwardSlug {
  return awardSlugs.some(value => value === slug);
}

export function awardTotals(slug: AwardSlug): Record<PlayerId, number> {
  const award = awardComparisons[slug];
  return award.wins ? { messi: award.wins.messi.length, ronaldo: award.wins.ronaldo.length } : award.rows![0].values;
}

export function awardRows(slug: AwardSlug): AwardRow[] {
  const award = awardComparisons[slug];
  if (award.rows) return award.rows;
  const wins = award.wins!;
  return [...new Set([...wins.messi, ...wins.ronaldo])].sort().reverse().map(edition => ({
    label: edition, values: { messi: Number(wins.messi.includes(edition)), ronaldo: Number(wins.ronaldo.includes(edition)) },
  }));
}
