import Link from "@/components/localized-link";
import { comparisonQuestions } from "@/lib/comparison-copy";
import { getI18n } from "@/lib/i18n/server";
import type { PublishedData } from "@/lib/published-data";

export async function ComparisonQuestions({ slug, data }: { slug: string; data: PublishedData }) {
  const { t } = await getI18n();
  const questions = comparisonQuestions(slug, data, t);
  if (!questions.length) return null;
  return <section className="prose panel" aria-label={t("Questions about these records")} data-record-answers>
    {questions.map(({ question, answer, href, link }, index) => <section key={question} id={`record-question-${index + 1}`}>
      <h2>{question}</h2><p>{answer}</p><p><Link href={href}>{link}</Link></p>
    </section>)}
  </section>;
}
