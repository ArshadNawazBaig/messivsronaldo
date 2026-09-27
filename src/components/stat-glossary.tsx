import { getPublishedArticles } from "@/lib/blog/server";
import Link from "@/components/localized-link";
import { getI18n } from "@/lib/i18n/server";
import { glossarySchema, glossaryTerms } from "@/lib/stat-glossary";
import { jsonLd, siteUrl } from "@/lib/site";
import styles from "./semantics.module.css";

export async function StatGlossary() {
  const { t, locale } = await getI18n();
  const articleAvailable = (await getPublishedArticles(locale)).some(article => article.slug === "why-assist-totals-differ");
  return <div className={styles.glossary} data-stat-glossary>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(glossarySchema(locale, siteUrl, t)) }} />
    <nav className={styles.termIndex} aria-label={t("Jump to a statistic")}>
      <ul>{glossaryTerms.map(term => <li key={term.id}><a href={`#${term.id}`}>{t(term.label)}</a></li>)}</ul>
    </nav>
    {(["overview", "scoring"] as const).map(group => <section key={group} aria-labelledby={`terms-${group}`}>
      <h2 id={`terms-${group}`}>{t(group === "overview" ? "Overview" : "Goal types & set pieces")}</h2>
      <dl>{glossaryTerms.filter(term => term.group === group).map(term => <div id={term.id} className={styles.term} key={term.id}>
        <dt>{t(term.label)}</dt>
        <dd><p>{t(term.definition)}</p><Link href={term.href}>{t("Compare {0}", { 0: t(term.label) })}<span aria-hidden="true"> →</span></Link></dd>
      </div>)}</dl>
    </section>)}
    <aside className={styles.countingRules}><h2>{t("Sources & counting rules")}</h2><p>{t("Statistics cover the stated period; overlapping categories should not be added together.")}</p><Link href="/methodology">{t("Sources & methodology")}</Link>{articleAvailable && <Link href="/insights/why-assist-totals-differ">{t("Why totals can differ ")}</Link>}</aside>
  </div>;
}
