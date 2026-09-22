import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { ArrowUpRight } from "lucide-react";
import { getPublishedData } from "@/lib/server-data";
import { getPublicPages, pageGroups } from "@/lib/public-pages";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata() { return pageMetadata("Site Map", "Browse every Messi vs Ronaldo comparison, player profile, calendar year, article and website policy on The Rivalry.", "/sitemap"); }
export default async function SiteMapPage() {
    const { t } = await getI18n();
    const { calendarYears, snapshotDate } = await getPublishedData();
    const pages = getPublicPages(calendarYears, snapshotDate);
    return <div className="page-container inner-page">
    <div className="page-intro inner-intro"><div><span className="eyebrow"><span className="tiny-dot"/>{t("THE COMPLETE INDEX")}</span><h1>{t("Find your next chapter.")}</h1><p>{t("Every comparison, season and story in one place. Browse {0} public pages, or open the ", { "0": t(pages.length) })}<a href="/sitemap.xml">{t("XML sitemap")}</a>.</p></div></div>
    <div className="sitemap-grid">{pageGroups.map((group, index) => <section key={group} className="sitemap-group">
      <div className="sitemap-group-heading"><span className="section-kicker">{t(String(index + 1).padStart(2, "0"))}</span><h2>{t(group)}</h2></div>
      <ul>{pages.filter(page => page.group === group).map(page => <li key={page.path}><Link href={page.path}>{t(page.title)}<ArrowUpRight size={15} aria-hidden="true"/></Link></li>)}</ul>
    </section>)}</div>
  </div>;
}
