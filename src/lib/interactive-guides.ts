import type { CalculatorPreset } from "./calculator";

export const interactiveGuides = [
  {
    slug: "messi-2012-vs-ronaldo-2013-goals", category: "PEAK CALENDAR YEARS", title: "Messi 2012 vs Ronaldo 2013: 91 goals vs 69", description: "Compare Messi’s 91 goals in 69 games with Ronaldo’s 69 in 59. Explore their peak calendar years at equal appearances or minutes.",
    preset: "years" as CalculatorPreset, readTime: "3 min read", color: "blue", number: "04", published: "2026-09-25", updated: "2026-09-25", sourceIds: [] as const,
    sections: [
      { heading: "Two years, the same counting window", text: "Messi scored 91 goals in 69 appearances in 2012; Ronaldo scored 69 in 59 during 2013. Both records include competitive club matches and senior internationals from January to December. Messi’s total includes 79 for Barcelona and 12 for Argentina; Ronaldo’s includes 59 for Real Madrid and 10 for Portugal." },
      { heading: "What changes at equal appearances?", text: "Dividing goals by appearances gives about 1.319 for Messi and 1.169 for Ronaldo. At 50 appearances, those rates correspond to 65.94 and 58.47 goals. These calculated values describe the recorded scoring frequency; they are not matches that happened or a forecast." },
      { heading: "A calendar year is not a season", text: "Messi’s 2012 total spans parts of two club seasons, as does Ronaldo’s 2013 total. Do not compare either number with a league-only season. Use the calculator to change the sample, and inspect the original records before switching to minutes: equal time still leaves opponents and playing roles different." },
    ],
    citations: [
      { title: "FC Barcelona: Messi’s 91 goals in 2012", url: "https://www.fcbarcelona.com/en/football/first-team/news/1670444/-91-/featured" },
      { title: "UEFA: Ronaldo’s 69 goals in 2013", url: "https://www.uefa.com/uefachampionsleague/news/0211-0e8866833d94-86d200f75b0a-1000--cristiano-ronaldo-takes-2013-by-storm/" },
      { title: "2012 calendar-year records", url: "https://www.messivsronaldo.app/calendar-year-stats/2012/" },
      { title: "2013 calendar-year records", url: "https://www.messivsronaldo.app/calendar-year-stats/2013/" },
    ],
  },
  {
    slug: "messi-2011-12-vs-ronaldo-2014-15-la-liga", category: "LA LIGA PEAKS", title: "Messi 2011/12 vs Ronaldo 2014/15: 50 vs 48 La Liga goals", description: "Messi scored 50 in 37 league appearances; Ronaldo scored 48 in 35. Compare the totals and see why the per-match order changes.",
    preset: "league" as CalculatorPreset, readTime: "3 min read", color: "coral", number: "05", published: "2026-09-25", updated: "2026-09-25", sourceIds: ["liga"] as const,
    sections: [
      { heading: "The total and the rate have different leaders", text: "Messi scored 50 La Liga goals in 37 appearances in 2011/12. Ronaldo scored 48 in 35 in 2014/15. Messi leads the total by two, while Ronaldo’s 1.371 goals per appearance is slightly above Messi’s 1.351. The comparison covers league matches only." },
      { heading: "Try the same number of matches", text: "At 38 appearances, the recorded rates produce 51.35 goals for Messi and 52.11 for Ronaldo. This is multiplication, not a claim that either player would have scored that total. Substitute appearances count as matches, so this adjustment does not equalize minutes." },
      { heading: "Keep the two seasons separate", text: "These are different seasons, not a head-to-head race for the same league title. Domestic cups, Champions League matches and internationals are excluded. Our season archive has goals and appearances but no verified minutes field, so the calculator leaves the minute comparison unavailable." },
    ],
    citations: [
      { title: "FC Barcelona: Messi’s scoring records", url: "https://www.fcbarcelona.com/en/news/2070529/leo-messi-fc-barcelonas-historic-record-breaker/amp" },
      { title: "La Liga: Ronaldo’s 2014/15 season", url: "https://www.laliga.com/noticias/cristiano-ronaldo-su-temporada-201415-en-la-liga-bbva" },
    ],
  },
  {
    slug: "messi-2011-12-vs-ronaldo-2013-14-champions-league", category: "EUROPEAN SCORING PEAKS", title: "Messi 2011/12 vs Ronaldo 2013/14: 14 vs 17 Champions League goals", description: "Both played 11 matches in these Champions League campaigns. Compare 14 and 17 goals, their scoring rates and the tournament boundaries.",
    preset: "europe" as CalculatorPreset, readTime: "3 min read", color: "lime", number: "06", published: "2026-09-25", updated: "2026-09-25", sourceIds: ["liga"] as const,
    sections: [
      { heading: "An unusually clean appearance comparison", text: "Messi scored 14 Champions League goals in 11 appearances in 2011/12; Ronaldo scored 17 in 11 in 2013/14. With the same appearance count, Ronaldo leads both the total and the per-appearance rate: 1.545 against 1.273." },
      { heading: "Why the 11-match setting matters", text: "The calculator starts at 11 appearances, reproducing the actual 14 and 17 totals. Move the slider to see how the same rates scale. Changing the number of appearances cannot change which rate is higher; it changes only the size of the calculated gap." },
      { heading: "What the comparison leaves out", text: "Only the Champions League main competition is included. League goals, domestic cups, qualifying matches and penalty shootouts are excluded. Equal appearances do not mean equal minutes or opponents, and goals alone do not measure chance creation or the entire contribution to a team." },
    ],
    citations: [
      { title: "UEFA: Ronaldo’s 17-goal campaign", url: "https://www.uefa.com/uefachampionsleague/news/0252-0cdc68c5ee7f-854c7d82fcc8-1000--record-breaking-ronaldo-takes-scoring-honours/" },
      { title: "UEFA: 2012/13 statistics handbook", url: "https://www.uefa.com/MultimediaFiles/Download/competitions/Statistics/01/85/99/80/1859980_DOWNLOAD.pdf" },
    ],
  },
];
