import type { Article } from "./article-types";

// Editorial snapshots, separate from the Messi/Ronaldo match ledger. Every
// sample is named; no 2026/27 form is counted as 2026 award evidence.
export const ballonReviewed = "2026-09-27";
export const ballonSources = {
  nominees: { title: "UEFA · 2026 nominees", url: "https://www.uefa.com/uefachampionsleague/news/02a9-218b019cbca5-cb4b9be51c4b-1000--2026-ballon-d-or-awards-nominees-revealed/" },
  ceremony: { title: "UEFA · 2026 ceremony", url: "https://www.uefa.com/ballondor/news/02a5-20bba5196317-e0e34001e13b-1000--2026-ballon-d-or-ceremony-date-and-host-city-announced/" },
  rules: { title: "France Football · 2026 regulations", url: "https://ballondor.com/news/posts/check-all-the-criteria-and-full-regulations-to-understand-ballon-dor-2026-trophy" },
  kane: { title: "FC Bayern · 2025/26 season", url: "https://fcbayern.com/en/news/2026/05/europes-best-goalscorer-harry-kane-wins-golden-shoe" },
  kaneBreakdown: { title: "FC Bayern · competition breakdown", url: "https://fcbayern.com/en/news/2026/08/why-harry-kane-is-the-best-striker-in-the-world" },
  mbappe: { title: "Real Madrid · 2025/26 season", url: "https://www.realmadrid.com/en-US/news/football/first-team/latest-news/mbappe-jugador-mahou-cinco-estrellas-de-la-temporada-27-05-2026" },
  ucl: { title: "UEFA · 2025/26 Champions League scoring", url: "https://www.uefa.com/uefachampionsleague/news/029d-1ec1670159ea-2d1882e6a430-1000/" },
  kvaratskhelia: { title: "UEFA · Kvaratskhelia’s season", url: "https://www.uefa.com/uefachampionsleague/news/02a5-20c1d7bf915e-f9e703cf0108-1000/" },
  yamal: { title: "FC Barcelona · Yamal’s La Liga season", url: "https://www.fcbarcelona.com/en/news/4514485/lamine-yamal-202526-laliga-player-of-the-season" },
  worldCup: { title: "FIFA · 2026 World Cup awards", url: "https://inside.fifa.com/organisation/news/spain-crowned-world-cup-2026-champions-new-york-new-jersey?entryId=1cnHei1Mz6t4TxBT0CFxRv&requester=MediaHub" },
} as const;
const s = ballonSources;
export const ballonSlugs = ["ballon-dor-2026-contenders-stats", "kane-vs-mbappe-ballon-dor-2026-stats", "ballon-dor-2026-date-voting-rules"] as const;

export const ballonArticles: readonly Article[] = [
  {
    slug: ballonSlugs[0], category: "BALLON D’OR 2026", title: "Ballon d’Or 2026 contenders: the stats behind the debate",
    description: "Compare Kane, Mbappé, Yamal and PSG’s contenders using verified season stats. Messi’s nomination, the World Cup and the judging window explained.",
    readTime: "4 min read", color: "lime", number: "07", published: ballonReviewed, updated: ballonReviewed, sourceIds: [],
    image: { path: "/images/articles/ballon-dor-2026-contenders.png", alt: "Ballon d’Or 2026 contenders: Kane, Mbappé, Yamal and Kvaratskhelia, with clearly labelled scoring samples." },
    summary: "Harry Kane’s 61 club goals, Kylian Mbappé’s 15 Champions League goals and Khvicha Kvaratskhelia’s European title offer different arguments. Lamine Yamal and Rodri bring Spain’s World Cup success into the discussion. This is our evidence-led comparison of selected nominees, not an official ranking or a prediction of the vote.",
    tables: [{ caption: "Selected contenders: verified evidence and its scope", columns: ["Player", "Published record", "Competition / period"], rows: [
      { cells: ["Harry Kane", "61 goals in 51 appearances", "Bayern · All club competitions · 2025/26"], citations: [s.kane] },
      { cells: ["Kylian Mbappé", "42 goals in 44 appearances", "Real Madrid · All club competitions · 2025/26"], citations: [s.mbappe] },
      { cells: ["Khvicha Kvaratskhelia", "10 goals and 6 assists", "Champions League · 2025/26"], citations: [s.kvaratskhelia] },
      { cells: ["Ousmane Dembélé", "8 goals", "Champions League · 2025/26"], citations: [s.ucl] },
      { cells: ["Michael Olise", "8 assists", "Champions League · 2025/26"], citations: [s.ucl] },
      { cells: ["Lamine Yamal", "16 goals and 11 assists", "La Liga · 2025/26"], citations: [s.yamal] },
      { cells: ["Rodri", "Golden Ball winner", "World Cup · 2026"], citations: [s.worldCup] },
    ], note: "The rows cover different competitions. They identify each player’s case; they are not a like-for-like scoring leaderboard. Club figures exclude international matches." }],
    sections: [
      { heading: "Who are the Ballon d’Or 2026 contenders?", text: "UEFA’s shortlist includes every player in the table, as well as Lionel Messi. We have selected these cases to examine scoring, creativity and tournament impact. Nomination confirms eligibility for the final vote; it does not reveal a player’s position. No voting order is inferred from the order of our table.", citations: [s.nominees] },
      { heading: "Kane and Mbappé: two different scoring leads", text: "Kane leads their published club-season totals by 19 goals. Mbappé leads their Champions League totals by one, 15 to 14. That change of leader matters: a claim about who scored more needs a competition attached. Neither comparison alone measures the quality of every performance or the difficulty of each opponent.", citations: [s.kane, s.mbappe, s.ucl] },
      { heading: "Why creators and tournament performers belong in the debate", text: "Kvaratskhelia combined scoring and assists with UEFA’s Champions League Player of the Season award. Yamal’s league record includes 11 assists alongside 16 goals. Rodri’s World Cup Golden Ball illustrates why a goals-only model can overlook a midfielder. Our assessment is to compare roles and decisive performances before treating any one total as a verdict.", citations: [s.kvaratskhelia, s.yamal, s.worldCup] },
      { heading: "Is Messi nominated, and has anyone won yet?", text: "Messi is on the official men’s shortlist. Cristiano Ronaldo is not on that published list. As of 27 September 2026, the ceremony is still ahead, on 26 October in London. A nominee list, a social-media poll and a pundit’s power ranking are different things; none is the official final result.", citations: [s.nominees, s.ceremony] },
      { heading: "Which performances count toward the 2026 award?", text: "The reference window runs from 3 August 2025 to 19 July 2026. The World Cup is included; the new club season is outside that window. Keep calendar-year totals, career totals and award-period evidence separate. That also means our live Messi–Ronaldo career comparison answers a different question from this article.", citations: [s.rules] },
    ], citations: [s.nominees, s.kane, s.mbappe, s.ucl, s.kvaratskhelia, s.yamal, s.worldCup, s.rules, s.ceremony], relatedSlugs: [ballonSlugs[1], ballonSlugs[2]],
  },
  {
    slug: ballonSlugs[1], category: "CONTENDER COMPARISON", title: "Kane vs Mbappé: 2025/26 stats for the Ballon d’Or debate",
    description: "Kane scored 61 club goals; Mbappé scored 42. Compare appearances, goals per game and Champions League records without mixing competition scopes.",
    readTime: "3 min read", color: "blue", number: "08", published: ballonReviewed, updated: ballonReviewed, sourceIds: [],
    image: { path: "/images/articles/kane-vs-mbappe-2026.png", alt: "Harry Kane 61 and Kylian Mbappé 42: goals in all club competitions in 2025/26." },
    summary: "Kane scored more across the 2025/26 club season: 61 goals in 51 matches, against Mbappé’s 42 in 44. In the Champions League, Mbappé led 15–14 and also had the higher goals-per-appearance rate. These are club records, not complete club-and-country totals for the Ballon d’Or voting period.",
    tables: [{ caption: "Kane vs Mbappé: published 2025/26 club records", columns: ["Statistic and scope", "Harry Kane", "Kylian Mbappé"], rows: [
      { cells: ["All club competitions · Goals", 61, 42], citations: [s.kane, s.mbappe] },
      { cells: ["All club competitions · Appearances", 51, 44], citations: [s.kane, s.mbappe] },
      { cells: ["All club competitions · Goals per appearance", (61 / 51).toFixed(2), (42 / 44).toFixed(2)], citations: [s.kane, s.mbappe] },
      { cells: ["Champions League · Goals", 14, 15], citations: [s.kaneBreakdown, s.ucl] },
      { cells: ["Champions League · Appearances", 13, 11], citations: [s.kaneBreakdown, s.ucl] },
      { cells: ["Champions League · Goals per appearance", (14 / 13).toFixed(2), (15 / 11).toFixed(2)], citations: [s.kaneBreakdown, s.ucl] },
    ], note: "Rates are goals divided by appearances, rounded to two decimals. A substitute appearance counts as one match. These are not per-90 rates. Champions League goals are already included in all-competition club totals." }],
    sections: [
      { heading: "Who scored more goals in 2025/26?", text: "Kane’s lead is 19 goals in the clubs’ published season reviews, with seven more appearances. His rate is about 1.20 goals per match; Mbappé’s is about 0.95. A larger total and a higher rate strengthen the scoring argument, but these players faced different league schedules. The table does not adjust for opposition strength.", citations: [s.kane, s.mbappe] },
      { heading: "Why does Mbappé lead the Champions League comparison?", text: "Mbappé scored 15 in 11 appearances, approximately 1.36 per match. Kane scored 14 in 13, approximately 1.08. The shared competition makes this a narrower comparison than their domestic seasons. It still does not equalize minutes, knockout opponents or the match situations in which each goal was scored.", citations: [s.ucl, s.kaneBreakdown] },
      { heading: "What would a fair Ballon d’Or argument add?", text: "Start with these records, then examine chance creation, decisive matches, team achievements and international performances within the judging window. Treating 61 club goals as a complete award score would skip those questions. Treating a one-goal European lead as decisive would do the same. Our table is evidence for the debate, not a ballot simulator.", citations: [s.rules] },
      { heading: "Can we compare assists or goals per 90 here?", text: "Not from this table. We have not established a complete, consistent assist-and-minute dataset for both club seasons in the cited season summaries. An omitted figure is not zero. Goals per appearance is the calculation supported by the displayed goals and matches; adding a per-90 label would require verified playing time for the same sample." },
    ], citations: [s.kane, s.mbappe, s.ucl, s.kaneBreakdown, s.rules], relatedSlugs: [ballonSlugs[0], ballonSlugs[2]],
  },
  {
    slug: ballonSlugs[2], category: "AWARD EXPLAINER", title: "Ballon d’Or 2026: ceremony date, voting and judging period",
    description: "The 2026 Ballon d’Or is on 26 October in London. Find the judging dates, who votes, the points system and how the World Cup counts.",
    readTime: "3 min read", color: "coral", number: "09", published: ballonReviewed, updated: ballonReviewed, sourceIds: [],
    image: { path: "/images/articles/ballon-dor-2026-guide.png", alt: "Ballon d’Or 2026: 26 October, London; judging window 3 August 2025 to 19 July 2026." },
    summary: "The 2026 Ballon d’Or ceremony is scheduled for Monday 26 October at the London Palladium Theatre. The men’s award considers performances from 3 August 2025 through 19 July 2026. A specialist journalists’ jury decides the award; it is not decided by an online public poll.",
    tables: [{ caption: "Ballon d’Or 2026: confirmed dates and voting facts", columns: ["Question", "Confirmed information"], rows: [
      { cells: ["Ceremony date", "26 October 2026"], citations: [s.ceremony] },
      { cells: ["Venue", "London Palladium Theatre"], citations: [s.nominees] },
      { cells: ["Judging period", "3 August 2025 – 19 July 2026"], citations: [s.rules] },
      { cells: ["Men’s jury", "One journalist from each of the top 100 FIFA-ranked nations"], citations: [s.rules] },
      { cells: ["Players ranked per ballot", 10], citations: [s.rules] },
      { cells: ["Points, first to tenth", "15, 12, 10, 8, 7, 5, 4, 3, 2, 1"], citations: [s.rules] },
    ], note: "Checked against official announcements on 27 September 2026. The winner has not been announced at this publication date." }],
    sections: [
      { heading: "Does the 2026 World Cup count?", text: "Yes. The judging period ends on the World Cup final date, 19 July 2026, and the regulations expressly include international competition. A useful contender comparison therefore needs both club and national-team context. It should not add September 2026 goals simply because the trophy is presented later in the year.", citations: [s.rules] },
      { heading: "What do the voters judge?", text: "The ordered criteria are individual performance, then team results and trophies, then sporting conduct. Our reading is that a convincing statistical case should explain how a player influenced matches, not simply attach a medal count to a scoring total. There is no published formula that converts goals and assists into a guaranteed winning score.", citations: [s.rules] },
      { heading: "How does the points system work?", text: "Each juror orders ten players. The points in the table reward the higher choices; the highest combined score wins. If totals are tied, first-place selections separate the players, then second places and so on. A prediction article cannot reproduce the outcome without the ballots, so treat precise winning probabilities as model estimates rather than official information.", citations: [s.rules] },
      { heading: "Can fans vote for the men’s Ballon d’Or?", text: "The deciding jury is made up of journalists under the published rules. A fan vote on a website or social platform does not become a Ballon d’Or ballot. We link the official nominees and regulations so readers can distinguish the award process from discussion around it.", citations: [s.rules, s.nominees] },
    ], citations: [s.ceremony, s.nominees, s.rules], relatedSlugs: [ballonSlugs[0], ballonSlugs[1]],
  },
];
