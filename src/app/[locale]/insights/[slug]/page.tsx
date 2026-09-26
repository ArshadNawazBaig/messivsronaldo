import { localizedPath } from "@/lib/i18n/config";
import Link from "@/components/localized-link";
import { ScoringCalculator } from "@/components/scoring-calculator";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import { articles, getArticle } from "@/lib/articles";
import { sources } from "@/lib/data";
import { translatedDate } from "@/lib/i18n/date-format";
import { jsonLd, pageMetadata, siteUrl } from "@/lib/site";
import { socialImagePath } from "@/lib/social-image";
import { getArticleI18n } from "@/lib/i18n/article-server";
import styles from "./article.module.css";

export function generateStaticParams() { return articles.map(article => ({ slug: article.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const metadata = await pageMetadata(article.title, article.description, `/insights/${slug}`);
  const { t } = await getArticleI18n();
  const images = article.image ? [{ url: article.image.path, width: 1200, height: 630, type: "image/png", alt: t(article.image.alt) }] : undefined;
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: article.published ?? "2026-09-21", modifiedTime: article.updated ?? "2026-09-21", ...(images && { images }) }, twitter: { ...metadata.twitter, ...(images && { images }) } };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { t, locale } = await getArticleI18n();
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const published = article.published ?? "2026-09-21";
  const updated = article.updated ?? published;
  const citations = [...article.sourceIds.map(id => ({ title: sources[id].title, url: sources[id].url })), ...(article.citations ?? [])];
  const related = article.relatedSlugs ? articles.filter(item => article.relatedSlugs!.includes(item.slug)) : articles.filter(item => item.slug !== slug && item.preset).slice(0, 2);
  const articleUrl = `${siteUrl}${localizedPath(`/insights/${slug}`, locale)}`;
  const organization = { "@type": "Organization", name: "The Rivalry", url: `${siteUrl}${localizedPath("/about", locale)}` };
  return <div className="page-container inner-page article-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Article", headline: t(article.title), description: t(article.description), datePublished: published, dateModified: updated, author: organization, publisher: organization, articleSection: t(article.category), mainEntityOfPage: articleUrl, image: `${siteUrl}${article.image?.path ?? socialImagePath}`, inLanguage: locale, citation: citations.map(source => source.url) }) }}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: t("The reading room"), item: `${siteUrl}${localizedPath("/insights", locale)}` }, { "@type": "ListItem", position: 2, name: t(article.title), item: articleUrl }] }) }}/>
    <Link href="/insights" className="text-link article-back"><ArrowLeft size={15}/>{t("The reading room")}</Link>
    <div className="page-intro inner-intro"><div><span className="eyebrow">{t(article.category)}</span><h1>{t(article.title)}</h1><p>{t(article.description)}</p></div></div>
    <div className="article-byline"><Link href="/about">{t("The Rivalry")}</Link><time dateTime={updated}>{translatedDate(updated, locale)}</time><span><BookOpen size={13}/>{t(article.readTime)}</span></div>
    {article.summary && <aside className={styles.summary} aria-labelledby="article-answer"><h2 id="article-answer">{t("At a glance")}</h2><p>{t(article.summary)}</p></aside>}
    {article.summary && <nav className={styles.contents} aria-label={t("In this article")}><strong>{t("In this article")}</strong><ul>{article.tables?.map((table, index) => <li key={table.caption}><a href={`#table-${index}`}>{t(table.caption)}</a></li>)}{article.sections.map((section, index) => <li key={section.heading}><a href={`#section-${index}`}>{t(section.heading)}</a></li>)}</ul></nav>}
    {article.preset && <ScoringCalculator preset={article.preset}/>}
    {article.tables?.map((table, index) => <section className={styles.tableSection} key={table.caption} aria-labelledby={`table-${index}`}><h2 id={`table-${index}`}>{t(table.caption)}</h2><div className={styles.tableWrap} role="region" aria-labelledby={`table-${index}`} tabIndex={0}><table><caption className="sr-only">{t(table.caption)}</caption><thead><tr>{table.columns.map(column => <th key={column} scope="col">{t(column)}</th>)}</tr></thead><tbody>{table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.cells.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row">{t(cell)}{row.citations && <span className={styles.rowSources}>{row.citations.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{t(source.title)}<ArrowUpRight size={12} aria-hidden="true"/></a>)}</span>}</th> : <td key={cellIndex}>{t(cell)}</td>)}</tr>)}</tbody></table></div>{table.note && <p className={styles.tableNote}>{t(table.note)}</p>}</section>)}
    <article className={`prose panel ${article.summary ? styles.body : ""}`}>{article.sections.map((section, index) => <section key={section.heading}><h2 id={`section-${index}`}>{t(section.heading)}</h2><p>{t(section.text)}</p>{section.citations && <div className={styles.inlineSources}>{section.citations.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{t(source.title)}<ArrowUpRight size={12} aria-hidden="true"/></a>)}</div>}</section>)}
      <div className="article-sources"><h2>{t("Sources & further reading")}</h2>{citations.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{t(source.title)}<ArrowUpRight size={14}/></a>)}{slug === "why-assist-totals-differ" && <a href="https://www.statsperform.com/opta-event-definitions/" target="_blank" rel="noreferrer">{t("Opta event definitions")}<ArrowUpRight size={14}/></a>}</div>
    </article>
    <Link href={article.preset ? "/scoring-calculator" : article.relatedSlugs ? "/ballon-dor" : "/compare"} className="primary-button">{t(article.preset ? "Open the calculator" : article.relatedSlugs ? "Messi vs Ronaldo: Ballon d’Or history" : "Compare the statistics ")}<ArrowUpRight size={16}/></Link>
    {(article.preset || article.relatedSlugs) && <div className="prose panel"><h2>{t("More comparisons to explore")}</h2>{related.map(item => <p key={item.slug}><Link href={`/insights/${item.slug}`}>{t(item.title)}<ArrowUpRight size={14}/></Link></p>)}</div>}
  </div>;
}
