import Link from "next/link";
import { ArrowDown, ArrowUpRight, ShieldCheck } from "lucide-react";
import { ComparisonGuide } from "@/components/comparison-guide";
import { Comparison, ExploreCards } from "@/components/comparison";
import { AwardChart } from "@/components/award-chart";
import { EditorialCards } from "@/components/editorial";
import { CurrentHighlights } from "@/components/expanded-details";
import { getPublishedData } from "@/lib/server-data";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata() { const { snapshotLabel } = await getPublishedData(); return pageMetadata("Messi vs Ronaldo: Goals, Assists, Stats & Trophies (2026)", `Messi vs Ronaldo statistics updated ${snapshotLabel}: career goals, assists, 2026 stats, World Cup, club records, scoring rates and trophies.`, "/"); }

export default async function Home() {
  return <div className="page-container"><section className="page-intro"><div><span className="eyebrow"><span className="tiny-dot" /> TWO LEGENDS. EVERY ANGLE.</span><h1>Messi <span className="title-vs">vs</span> Ronaldo<span className="heading-dot">.</span></h1><p>Compare career goals, assists, trophies and 2026 stats—with sources and the context behind every number.</p></div><Link className="intro-link" href="/methodology">The numbers, with context <ArrowUpRight size={16} /></Link></section><CurrentHighlights /><Comparison /><AwardChart /><ComparisonGuide /><ExploreCards /><EditorialCards /><section className="trust-banner"><div className="trust-banner-icon"><ShieldCheck size={31} strokeWidth={1.4} /></div><div><span className="section-kicker">FOOTBALL FIRST. FACTS ALWAYS.</span><h2>Every number has a story. And a source.</h2><p>Clear definitions, a visible cutoff, and the context that makes a comparison meaningful.</p></div><Link href="/methodology">See our approach <ArrowUpRight size={17} /></Link></section><div className="back-to-data"><a href="#comparison">Back to the comparison <ArrowDown size={13} /></a></div></div>;
}
