import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import { articles, getArticle } from "@/lib/articles";
import { sources } from "@/lib/data";
import { jsonLd, pageMetadata, siteUrl } from "@/lib/site";

export function generateStaticParams() { return articles.map(article => ({ slug: article.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const article = getArticle(slug); return article ? pageMetadata(article.title, article.description, `/insights/${slug}`) : {}; }
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const article = getArticle(slug); if (!article) notFound();
  return <div className="page-container inner-page article-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.description, datePublished: "2026-09-21", dateModified: "2026-09-21", author: { "@type": "Organization", name: "The Rivalry", url: `${siteUrl}/about` }, mainEntityOfPage: `${siteUrl}/insights/${slug}`, image: `${siteUrl}/opengraph-image`, inLanguage: "en", citation: article.sourceIds.map(id => sources[id].url) }) }} /><Link href="/insights" className="text-link article-back"><ArrowLeft size={15} />The reading room</Link><div className="page-intro inner-intro"><div><span className="eyebrow">{article.category}</span><h1>{article.title}</h1><p>{article.description}</p></div></div><div className="article-byline"><span>The Rivalry</span><span>21 September 2026</span><span><BookOpen size={13} />{article.readTime}</span></div><article className="prose panel">{article.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2><p>{section.text}</p></section>)}<div className="article-sources"><h2>Sources & further reading</h2>{article.sourceIds.map(id => <a key={id} href={sources[id].url} target="_blank" rel="noreferrer">{sources[id].title}<ArrowUpRight size={14} /></a>)}{slug === "why-assist-totals-differ" && <a href="https://www.statsperform.com/opta-event-definitions/" target="_blank" rel="noreferrer">Opta event definitions<ArrowUpRight size={14} /></a>}</div></article><Link href="/compare" className="primary-button">Put it into perspective <ArrowUpRight size={16} /></Link></div>;
}
