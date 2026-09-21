import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { articles } from "@/lib/articles";

export function EditorialCards() {
  return <section className="editorial-section"><div className="section-title-row"><div><span className="section-kicker">UNDERSTAND THE GAME</span><h2>A little context goes a long way<span className="heading-dot">.</span></h2></div><Link href="/insights" className="text-link">The reading room <ArrowRight size={15} /></Link></div><div className="editorial-grid">{articles.map(article => <Link href={`/insights/${article.slug}`} className={`editorial-card ${article.color}`} key={article.slug}><div className="article-art" aria-hidden="true"><span className="article-art-number">{article.number}</span>{article.color === "blue" ? <div className="assist-art"><span /><span /><span /><span /><span /></div> : article.color === "coral" ? <div className="rate-art"><span>140</span><span>0.79</span><i /></div> : <div className="pitch-art"><span /><i /></div>}<span className="article-art-arrow"><ArrowUpRight size={22} /></span></div><div className="editorial-card-text"><span className="section-kicker">{article.category}</span><h3>{article.title}</h3><p>{article.description}</p><span className="read-time"><BookOpen size={12} />{article.readTime}</span></div></Link>)}</div></section>;
}
