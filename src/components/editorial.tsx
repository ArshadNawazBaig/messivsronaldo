import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { articles } from "@/lib/articles";
export async function EditorialCards({ limit }: { limit?: number } = {}) {
    const { t } = await getI18n();
    return <section className="editorial-section"><div className="section-title-row"><h2>{t("Analysis & explainers")}</h2><Link href="/insights" className="text-link">{t("All articles ")}<ArrowRight size={15}/></Link></div><div className="editorial-grid">{articles.slice(0, limit).map(article => <Link href={`/insights/${article.slug}`} className="editorial-card" key={article.slug}><div className="editorial-card-text"><span className="article-meta">{t(article.category)}<span>{t(article.readTime)}</span></span><h3>{t(article.title)}</h3><p>{t(article.description)}</p><span className="article-read">{t("Read article ")}<ArrowUpRight size={15}/></span></div></Link>)}</div></section>;
}
