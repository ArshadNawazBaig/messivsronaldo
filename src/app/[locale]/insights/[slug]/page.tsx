import { localizedPath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { ScoringCalculator } from "@/components/scoring-calculator";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import { articles, getArticle } from "@/lib/articles";
import { sources } from "@/lib/data";
import { translatedDate } from "@/lib/i18n/date-format";
import { jsonLd, pageMetadata, siteUrl } from "@/lib/site";
import { socialImagePath } from "@/lib/social-image";

export function generateStaticParams() { return articles.map(article => ({ slug: article.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const metadata = await pageMetadata(article.title, article.description, `/insights/${slug}`);
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: article.published ?? "2026-09-21", modifiedTime: article.updated ?? "2026-09-21" } };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { t, locale } = await getI18n();
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const published = article.published ?? "2026-09-21";
  const updated = article.updated ?? published;
  const citations = [...article.sourceIds.map(id => ({ title: sources[id].title, url: sources[id].url })), ...(article.citations ?? [])];
  const related = articles.filter(item => item.slug !== slug && item.preset).slice(0, 2);
  return <div className="page-container inner-page article-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Article", headline: t(article.title), description: t(article.description), datePublished: published, dateModified: updated, author: { "@type": "Organization", name: "The Rivalry", url: `${siteUrl}/about` }, mainEntityOfPage: `${siteUrl}${localizedPath(`/insights/${slug}`, locale)}`, image: `${siteUrl}${socialImagePath}`, inLanguage: locale, citation: citations.map(source => source.url) }) }}/>
    <Link href="/insights" className="text-link article-back"><ArrowLeft size={15}/>{t("The reading room")}</Link>
    <div className="page-intro inner-intro"><div><span className="eyebrow">{t(article.category)}</span><h1>{t(article.title)}</h1><p>{t(article.description)}</p></div></div>
    <div className="article-byline"><Link href="/about">{t("The Rivalry")}</Link><time dateTime={updated}>{translatedDate(updated, locale)}</time><span><BookOpen size={13}/>{t(article.readTime)}</span></div>
    {article.preset && <ScoringCalculator preset={article.preset}/>}
    <article className="prose panel">{article.sections.map(section => <section key={section.heading}><h2>{t(section.heading)}</h2><p>{t(section.text)}</p></section>)}
      <div className="article-sources"><h2>{t("Sources & further reading")}</h2>{citations.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{t(source.title)}<ArrowUpRight size={14}/></a>)}{slug === "why-assist-totals-differ" && <a href="https://www.statsperform.com/opta-event-definitions/" target="_blank" rel="noreferrer">{t("Opta event definitions")}<ArrowUpRight size={14}/></a>}</div>
    </article>
    <Link href={article.preset ? "/scoring-calculator" : "/compare"} className="primary-button">{t(article.preset ? "Open the calculator" : "Compare the statistics ")}<ArrowUpRight size={16}/></Link>
    {article.preset && <div className="prose panel"><h2>{t("More comparisons to explore")}</h2>{related.map(item => <p key={item.slug}><Link href={`/insights/${item.slug}`}>{t(item.title)}<ArrowUpRight size={14}/></Link></p>)}</div>}
  </div>;
}
