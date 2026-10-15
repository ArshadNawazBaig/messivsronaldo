import { getPublishedArticles } from "@/lib/blog/server";
import Link from "@/components/localized-link";
import { comparisonQuestions } from "@/lib/comparison-copy";
import { getI18n } from "@/lib/i18n/server";
import type { PublishedData } from "@/lib/published-data";

export async function ComparisonQuestions({ slug, data }: { slug: string; data: PublishedData }) {
  const { t, locale } = await getI18n();
  const questions = comparisonQuestions(slug, data, t);
  const articleSlugs = new Set((await getPublishedArticles(locale)).map(article => article.slug));
  if (!questions.length) return null;
  return <section className="prose panel" aria-label={t("Questions about these records")} data-record-answers>
    {slug === "international" && <p><a href="https://www.messivsronaldo.app/international-stats/" target="_blank" rel="noreferrer">{t("Messi vs Ronaldo App")} · {t("International football")}</a>{" · "}<Link href="/updates">{t("Published match updates")}</Link>{" · "}<Link href="/world-cup">{t("World Cup")}</Link></p>}
    {questions.map(({ question, answer, href, link }, index) => <section key={question} id={`record-question-${index + 1}`}>
      <h2>{question}</h2><p>{answer}</p>{(!href.startsWith("/insights/") || articleSlugs.has(href.slice(10))) && <p><Link href={href}>{link}</Link></p>}
    </section>)}
  </section>;
}
