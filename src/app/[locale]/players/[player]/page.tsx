import { localizedPath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import Image from "next/image";
import { ClubBreakdown } from "@/components/expanded-details";
import Link from "@/components/localized-link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getPublishedData } from "@/lib/server-data";
import { players, type PlayerId } from "@/lib/data";
import { jsonLd, pageMetadata, siteUrl } from "@/lib/site";
export function generateStaticParams() { return [{ player: "messi" }, { player: "ronaldo" }]; }
export async function generateMetadata({ params }: {
    params: Promise<{
        player: string;
    }>;
}) {
    const { snapshotLabel } = await getPublishedData();
    const { player } = await params;
    if (player !== "messi" && player !== "ronaldo")
        return {};
    const p = players[player as PlayerId];
    return pageMetadata(`${p.name}: Goals, Stats & Awards — 2026`, `${p.name}'s sourced career statistics through ${snapshotLabel}, with Champions League and La Liga records and individual awards.`, `/players/${player}`);
}
export default async function PlayerPage({ params }: {
    params: Promise<{
        player: string;
    }>;
}) {
    const { t, locale } = await getI18n();
    const { scopes, snapshotLabel } = await getPublishedData();
    const { player } = await params;
    if (player !== "messi" && player !== "ronaldo")
        notFound();
    const p = players[player];
    return <div className={`page-container inner-page profile-page ${player}`}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Person", name: p.name, birthDate: p.born, nationality: { "@type": "Country", name: p.country }, url: `${siteUrl}${localizedPath(`/players/${player}`, locale)}` }) }}/><section className="profile-hero panel"><div><span className="eyebrow">{t("{0} \u00B7 PLAYER PROFILE", { "0": t(p.countryCode) })}</span><h1>{t(p.name)}<span className="heading-dot">.</span></h1><p>{t(p.tagline)}</p><span className="snapshot-badge">{t("UPDATED {0}", { "0": t(snapshotLabel.toUpperCase()) })}</span></div><div className="profile-photo"><Image src={p.image} alt={t(p.imageAlt)} width={p.imageWidth} height={p.imageHeight} priority quality={85} sizes={player === "messi" ? "360px" : "620px"}/></div></section><div className="profile-stat-grid">{scopes.career.metrics.slice(0, 3).map(metric => <div className="panel" key={metric.id}><span className="section-kicker">{t(metric.label.toUpperCase())}</span><strong>{t(metric.values[player])}</strong><Link href="/methodology">{t("Source & definition ")}<ArrowRight size={12}/></Link></div>)}</div><div className="prose panel"><h2>{t("Individual recognition")}</h2><p>{t("{0} won {1} Ballon d\u2019Or awards through the completed 2025 edition: {2}. These are individual awards, separate from team trophies.", { "0": t(p.name), "1": t(p.awards.length), "2": t(p.awards.join(", ")) })}</p><h2>{t("European competitions")}</h2><p>{t("In UEFA\u2019s Champions League main competition, {0} recorded {1} goals in {2} appearances. Qualifying rounds are excluded.", { "0": t(p.short), "1": t(scopes["champions-league"].goals[player]), "2": t(scopes["champions-league"].appearances?.[player]) })}</p><h2>{t("Read the numbers with their date")}</h2><p>{t("The career figures on this page were updated through {0}. They are a dated release and do not refresh during a match. See the methodology for the counting rules, coverage gaps and supporting sources.", { "0": t(snapshotLabel) })}</p><Link href="/methodology">{t("Sources & methodology ")}<ArrowRight size={14}/></Link></div><ClubBreakdown only={player}/><Link href="/compare" className="primary-button">{t("Compare with {0}", { "0": t(player === "messi" ? "Ronaldo" : "Messi") })}<ArrowRight size={16}/></Link></div>;
}
