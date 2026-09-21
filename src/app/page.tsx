import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { ComparisonGuide } from "@/components/comparison-guide";
import { Comparison, ExploreCards } from "@/components/comparison";
import { AwardChart } from "@/components/award-chart";
import { EditorialCards } from "@/components/editorial";
import { CurrentHighlights } from "@/components/expanded-details";
import { getPublishedData } from "@/lib/server-data";
import { pageMetadata } from "@/lib/site";

export async function generateMetadata() { const { snapshotLabel } = await getPublishedData(); return pageMetadata("Messi vs Ronaldo: Goals, Assists, Stats & Trophies (2026)", `Messi vs Ronaldo statistics updated ${snapshotLabel}: career goals, assists, 2026 stats, World Cup, club records, scoring rates and trophies.`, "/"); }

export default async function Home() {
  const { snapshotLabel, snapshotDate } = await getPublishedData();
  return <div className="page-container home-page">
    <div className="edition-line"><span>FOOTBALL / PLAYER COMPARISON</span><Link href="/updates">Updated <time dateTime={snapshotDate}>{snapshotLabel}</time><ArrowUpRight size={13} /></Link></div>
    <section className="page-intro"><div><h1>Messi <span className="title-vs">vs</span> Ronaldo</h1><p>Career goals, assists and trophies. Choose a competition. Compare the records.</p></div><Link className="intro-link" href="/methodology">How we count <ArrowUpRight size={16} /></Link></section>
    <Comparison />
    <CurrentHighlights />
    <AwardChart />
    <ExploreCards />
    <EditorialCards />
    <ComparisonGuide />
    <section className="trust-banner"><div><span className="section-kicker">ABOUT THE DATA</span><h2>A comparison you can check.</h2><p>Every statistic links to its source. Counting rules, coverage dates and corrections are public.</p></div><Link href="/methodology">Sources & methodology <ArrowUpRight size={17} /></Link></section>
    <div className="back-to-data"><a href="#comparison">Back to the comparison <ArrowDown size={13} /></a></div>
  </div>;
}
