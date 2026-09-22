import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { CalendarExplorer } from "@/components/calendar-explorer";
import { seasons } from "@/lib/seasons";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata() { return pageMetadata("Messi vs Ronaldo by Year: 2002–2026 Goals & Assists", "Compare every calendar year through 2026: goals, assists, minutes, appearances and per-90 rates for club, country and league football.", "/seasons"); }
export default async function SeasonsPage() { const { t } = await getI18n(); return <div className="page-container inner-page"><div className="page-intro inner-intro"><div><span className="eyebrow"><span className="tiny-dot"/>{t("2002\u20132026 \u00B7 THE COMPLETE TIMELINE")}</span><h1>{t("Every year tells a story.")}</h1><p>{t("From the first appearances to 2026. Explore goals, assists and scoring rates across 25 calendar years.")}</p></div></div><CalendarExplorer /><section className="prose panel"><h2>{t("Explore their shared Spanish seasons")}</h2><p>{t("The calendar-year explorer above includes every year through 2026. This separate archive compares the nine full club seasons in which both played in Spain.")}</p><div className="archive-link">{seasons.map(s => <Link href={`/seasons/${s.slug}`} key={s.slug}>{t(s.label)}</Link>)}</div></section></div>; }
