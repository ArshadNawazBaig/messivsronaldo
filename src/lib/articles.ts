import { scopes, snapshotLabel } from "@/lib/data";

export const articles = [
  {
    slug: "why-assist-totals-differ", category: "THE DETAILS MATTER", title: "An assist isn’t always an assist.", description: "Why two trusted sources can give you two different answers — and how to compare fairly.", readTime: "4 min read", color: "blue", number: "01",
    sections: [
      { heading: "Start with the definition", text: "A goal assist, a fantasy assist and a secondary assist describe different contributions. A pass to the scorer may qualify as a conventional assist, while a rebound or a penalty won may be counted by a broader fantasy system. Adding these categories together changes the question being answered." },
      { heading: "Keep the source consistent", text: "For its Champions League history, UEFA lists Cristiano Ronaldo with 42 assists and Lionel Messi with 40. This site uses those UEFA figures for that competition. A different provider may classify individual incidents differently. A difference is a reason to inspect the underlying events, not to silently replace one number with another." },
      { heading: "What our comparison includes", text: "Our Champions League view combines goals and assists only within UEFA's published coverage. The career view uses the secondary reference’s conventional-assist totals, while this Champions League view keeps UEFA’s definition. Do not subtract an assist subtotal from a different provider’s career total." },
    ], sourceIds: ["uefa"] as const,
  },
  {
    slug: "totals-vs-scoring-rates", category: "A FAIRER COMPARISON", title: "More goals. Or more goals per game?", description: "Career totals and scoring rates tell different parts of the same remarkable story.", readTime: "3 min read", color: "coral", number: "02",
    sections: [
      { heading: "Volume and efficiency answer different questions", text: "A career total measures accumulated scoring. Goals per appearance measures average scoring in matches played. Neither metric replaces the other: one values sustained output, while the other describes frequency within a defined sample." },
      { heading: "The Champions League example", text: "Ronaldo's 140 goals in 183 appearances yield approximately 0.77 goals per game. Messi's 129 goals in 163 appearances yield approximately 0.79. Ronaldo leads this total and Messi leads this rate. Both observations can be true at the same time." },
      { heading: "An appearance is not 90 minutes", text: "A five-minute substitute appearance and a full match both count as one appearance. Goals per 90 minutes helps address that difference, but it needs reliable minutes for the same matches. We do not estimate missing minutes or label goals per game as goals per 90." },
      { heading: "Context remains essential", text: "Even a rate adjustment does not account for opposition, teammates, tactics or a player's role. Use the competition filters to narrow the question, read the coverage note, and avoid presenting one metric as a complete evaluation of a footballer." },
    ], sourceIds: ["uefa"] as const,
  },
  {
    slug: "what-counts-as-a-career-goal", category: "BEHIND THE NUMBERS", title: "What counts as a career goal?", description: "Friendlies, shootouts and youth football: the small print behind a very big number.", readTime: "3 min read", color: "lime", number: "03",
    sections: [
      { heading: "Define the match before counting the goal", text: "Our career comparison uses senior competitive club football and senior A internationals. Club friendlies, exhibition fixtures, reserve teams and youth matches are excluded. Recognized senior international friendlies are included; they belong to a different category from club preseason games." },
      { heading: "Keep penalty shootouts separate", text: "A penalty scored during normal or extra time contributes to the match score and to the player's goal total. A successful kick in a penalty shootout decides the outcome of a tie but is not added to that player's match goals. Combining the two would inflate career totals." },
      { heading: "A date is part of the statistic", text: `The career totals in this release are ${scopes.career.goals.messi} for Messi and ${scopes.career.goals.ronaldo} for Ronaldo, updated through ${snapshotLabel}. They follow the named statistical reference’s senior-match scope. Always keep the date attached: a reviewed total needs another update after subsequent matches.` },
      { heading: "Understand the overlap", text: "Champions League goals are already included in club goals. Club and senior international goals together make the career total. The comparison table displays useful subsets, not a list of independent categories to add together." },
    ], sourceIds: ["reference", "iffhs"] as const,
  },
] as const;

export function getArticle(slug: string) { return articles.find(article => article.slug === slug); }
