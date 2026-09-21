import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getPublishedData } from "@/lib/server-data";
import { getPublicPages, pageGroups } from "@/lib/public-pages";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Site Map", "Browse every Messi vs Ronaldo comparison, player profile, calendar year, article and website policy on The Rivalry.", "/sitemap");

export default async function SiteMapPage() {
  const { calendarYears, snapshotDate } = await getPublishedData();
  const pages = getPublicPages(calendarYears, snapshotDate);
  return <div className="page-container inner-page">
    <div className="page-intro inner-intro"><div><span className="eyebrow"><span className="tiny-dot" />THE COMPLETE INDEX</span><h1>Find your next chapter.</h1><p>Every comparison, season and story in one place. Browse {pages.length} public pages, or open the <a href="/sitemap.xml">XML sitemap</a>.</p></div></div>
    <div className="sitemap-grid">{pageGroups.map((group, index) => <section key={group} className="sitemap-group">
      <div className="sitemap-group-heading"><span className="section-kicker">{String(index + 1).padStart(2, "0")}</span><h2>{group}</h2></div>
      <ul>{pages.filter(page => page.group === group).map(page => <li key={page.path}><Link href={page.path}>{page.title}<ArrowUpRight size={15} aria-hidden="true" /></Link></li>)}</ul>
    </section>)}</div>
  </div>;
}
