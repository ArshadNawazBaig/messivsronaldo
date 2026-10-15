import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { commandSchema, documentText, draftSchema, validatePublication, type BlogPost, type RichNode } from "../src/lib/blog/model";

const paragraph = (text: string): RichNode => ({ type: "paragraph", content: [{ type: "text", text }] });
const heading = (text: string): RichNode => ({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] });
const currentPenalties: RichNode = { type: "paragraph", content: [
  { type: "text", text: "For the latest published goal totals and their individual coverage notes, open the " },
  { type: "text", text: "penalty statistics page", marks: [{ type: "link", attrs: { href: "/penalties" } }] },
  { type: "text", text: ". This example remains fixed at 21 September 2026; its revision date does not extend the statistical cutoff." },
] };

// Prepare revision-checked SAVE commands only. This script has no network or
// database writes; publication remains a separate, reviewable operation.
export function prepareSeoArticle(post: BlogPost) {
  if (post.locale !== "en" || post.deleted || !post.published) throw new Error("Expected an existing published English article.");
  if (post.draftChanged) throw new Error(`Preserve the pending editorial draft for ${post.slug} before preparing this revision.`);
  const draft = structuredClone(post.draft);
  if (post.slug === "messi-2012-vs-ronaldo-2013-goals") {
    draft.title = "Messi 2012 vs Ronaldo 2013: Goals and Scoring Rates";
    draft.description = "Messi scored 91 goals in 2012; Ronaldo scored 69 in 2013. Compare calendar-year totals, goals per game and an equal-appearance calculation.";
    draft.summary = "Lionel Messi scored 91 goals in 69 appearances in 2012. Cristiano Ronaldo scored 69 goals in 59 appearances in 2013. Both figures cover senior club and country football within January–December. Messi scored 22 more goals across 10 more appearances; the scoring rates were 1.32 and 1.17 goals per appearance.";
    // The shared template supplies the sourced table, CSV and scope links once,
    // above the cover. Existing tactical sections and citations remain intact.
  } else if (post.slug === "messi-ronaldo-penalty-records") {
    draft.title = "Messi vs Ronaldo Penalty Records: Conversion Explained";
    draft.description = "How Messi and Ronaldo’s penalty conversion rates are calculated, why shootouts are separate, and what dated attempts reveal about goals and misses.";
    draft.summary = "In The Rivalry’s snapshot of 21 September 2026, Messi scored 114 of 149 in-match penalties and Ronaldo scored 184 of 220. That gives conversion rates of 76.51% and 83.64%. The example excludes penalty shootouts and preserves one common cutoff. For the latest published goal totals and their coverage notes, open the penalty statistics page.";
    const calculationHeading = "How is penalty conversion calculated?";
    if (!draft.body.content?.some(node => node.type === "heading" && documentText(node) === calculationHeading)) {
      const table: RichNode = { type: "table", content: [
        ["In-match penalties · 21 September 2026", "Messi", "Ronaldo"],
        ["Scored", "114", "184"], ["Attempts", "149", "220"],
        ["Unsuccessful attempts", "35", "36"], ["Conversion", "76.51%", "83.64%"],
      ].map((row, rowIndex) => ({ type: "tableRow", content: row.map((text, column) => ({ type: rowIndex === 0 || column === 0 ? "tableHeader" : "tableCell", content: [paragraph(text)] })) })) };
      draft.body.content = [table,
        paragraph("Historical example from the site’s dated statistical reference. Shootout attempts are excluded. These are not presented as today’s complete totals."),
        currentPenalties,
        heading(calculationHeading),
        paragraph("Penalty conversion is scored penalties divided by attempts, multiplied by 100. Here, 114 ÷ 149 × 100 = 76.51%, and 184 ÷ 220 × 100 = 83.64%. Unsuccessful attempts are attempts minus scored penalties, including saves and other misses."),
        paragraph("Ronaldo’s conversion rate in this sample is 7.13 percentage points higher. His 36 unsuccessful attempts should not be compared with Messi’s 35 without also comparing their 220 and 149 attempts. The percentage describes this historical sample; it does not predict the next kick."),
        heading("Why might current goals and conversion have different dates?"),
        paragraph("A new scored penalty can be verified before every attempt in the wider record has been checked. A current goal total must not be divided by an older attempt total. Use the scored and attempted counts from the same verified sample, or keep the previous conversion example clearly dated until the missing attempts are reconciled."),
        paragraph("Match penalties and post-match shootouts answer different questions. Keep them in separate records so the numerator and denominator describe the same type of kick."),
        ...(draft.body.content ?? []),
      ];
    }
  } else throw new Error(`No SEO revision specified for ${post.slug}.`);
  const validated = draftSchema.parse(draft);
  validatePublication(validated);
  return commandSchema.parse({ action: "save", id: post.id, revision: post.revision, locale: post.locale, slug: post.slug, draft: validated });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error("Usage: npx tsx scripts/prepare-seo-articles.ts <current-posts.json> <draft-commands.json>");
  const posts = (JSON.parse(readFileSync(input, "utf8")) as { posts: BlogPost[] }).posts;
  const targets = ["messi-2012-vs-ronaldo-2013-goals", "messi-ronaldo-penalty-records"];
  const commands = targets.map(slug => {
    const post = posts.find(item => item.locale === "en" && item.slug === slug);
    if (!post) throw new Error(`Missing current CMS record: ${slug}`);
    return prepareSeoArticle(post);
  });
  writeFileSync(output, JSON.stringify({ preparedAt: new Date().toISOString(), commands }, null, 2) + "\n");
  console.log(`Prepared ${commands.length} English draft commands. No content was saved or published.`);
}
