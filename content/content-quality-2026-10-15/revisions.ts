import { localizedRevisions } from "./localized";

export type Block = { text: string } | { heading: string } | { rows: (string | number)[][] } | { link: [string, string] };
export type Revision = {
  title?: string; description?: string; summary: string; opening: Block[];
  keep?: [number, number][]; sources?: { title: string; url: string }[]; replaceSources?: boolean; reason: string;
};
const dated = "Replace the delayed answer and repetitive framing with a scope-labelled comparison, reproducible arithmetic and direct navigation; preserve selected topic-specific analysis and source conventions.";
const afa = { title: "AFA: Argentina’s 3–0 farewell win over Benin, 6 October 2026", url: "https://www.afa.com.ar/es/posts/la-seleccion-argentina-despidio-a-lionel-messi-con-una-goleada-ante-benin" };
const match = { title: "MessiStats: Argentina–Benin match record, 6 October 2026", url: "https://www.messistats.com/en/detail/1521/00" };
const letter = { title: "AFA: Messi’s international farewell announcement", url: "https://www.afa.com.ar/es/posts/gracias-dios-por-hacerme-argentino-la-despedida-de-messi-en-sus-propias-palabras" };
const miami = { title: "Inter Miami: Messi’s contract extension through 2028", url: "https://www.intermiamicf.com/news/inter-miami-cf-signs-leo-messi-to-contract-extension" };
const ronaldoStatement = { title: "Sky Sports, 7 October 2026: Ronaldo’s statement on his Portugal future", url: "https://www.skysports.com/football/news/13595921/cristiano-ronaldo-portugal-star-breaks-silence-over-national-team-walkout-in-statement" };
const ronaldoDiscipline = { title: "RTP, October 2026: Portuguese federation’s disciplinary announcement", url: "https://www.rtp.pt/noticias/selecao-nacional/decisao-da-fpf-cristiano-ronaldo-suspenso-preventivamente-de-forma-nao-automatica_d1770870" };
const nassr = { title: "Saudi Pro League: Ronaldo extends with Al Nassr until 2027", url: "https://www.spl.com.sa/en/news/ronaldo-renewal-cristiano-commits-to-al-nassr-until-2027" };

export const customRevisions: Record<string, Revision> = {
  ...localizedRevisions,
  "en/messi-final-match-argentina-2026": {
    title: "Messi’s Argentina Farewell: Benin Result, Goal and Assists",
    description: "Argentina beat Benin 3–0 on 6 October 2026. Review Messi’s farewell goal, two assists and match timeline, with AFA and MessiStats sources.",
    summary: "Argentina beat Benin 3–0 at the Monumental on 6 October 2026 in Messi’s farewell before the home crowd. MessiStats records one goal, two assists and 90 minutes for Messi. His international farewell is separate from his club career: Inter Miami’s announced contract runs through the 2028 MLS season.",
    opening: [
      { heading: "Argentina vs Benin: the completed match" },
      { rows: [["Match detail", "Recorded result"], ["Date and venue", "6 October 2026 · Estadio Monumental, Buenos Aires"], ["Competition", "Senior international friendly"], ["Full time / half time", "Argentina 3–0 Benin / 0–0"], ["Messi", "1 goal · 2 assists · 90 minutes"]] },
      { text: "AFA confirms the result, venue and farewell occasion. The individual minutes, assists and event times below come from MessiStats. This page now covers the completed game; the earlier ticket, broadcast and predicted-lineup advice has been removed." },
      { link: [afa.title, afa.url] }, { link: [match.title, match.url] },
      { heading: "How the three goals were recorded" },
      { rows: [["Minute", "Scorer", "Messi’s recorded contribution"], [48, "Nicolás Otamendi", "Assist"], [61, "Nico Paz", "Assist"], [70, "Lionel Messi", "Penalty goal"]] },
      { text: "The event sequence explains why a goals-only summary understates his involvement in this match. Messi finished one scoring move and supplied the credited final contribution to two others. The three team goals remain three team goals: adding his two assists to the team score would count the same events twice." },
      { heading: "Does the farewell penalty count as a career goal?" },
      { text: "Yes under this site’s scope: it was a penalty during a recognized senior international, not a kick in a post-match shootout. The label friendly does not automatically exclude a match. Our record includes senior A-international friendlies while excluding club preseason fixtures, exhibitions and youth football." },
      { link: ["Read the career-goal counting rules", "/insights/what-counts-as-a-career-goal"] },
      { heading: "Argentina farewell and club retirement are different questions" },
      { text: "AFA published Messi’s international farewell announcement before the Benin game. Its match report describes the last appearance before Argentina’s home crowd. Inter Miami separately announced a contract through 2028. The national-team farewell therefore must not be presented as the date on which he stopped playing all professional football." },
      { link: [letter.title, letter.url] }, { link: [miami.title, miami.url] },
      { heading: "Where to check the international totals" },
      { text: "The match record is fixed; career aggregates can be corrected later. Use the international comparison and its update log to check which matches and assist definitions are included. AFA establishes the match result here, while MessiStats supplies the detailed event attribution; they should not be described as having jointly certified every career statistic." },
      { link: ["Messi and Ronaldo’s international records", "/international"] },
      { link: ["Published match additions and corrections", "/updates"] },
    ],
    sources: [afa, match, letter, miami], replaceSources: true,
    reason: "Replace obsolete pre-match viewing/lineup advice with the completed result, sourced event timeline, counting explanation and a clear distinction between international farewell and club retirement.",
  },
  "en/messi-retirement-argentina-inter-miami-future": {
    title: "Has Messi Retired? Argentina Farewell and Inter Miami Contract",
    description: "Messi’s Argentina farewell took place on 6 October 2026. Understand what ended, his Inter Miami contract through 2028, and what remains unconfirmed.",
    summary: "Messi announced his international farewell and played Argentina’s 3–0 win over Benin on 6 October 2026. He has not announced a date for retirement from all football in the sources checked for this update. Inter Miami’s contract announcement runs through the 2028 MLS season; a contract end date is not a confirmed retirement date.",
    opening: [
      { heading: "What is confirmed as of 15 October 2026?" },
      { rows: [["Question", "Evidence and meaning"], ["Has the Argentina farewell happened?", "Yes. AFA reported the 6 October win over Benin and the farewell before the home crowd."], ["What is his club commitment?", "Inter Miami announced an extension through the 2028 MLS season."], ["Is 2028 a confirmed retirement date?", "No. The announcement establishes a contract term, not a commitment to stop playing."], ["Has a final professional match been confirmed?", "No such date is established by the sources cited here."]] },
      { link: [afa.title, afa.url] }, { link: [miami.title, miami.url] },
      { heading: "The retirement timeline" },
      { text: "AFA published Messi’s international farewell message on 31 August 2026. The home farewell followed on 6 October against Benin. The distinction matters when an older headline says his final match is still coming: the match has now taken place, but the phrase final match must retain its national-team context." },
      { link: [letter.title, letter.url] },
      { link: ["The Benin result and Messi’s match contributions", "/insights/messi-final-match-argentina-2026"] },
      { heading: "Why the Inter Miami contract does not settle retirement" },
      { text: "A contract tells readers the announced duration of an employment agreement. It does not establish future fitness, selection or a promise to retire when the term expires. The supported answer is that Miami announced an extension through 2028. A later departure, renewal or retirement would need its own announcement." },
      { heading: "What changes for Argentina?" },
      { text: "Replacing Messi is a question about tasks as well as goals. A coach must redistribute receiving between the lines, final passes, set pieces and finishing responsibility. A single successor’s goal total cannot show whether all those functions have been replaced. To assess the transition, compare the team’s chance creation and ball progression alongside the new forwards’ output. This is our football analysis, not a confirmed selection plan." },
      { heading: "How to read career records after an international farewell" },
      { text: "Keep club and international records in separate columns. A later Inter Miami goal can increase the career total while leaving Argentina’s total unchanged. Equally, a historical correction can alter a published total without another appearance. The update log identifies which kind of change occurred; an article’s editing date alone does not extend statistical coverage." },
      { link: ["Messi’s dated player profile", "/players/messi"] },
      { link: ["The match update log", "/updates"] },
      { heading: "What would change this answer?" },
      { text: "An explicit retirement statement from the player, a confirmed club announcement or a new national-team decision would require another update. A missed match, a contract anniversary or a commentator’s prediction would not by itself establish retirement. This page records the evidence available on its review date and separates that evidence from expectations about what comes next." },
    ], sources: [afa, letter, miami], replaceSources: true,
    reason: "Correct the now-completed farewell; replace speculative longevity prose with a sourced status table, timeline, contract interpretation and criteria for future updates.",
  },
  "en/cristiano-ronaldo-retirement-portugal-al-nassr-future": {
    title: "Has Ronaldo Retired? Portugal Status and Al Nassr Contract",
    description: "Ronaldo’s October 2026 statement, Portugal disciplinary developments and Al Nassr contract through 2027: what they establish about retirement.",
    summary: "Ronaldo has not announced retirement from all football in the sources checked on 15 October 2026. His October statement expressed a wish to keep competing for Portugal, while a subsequent federation disciplinary process concerns his availability. Al Nassr’s announced contract runs through 2027; that is not a confirmed retirement date.",
    opening: [
      { heading: "What the latest evidence actually establishes" },
      { rows: [["Issue", "Supported conclusion"], ["Retirement from all football", "No confirmed date in the sources checked for this article."], ["Portugal future", "His October statement says he wants to keep competing; selection and disciplinary availability are separate questions."], ["Disciplinary process", "RTP reports the federation’s provisional suspension and process opened in October."], ["Al Nassr contract", "The Saudi Pro League confirmed an extension until 2027."]] },
      { link: [ronaldoStatement.title, ronaldoStatement.url] }, { link: [ronaldoDiscipline.title, ronaldoDiscipline.url] }, { link: [nassr.title, nassr.url] },
      { heading: "Why the Portugal camp departure was not a retirement announcement" },
      { text: "Leaving one camp establishes an absence from that camp. It does not establish a permanent end to international football. Sky Sports’ 7 October report reproduces Ronaldo’s explanation of the dispute and his stated intention to compete again. That is stronger evidence of his expressed intention than a retirement prediction based solely on the earlier departure." },
      { text: "RTP subsequently reported the Portuguese federation’s disciplinary proceedings and provisional suspension. Those developments affect availability; they should not be rewritten as a voluntary retirement. This article does not infer a final disciplinary outcome, an automatic return date or a place in the next squad." },
      { heading: "Does his Al Nassr deal mean he will retire in 2027?" },
      { text: "No. The league’s June 2025 announcement confirms the contract extension until 2027. It does not announce his last match. A contract can end without a player retiring, and a retirement decision requires separate evidence. Keep the contract term, the player’s intentions and actual match participation as three distinct records." },
      { heading: "What about the final World Cup?" },
      { text: "Ronaldo described the 2026 tournament as his last World Cup in comments reported before the competition. Even that narrower farewell would not automatically mean an end to all Portugal appearances: international football also includes other competitions and friendlies. The October statement is the more recent evidence for his intention to continue competing for the national team." },
      { link: ["RTP: Ronaldo’s comments on his last World Cup", "https://www.rtp.pt/noticias/selecao-nacional/cristiano-ronaldo-revela-que-mundial2026-sera-o-ultimo-da-carreira_d1697416"] },
      { heading: "Is 1,000 goals a retirement deadline?" },
      { text: "A scoring target is not a retirement announcement. Subtract the dated career total from 1,000 to find the remaining gap, but do not turn that subtraction into a final-match prediction. Future appearances, minutes and scoring are unknown. The milestone planner lets readers enter assumptions explicitly; its output is a scenario, not a schedule." },
      { link: ["Ronaldo’s published career record", "/players/ronaldo"] }, { link: ["Explore a scoring scenario", "/milestone-planner"] },
      { heading: "How this page will distinguish future announcements" },
      { text: "A statement that he is leaving a club would change the club-status answer. An explicit international retirement would change the Portugal answer. A statement ending his playing career would change the overall answer. Treating those three claims separately prevents one ambiguous farewell headline from becoming three unsupported conclusions." },
    ], sources: [ronaldoStatement, ronaldoDiscipline, nassr], replaceSources: true,
    reason: "Replace stale 1 October coverage and generic tactical filler with the October statement, disciplinary context, separate retirement questions and dated evidence.",
  },
  "en/messi-ronaldo-2017-stats": {
    summary: "Messi scored 54 goals in 64 appearances in 2017; Ronaldo scored 53 in 60. Messi led the club total 50–42, while Ronaldo led senior international goals 11–4. Ronaldo’s rate was higher both per appearance and per 90 minutes in this dataset. The comparison covers January–December, not the 2017/18 season.",
    opening: [{ heading: "2017: the full comparison" }, { rows: [["Senior club + country · January–December 2017", "Messi", "Ronaldo"], ["Goals",54,53],["Appearances",64,60],["Minutes",5562,5180],["Goals per appearance","0.84","0.88"],["Goals per 90","0.87","0.92"],["Club goals",50,42],["Senior international goals",4,11]] }, { text: "Rates use the underlying figures before rounding: 54 ÷ 64 and 53 ÷ 60 for goals per appearance; goals × 90 ÷ minutes for goals per 90. Messi’s eight-goal club advantage minus Ronaldo’s seven-goal international advantage leaves the one-goal overall margin." }, { link: ["Explore the 2017 calendar-year record", "/seasons/2017"] }],
    keep: [[6,38],[50,53]], reason: dated,
  },
  "en/messi-stats-career-guide": {
    summary: "This guide explains the site’s 28 September 2026 snapshot of Messi’s 931 senior goals: 672 for Barcelona, 32 for PSG, 102 for Inter Miami and 125 for Argentina. The table makes that historical total reproducible. The linked player profile contains later published updates; these September figures are not today’s live tally.",
    opening: [{ heading: "Reproduce the dated career total" }, { rows: [["Team · snapshot of 28 September 2026", "Goals"],["Barcelona",672],["Paris Saint-Germain",32],["Inter Miami",102],["Club subtotal",806],["Argentina senior team",125],["Career total",931]] }, { text: "672 + 32 + 102 = 806 club goals; 806 + 125 = 931 career goals. League and Champions League goals are subsets of the club entries, so adding them again would double-count goals. Later match additions belong to the current profile and update log." }, { link: ["Messi’s latest published profile and cutoff", "/players/messi"] }],
    keep: [[10,31],[46,49]], reason: dated,
  },
  "en/ronaldo-stats-career-guide": {
    summary: "The site’s 28 September 2026 snapshot records Ronaldo on 979 senior goals: 833 for clubs and 146 for Portugal. This guide shows the component totals and explains why Real Madrid’s own attribution differs by one goal. Use the player profile for later published totals; this is a dated worked example.",
    opening: [{ heading: "Reproduce Ronaldo’s historical total" }, { rows: [["Team · snapshot of 28 September 2026", "Goals"],["Sporting CP",5],["Manchester United, both spells",145],["Real Madrid, site convention",450],["Juventus",101],["Al Nassr",132],["Club subtotal",833],["Portugal senior team",146],["Career total",979]] }, { text: "5 + 145 + 450 + 101 + 132 = 833 club goals; 833 + 146 = 979 career goals. The 21-goal gap to 1,000 applies only to this snapshot. It is not a current gap or a prediction of how many matches he will need." }, { link: ["Ronaldo’s latest published profile and cutoff", "/players/ronaldo"] }],
    keep: [[10,13],[20,34],[49,52]], reason: dated,
  },
  "en/messi-ronaldo-la-liga-records": {
    summary: "Messi leads their completed La Liga careers with 474 goals in 520 appearances, against Ronaldo’s 311 in 292 under this site’s attribution. Ronaldo leads goals per appearance, 1.07 to 0.91, and goals per 90, 1.12 to 1.01. These are full league careers, not only their overlapping seasons in Spain.",
    opening: [{ heading: "Completed La Liga careers: totals and rates" }, { rows: [["La Liga only", "Messi", "Ronaldo"],["Goals",474,311],["Appearances",520,292],["Minutes",42157,25103],["Goals per appearance","0.91","1.07"],["Goals per 90","1.01","1.12"]] }, { text: "Goals per appearance = goals ÷ appearances. Goals per 90 = goals × 90 ÷ minutes. Use the unrounded input values before displaying two decimals. Real Madrid credits Ronaldo with 312 league goals; the attribution difference and its effect are explained below." }, { link: ["Explore the La Liga comparison", "/la-liga"] }],
    keep: [[10,17],[32,41],[44,48]], reason: dated,
  },
  "en/messi-ronaldo-penalty-records": {
    title: "Messi vs Ronaldo Penalty Records: Conversion Explained",
    description: "Compare a dated, matched penalty sample: scored, attempted, unsuccessful and conversion rates. Understand shootouts and incomplete attempt coverage.",
    summary: "In the site’s 21 September 2026 snapshot, Messi scored 114 of 149 in-match penalties (76.51%) and Ronaldo 184 of 220 (83.64%). Shootouts are excluded. This historical example keeps goals and attempts on one cutoff; the current penalties page identifies later goals and any incomplete attempt coverage separately.",
    opening: [{ rows: [["In-match penalties · 21 September 2026","Messi","Ronaldo"],["Scored",114,184],["Attempts",149,220],["Unsuccessful",35,36],["Conversion","76.51%","83.64%"]] }, { heading: "Calculate conversion from the same set of kicks" }, { text: "Conversion is scored penalties ÷ attempts × 100: 114 ÷ 149 × 100 = 76.51%; 184 ÷ 220 × 100 = 83.64%. Ronaldo’s rate is 7.13 percentage points higher in this sample. Unsuccessful attempts are attempts minus scored kicks, including saves and other misses." }, { text: "The unsuccessful totals, 35 and 36, look similar but come from 149 and 220 attempts. Comparing misses without attempts hides that difference. Equally, a newly verified penalty goal must not be divided by an older attempt total: retain the matched historical rate until the attempt record is reconciled." }, { link: ["Current penalty records and coverage notes", "/penalties"] }, { heading: "What this table can and cannot establish" }, { text: "The table describes a recorded sample, not the probability of converting the next kick. It also excludes post-match shootouts. Non-penalty goals subtract only in-match penalties from the matching goal total; direct free-kick goals remain included." }],
    keep: [[10,13],[20,35],[47,50]], reason: dated,
  },
  "en/messi-ronaldo-free-kick-records": {
    summary: "The site’s 21 September 2026 snapshot gives Messi 75 direct free-kick goals and Ronaldo 65. In the Champions League subset, Ronaldo leads 12–5. These are historical goal counts, not conversion rates: a complete matching record of attempts is needed to compare accuracy. The live free-kick page has later published updates.",
    opening: [{ heading: "Direct free kicks: keep the scope attached" }, { rows: [["Snapshot · 21 September 2026","Messi","Ronaldo"],["Career direct free-kick goals",75,65],["Champions League subset",5,12],["Complete career attempt total","Not established here","Not established here"],["Career conversion percentage","Not calculated","Not calculated"]] }, { text: "The Champions League row is already inside the career total; do not add it again. Goals divided by appearances is not free-kick conversion. Conversion requires scored direct free kicks divided by direct attempts from the same match sample." }, { link: ["Latest published free-kick goals and coverage", "/free-kicks"] }],
    keep: [[10,13],[17,38]], reason: dated,
  },
  "en/messi-ronaldo-individual-awards": {
    summary: "Through the completed award editions covered by the 2025 cutoff, Messi leads Ballon d’Or wins 8–5 and European Golden Shoes 6–4. Ronaldo leads the UEFA player-award series introduced in 2011 by 3–2. These are separate award histories; adding overlapping FIFA and Ballon d’Or labels can count the same win twice.",
    opening: [{ heading: "Compare like award histories" }, { rows: [["Award scope · completed editions through 2025","Messi","Ronaldo"],["Ballon d’Or",8,5],["European Golden Shoe",6,4],["UEFA player-award series introduced in 2011",2,3],["UEFA series including its predecessor",3,4]] }, { text: "The final two rows are alternative scopes, not independent prizes to add together. The 2010–2015 FIFA Ballon d’Or editions belong in the Ballon d’Or history once. The 2026 vote is outside this completed-edition comparison." }, { link: ["The full awards timeline and counting notes", "/honours"] }],
    keep: [[6,17],[33,40],[51,55]], reason: dated,
  },
  "en/messi-vs-ronaldo-stats-guide": {
    title: "Messi vs Ronaldo Stats: How to Make a Fair Comparison",
    summary: "Choose the question first: career totals measure accumulated output; competition records narrow the sample; scoring rates account for appearances or minutes. Keep both players on the same scope, cutoff and assist definition. The worked examples below show why the leader can change without either statistic being wrong.",
    opening: [{ heading: "Choose the right comparison" }, { rows: [["Your question","Use this evidence","Check before comparing"],["Who has more career goals?","Senior club + international goal total","Same counting rules and dated match coverage"],["Who scored more frequently?","Goals per appearance or per 90","Matching appearances or verified minutes"],["Who led one competition?","That competition’s record","Main event versus qualifying; complete versus partial season"],["Who created more?","Consistent assists plus chance-creation evidence","Provider definitions; assists alone depend on finishing"],["Who won more?","Named team or individual honours","Award history, eligibility and overlapping categories"]] },
      { heading: "A worked example: Champions League goals" }, { text: "Ronaldo’s 140 goals in 183 appearances give 0.77 per game; Messi’s 129 in 163 give 0.79. Ronaldo leads the total, while Messi leads this appearance-based rate. Both describe the same records. Neither calculation makes opponents, playing time or team roles identical." },
      { link: ["Open the Champions League records", "/champions-league"] },
      { heading: "Avoid three common counting errors" }, { text: "Do not add Champions League goals to a club total that already includes them. Do not combine one provider’s assists with another provider’s subtotal without checking definitions. Do not divide an updated goal count by minutes or attempts that stop at an earlier date." },
      { link: ["Counting rules, sources and coverage", "/methodology"] },
      { heading: "What the match examples add" }, { text: "A statistical record describes outcomes; match analysis investigates how those outcomes arose. The following selected examples illustrate roles and actions that a goals column cannot capture. The official reports support the events, while the interpretation of movement and defensive choices is our analysis." },
    ], keep: [[27,45]], reason: dated,
  },
  "en/most-expensive-football-signings-neymar-s-record-and-the-biggest-deals": {
    summary: "Neymar’s €222 million move to PSG in 2017 remains the transfer-fee benchmark in the sources reviewed for this article. Compare individual deals in their reported currencies, separating initial payments from potential add-ons. A transfer fee excludes wages and does not rank a player’s ability.",
    opening: [{ heading: "Landmark transfer fees and what they include" }, { rows: [["Player and transfer","Year","Fee basis"],["Neymar · Barcelona → PSG",2017,"€222m release-clause payment"],["Mbappé · Monaco → PSG",2018,"€180m reported permanent deal following the loan"],["João Félix · Benfica → Atlético Madrid",2019,"€126m announced fee"],["Enzo Fernández · Benfica → Chelsea",2023,"€121m disclosed fee"],["Enzo Fernández · Chelsea → Manchester City",2026,"£125m reported by Sky Sports; City confirms the transfer"]] }, { text: "This is a selected comparison, not a complete ranking across currencies. The source-linked deal notes below distinguish club disclosures from reported figures. We have not assumed every potential bonus was paid or converted pounds to euros using an unstated exchange rate." }],
    keep: [[3,44]],
    reason: "Retain the useful sourced transfer explanations; add an immediately usable comparison with fee-basis labels, remove the vague introduction and consolidate existing inline references.",
  },
};
