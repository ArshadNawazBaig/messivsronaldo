import { getPublishedArticles } from "@/lib/blog/server";
import { ArrowUpRight } from "lucide-react";
import Link from "./localized-link";
import { relatedContent } from "@/lib/content-discovery";
import { getArticleI18n } from "@/lib/i18n/article-server";
import styles from "./discovery.module.css";
import { homeTitle } from "@/lib/home-content";

export async function RelatedReading({ path }: { path: string }) {
  const { t, locale } = await getArticleI18n();
  const items = relatedContent(path, 4, await getPublishedArticles(locale));
  if (!items.length) return null;
  return <section className={styles.related} aria-labelledby="related-reading-title" data-related-reading>
    <div className={styles.heading}><h2 id="related-reading-title">{t("Keep exploring")}</h2><span>{t("Comparisons and reading on this topic")}</span></div>
    <div className={styles.relatedGrid}>{items.map(item => <Link key={item.path} href={item.path}><span>{t(item.kind === "article" ? "Analysis & explainers" : "Comparisons")}</span><strong>{t(item.title)}</strong><ArrowUpRight size={20} aria-hidden="true"/></Link>)}</div>
    <p><Link href="/">{t(homeTitle)}</Link></p>
  </section>;
}
