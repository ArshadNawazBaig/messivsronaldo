import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getPublishedArticles } from "@/lib/blog/server";
import { articleReadingMinutes } from "@/lib/article-reading-time";
import { getArticleI18nForLocale } from "@/lib/i18n/article-server";
export async function EditorialCards({ limit, calculatorsOnly = false }: { limit?: number; calculatorsOnly?: boolean } = {}) {
    const { t, locale } = await getI18n();
    const { t: articleTranslate } = await getArticleI18nForLocale(locale);
    const articles = await getPublishedArticles(locale);
    const shown = calculatorsOnly ? articles.filter(article => article.preset) : articles;
    return <section className="editorial-section"><div className="section-title-row"><h2>{t("Analysis & explainers")}</h2><Link href="/insights" className="text-link">{t("All articles ")}<ArrowRight size={15}/></Link></div><div className="editorial-grid">{shown.slice(0, limit).map(article => <Link href={`/insights/${article.slug}`} className="editorial-card" key={article.slug}><div className="editorial-card-text"><span className="article-meta">{article.managed ? article.category : t(article.category)}<span>{t("{0} min read", { "0": articleReadingMinutes(article, locale, value => String(articleTranslate(value))) })}</span></span><h3>{article.managed ? article.title : t(article.title)}</h3><p>{article.managed ? article.description : t(article.description)}</p><span className="article-read">{t("Read article ")}<ArrowUpRight size={15}/></span></div></Link>)}</div></section>;
}
