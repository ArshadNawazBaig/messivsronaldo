import { interactiveGuides } from "./interactive-guides";
import { ballonArticles } from "./ballon-articles";
import type { Article } from "./article-types";
import { withArticleFeature } from "./article-features";

export type { Article } from "./article-types";

const seedArticles: readonly Article[] = [
  ...ballonArticles,
  ...interactiveGuides.map(article => ({ ...article, players: ["messi", "ronaldo"] as const })),
  {
    players: ["messi", "ronaldo"],
    slug: "why-assist-totals-differ", category: "ASSIST DEFINITIONS", title: "An assist isn’t always an assist.", description: "Why two trusted sources can give you two different answers — and how to compare fairly.", readTime: "4 min read", color: "blue", number: "01",
    updated: "2026-10-01",
    summary: "Compare assists only after matching the provider, competition and cutoff. A broader definition records different actions; a bigger total does not by itself establish better creativity.",
    citations: [{ title: "Opta event definitions", url: "https://www.statsperform.com/opta-event-definitions/" }],
    tables: [{
      caption: "Four contributions, four separate records",
      columns: ["Illustrative event", "Category to investigate"],
      rows: [
        { cells: ["A final pass followed by a goal", "Goal assist"] },
        { cells: ["A saved shot followed by a teammate’s goal", "Fantasy assist: rebound"] },
        { cells: ["A foul won before a teammate scores the penalty", "Fantasy assist: penalty won"] },
        { cells: ["A pass to the player who supplies the final pass", "Second assist"] },
      ],
      note: "Hypothetical events in separate matches, using Opta’s category distinctions. This is not a match log for either player.",
    }],
    sections: [
      { heading: "Start with the definition", text: "A goal assist, a fantasy assist and a secondary assist describe different contributions. A pass to the scorer may qualify as a conventional assist, while a rebound or a penalty won may be counted by a broader fantasy system. Adding these categories together changes the question being answered." },
      { heading: "Keep the source consistent", text: "For its Champions League history, UEFA lists Cristiano Ronaldo with 42 assists and Lionel Messi with 40. This site uses those UEFA figures for that competition. A different provider may classify individual incidents differently. A difference is a reason to inspect the underlying events, not to silently replace one number with another." },
      { heading: "What our comparison includes", text: "Our Champions League view combines goals and assists only within UEFA's published coverage. The career view uses the secondary reference’s conventional-assist totals, while this Champions League view keeps UEFA’s definition. Do not subtract an assist subtotal from a different provider’s career total." },
      { heading: "Read the event ledger", text: "The example above contains one goal assist, two fantasy-assist events and one second assist. Calling the combined four an assist total would hide the distinction. Keeping separate columns lets a reader reproduce the conventional total and still examine other contributions. Real incidents also need the provider’s detailed rules, including how defensive touches affect the classification." },
      { heading: "Resolve a disagreement at match level", text: "First align the competition, dates and matches covered. Then compare the disputed events, recording the scorer, minute, final attacking action and each source’s decision. A one-assist difference could reflect classification or coverage; the totals alone cannot tell you which. Send those details and both source links through Contact so a correction can be assessed against the published definition." },
      { heading: "What the number leaves out", text: "An assist depends on a teammate finishing the chance. It does not record every useful pass, the difficulty of the opportunity or an earlier action that opened the defence. Use assists to describe credited outcomes, then consult chance-creation evidence before making a wider claim about creativity. Our table does not measure the quality of every chance created." },
    ], sourceIds: ["uefa"] as const,
  },
  {
    players: ["messi", "ronaldo"],
    slug: "totals-vs-scoring-rates", category: "SCORING RATES", title: "More goals. Or more goals per game?", description: "Career totals and scoring rates tell different parts of the same remarkable story.", readTime: "3 min read", color: "coral", number: "02",
    updated: "2026-10-01",
    summary: "Show the total, the sample size and the rate together. Calculate rates from matching records, combine the underlying totals before dividing, and keep projections separate from observed goals.",
    tables: [{
      caption: "Combining two fictional playing samples",
      columns: ["Sample", "Goals", "Minutes played", "Goals per 90 minutes"],
      rows: [
        { cells: ["Short sample", 1, 90, "1.00"] },
        { cells: ["Long sample", 9, 1800, "0.45"] },
        { cells: ["Combined sample", 10, 1890, "0.48"] },
      ],
      note: "Illustrative arithmetic, not Messi or Ronaldo match records. Combined rate: 10 × 90 ÷ 1,890, rounded only for display.",
    }],
    sections: [
      { heading: "Volume and efficiency answer different questions", text: "A career total measures accumulated scoring. Goals per appearance measures average scoring in matches played. Neither metric replaces the other: one values sustained output, while the other describes frequency within a defined sample." },
      { heading: "The Champions League example", text: "Ronaldo's 140 goals in 183 appearances yield approximately 0.77 goals per game. Messi's 129 goals in 163 appearances yield approximately 0.79. Ronaldo leads this total and Messi leads this rate. Both observations can be true at the same time." },
      { heading: "An appearance is not 90 minutes", text: "A five-minute substitute appearance and a full match both count as one appearance. Goals per 90 minutes helps address that difference, but it needs reliable minutes for the same matches. We do not estimate missing minutes or label goals per game as goals per 90." },
      { heading: "Context remains essential", text: "Even a rate adjustment does not account for opposition, teammates, tactics or a player's role. Use the competition filters to narrow the question, read the coverage note, and avoid presenting one metric as a complete evaluation of a footballer." },
      { heading: "Calculate before rounding", text: "Divide the original goals by appearances: 140 ÷ 183 and 129 ÷ 163. Keep that precision until the final display. Multiplying the rounded 0.77 by 183 gives 140.91, which is not Ronaldo’s recorded total. For a per-90 calculation, use goals × 90 ÷ minutes from exactly the same competition and dates; leave the rate unavailable if minutes are missing." },
      { heading: "Why averaging seasons fails", text: "In the fictional table, averaging 1.00 and 0.45 gives about 0.73 goals per 90. That gives a 90-minute sample the same weight as 1,800 minutes. Combining ten goals and 1,890 minutes instead gives about 0.48. When comparing several seasons, sum their goals and minutes first. Do not average displayed rates or add overlapping competition samples." },
      { heading: "A rate is not a forecast", text: "One goal in 30 minutes produces a rate of 3.00 per 90. It does not demonstrate that the player will score three times in a full match. Substitutions, opponents and game state can affect the sample. Our calculator scales a historical rate to illustrate arithmetic; it does not predict future form or adjust for competition strength." },
    ], sourceIds: ["uefa"] as const,
  },
  {
    players: ["messi", "ronaldo"],
    slug: "what-counts-as-a-career-goal", category: "COUNTING RULES", title: "What counts as a career goal?", description: "Friendlies, shootouts and youth football: the small print behind a very big number.", readTime: "3 min read", color: "lime", number: "03",
    updated: "2026-10-01",
    summary: "Our career total combines senior competitive club goals and recognized senior international goals. Count each goal once, keep shootouts separate and attach a source and cutoff date.",
    citations: [{ title: "IFAB Law 10: determining the outcome of a match", url: "https://www.theifab.com/laws/latest/determining-the-outcome-of-a-match/" }],
    tables: [{
      caption: "A fictional goal ledger under our counting rules",
      columns: ["Match or event", "Goals recorded", "Added to career total"],
      rows: [
        { cells: ["Senior competitive club match", 2, 2] },
        { cells: ["Recognized senior international friendly", 1, 1] },
        { cells: ["Club preseason friendly", 1, 0] },
        { cells: ["Penalty shootout: successful kick", 1, 0] },
        { cells: ["Youth-team match", 2, 0] },
      ],
      note: "This invented example contributes three career goals. It illustrates this site’s scope, not a real player’s match history.",
    }],
    sections: [
      { heading: "Define the match before counting the goal", text: "Our career comparison uses senior competitive club football and senior A internationals. Club friendlies, exhibition fixtures, reserve teams and youth matches are excluded. Recognized senior international friendlies are included; they belong to a different category from club preseason games." },
      { heading: "Keep penalty shootouts separate", text: "A penalty scored during normal or extra time contributes to the match score and to the player's goal total. A successful kick in a penalty shootout decides the outcome of a tie but is not added to that player's match goals. Combining the two would inflate career totals." },
      { heading: "A date is part of the statistic", text: "Read the cutoff beside the career comparison and check the update log before sharing a total. An article’s editing date does not extend the match coverage of the database. Later matches and corrections can change the number. Preserve the source, scope and cutoff together so someone reading a screenshot can tell which record it represents." },
      { heading: "Understand the overlap", text: "Champions League goals are already included in club goals. Club and senior international goals together make the career total. The comparison table displays useful subsets, not a list of independent categories to add together." },
      { heading: "Reproduce the total from a ledger", text: "The fictional example adds two competitive club goals and one recognized senior international goal. The preseason goal, youth goals and shootout kick stay outside this total. A label such as friendly is not enough to decide: check whether it was a club fixture or a recognized senior international. Keep excluded records separate rather than deleting the evidence." },
      { heading: "Treat corrections as changes to evidence", text: "If a scorer attribution or match classification changes, compare the official match record with the provider entry before adjusting a total. Record the affected match, old value, new value and supporting link. A match appearing twice in an import should be reconciled, not counted twice. Readers can use our correction form to submit that evidence without needing to propose an entire new career total." },
    ], sourceIds: ["reference", "iffhs"] as const,
  },
] as const;

export const articles: readonly Article[] = seedArticles.map(withArticleFeature);

export function getArticle(slug: string) { return articles.find(article => article.slug === slug); }
