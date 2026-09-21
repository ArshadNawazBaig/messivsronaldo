import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { articles } from "@/lib/articles";

export function EditorialCards() {
  return <section className="editorial-section"><div className="section-title-row"><h2>Analysis & explainers</h2><Link href="/insights" className="text-link">All articles <ArrowRight size={15} /></Link></div><div className="editorial-grid">{articles.map(article => <Link href={`/insights/${article.slug}`} className="editorial-card" key={article.slug}><div className="editorial-card-text"><span className="article-meta">{article.category}<span>{article.readTime}</span></span><h3>{article.title}</h3><p>{article.description}</p><span className="article-read">Read article <ArrowUpRight size={15} /></span></div></Link>)}</div></section>;
}
