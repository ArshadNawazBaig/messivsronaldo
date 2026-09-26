import type { CSSProperties } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Trophy } from "lucide-react";
import { StatImageButton } from "@/components/admin-stat-export";
import { ClubBreakdown, teamTrophyTotals } from "@/components/expanded-details";
import Link from "@/components/localized-link";
import { players, type PlayerId, type ScopeId } from "@/lib/data";
import { awardComparisons, awardsReviewed } from "@/lib/awards";
import { localizedPath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { playerArtworkStyle, transparentPlayerPortraits } from "@/lib/player-artwork";
import { getPublishedData } from "@/lib/server-data";
import { jsonLd, pageMetadata, siteUrl } from "@/lib/site";
import styles from "./profile.module.css";

export function generateStaticParams() {
  return [{ player: "messi" }, { player: "ronaldo" }];
}

export async function generateMetadata({ params }: { params: Promise<{ player: string }> }) {
  const { snapshotLabel } = await getPublishedData();
  const { player } = await params;
  if (player !== "messi" && player !== "ronaldo") return {};
  const p = players[player as PlayerId];
  return pageMetadata(`${p.name}: Goals, Stats & Awards — 2026`, `${p.name}'s sourced career statistics through ${snapshotLabel}, with Champions League and La Liga records and individual awards.`, `/players/${player}`);
}

const competitions: { scope: ScopeId; href: string }[] = [
  { scope: "club", href: "/compare#scope=club" },
  { scope: "international", href: "/international" },
  { scope: "champions-league", href: "/champions-league" },
  { scope: "la-liga", href: "/la-liga" },
  { scope: "world-cup", href: "/world-cup" },
];

export default async function PlayerPage({ params }: { params: Promise<{ player: string }> }) {
  const { t, locale, numberLocale } = await getI18n();
  const { scopes, snapshotDate, snapshotLabel } = await getPublishedData();
  const { player } = await params;
  if (player !== "messi" && player !== "ronaldo") notFound();
  const p = players[player];
  const other = players[player === "messi" ? "ronaldo" : "messi"];
  const portrait = transparentPlayerPortraits[player];
  const format = (value: number, decimals = 0) => value.toLocaleString(numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const headlineMetrics = scopes.career.metrics.filter(metric => ["goals", "assists", "appearances", "minutes"].includes(metric.id));
  const rateMetrics = scopes.career.metrics.filter(metric => ["goals-per-game", "goals-per-90", "minutes-per-goal"].includes(metric.id));
  const sections = [
    { id: "career-stats", label: "Career overview" },
    { id: "competition-records", label: "Competition records" },
    { id: "recognition", label: "Trophies & awards" },
    { id: "club-records", label: "Club by club" },
  ];

  return <div className={`page-container inner-page ${styles.page}`} data-player={player} style={playerArtworkStyle(player) as CSSProperties}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Person", name: p.name, birthDate: p.born, nationality: { "@type": "Country", name: p.country }, image: `${siteUrl}${portrait.src}`, url: `${siteUrl}${localizedPath(`/players/${player}`, locale)}` }) }} />

    <div className={styles.breadcrumb}>
      <Link href="/"><ArrowLeft size={15} aria-hidden="true" />{t("Overview")}</Link>
      <Link href={`/players/${player === "messi" ? "ronaldo" : "messi"}`}>{t(other.name)}<ArrowUpRight size={15} aria-hidden="true" /></Link>
    </div>

    <header className={styles.hero}>
      <div className={styles.nationality}><span className={`country-flag ${player}`} aria-hidden="true" />{t("{0} · PLAYER PROFILE", { "0": t(p.countryCode) })}</div>
      <span className={styles.shirtNumber} aria-hidden="true">#{p.number}</span>
      <div className={styles.portrait}><Image src={portrait.src} alt={t(p.imageAlt)} width={portrait.width} height={portrait.height} priority quality={85} sizes={player === "messi" ? "(max-width: 720px) 260px, 440px" : "(max-width: 720px) 450px, 760px"} /></div>
      <div className={styles.heroCopy}>
        <p className={styles.epithet}>{t(player === "messi" ? "The playmaker" : "The goal machine")}</p>
        <h1 className={styles.name}><span>{t(player === "messi" ? "Lionel" : "Cristiano")} </span>{t(p.short)}<span className={styles.period} aria-hidden="true">.</span></h1>
        <p className={styles.biography}>{t(p.tagline)}</p>
        <Link className={styles.compareButton} href="/compare">{t("Compare with {0}", { "0": t(other.short) })}<ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
    </header>

    <nav className={styles.sectionNav} aria-label={t("Player profile sections")}>
      {sections.map(section => <a href={`#${section.id}`} key={section.id}>{t(section.label)}</a>)}
    </nav>

    <section id="career-stats" className={styles.section} aria-labelledby="career-heading">
      <div className={styles.sectionHeading}>
        <div><span className={styles.kicker}>{t("Club + country")}</span><h2 id="career-heading">{t("Career overview")}</h2></div>
        <time dateTime={snapshotDate}>{t("Updated {0}", { "0": t(snapshotLabel) })}</time>
      </div>
      <div className={styles.statGrid}>
        {headlineMetrics.map(metric => <div className={styles.stat} key={metric.id} data-metric={metric.id}>
          <span>{t(metric.label)}</span><strong>{format(metric.values[player], metric.decimals)}</strong>
          <StatImageButton player={player} stat={{ title: metric.label, context: "Career · Club & country", values: metric.values, decimals: metric.decimals, note: metric.coverage }} />
        </div>)}
      </div>
      <div className={styles.rateGrid}>
        {rateMetrics.map(metric => <div key={metric.id}><span>{t(metric.label)}</span><strong>{format(metric.values[player], metric.decimals)}</strong><StatImageButton player={player} stat={{ title: metric.label, context: "Career · Club & country", values: metric.values, decimals: metric.decimals, lowerIsBetter: metric.lowerIsBetter }} /></div>)}
      </div>
    </section>

    <div className={styles.detailGrid}>
      <section id="competition-records" className={styles.section} aria-labelledby="competition-heading">
        <div className={styles.sectionHeading}><div><span className={styles.kicker}>{t("All-time stats")}</span><h2 id="competition-heading">{t("Competition records")}</h2></div></div>
        <div className={styles.tableWrap}>
          <table className={styles.competitionTable}>
            <caption className="sr-only">{t(p.name)} · {t("Competition records")}</caption>
            <thead><tr><th scope="col">{t("Scope")}</th><th scope="col">{t("Goals")}</th><th scope="col">{t("Assists")}</th><th scope="col">{t("Appearances")}</th></tr></thead>
            <tbody>{competitions.map(({ scope: id, href }) => {
              const scope = scopes[id];
              const assists = scope.metrics.find(metric => metric.id === "assists")!;
              return <tr key={id} data-scope={id}>
                <th scope="row"><Link href={href}>{t(scope.shortLabel)}<ArrowUpRight size={13} aria-hidden="true" /></Link><StatImageButton player={player} stats={scope.metrics.filter(metric => ["goals", "assists", "appearances"].includes(metric.id)).map(metric => ({ title: metric.label, context: scope.label, values: metric.values, note: metric.coverage }))} /></th>
                <td>{format(scope.goals[player])}</td><td>{format(assists.values[player])}</td><td>{format(scope.appearances[player])}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <p className={styles.tableNote}>{t("These records overlap. Competition totals should not be added together.")}</p>
        <p className={styles.tableNote}>{t("In UEFA’s Champions League main competition, {0} recorded {1} goals in {2} appearances. Qualifying rounds are excluded.", { "0": t(p.short), "1": format(scopes["champions-league"].goals[player]), "2": format(scopes["champions-league"].appearances[player]) })}</p>
      </section>

      <section id="recognition" className={styles.section} aria-labelledby="recognition-heading">
        <div className={styles.sectionHeading}><div><span className={styles.kicker}>{t("TEAM & INDIVIDUAL HONOURS")}</span><h2 id="recognition-heading">{t("Trophies & awards")}</h2></div></div>
        <div className={styles.awardCard}>
          <div className={styles.awardTitle}><Trophy size={24} aria-hidden="true" /><h3>{t("Ballon d’Or")}</h3></div>
          <strong className={styles.awardCount}>{format(p.awards.length)}</strong>
          <ul className={styles.awardYears} aria-label={t("Ballon d’Or wins")}>{p.awards.map(year => <li key={year}>{year}</li>)}</ul>
          <p>{t("Men’s Ballon d’Or and FIFA Ballon d’Or wins through the latest completed edition, 2025. These are individual awards, not team trophies. No Ballon d’Or was awarded in 2020.")}</p>
          <div className={styles.awardActions}><Link href="/ballon-dor">{t("Explore the honours")}<ArrowUpRight size={15} aria-hidden="true" /></Link><StatImageButton player={player} stat={{ title: "Ballon d’Or", context: awardComparisons["ballon-dor"].context, values: { messi: players.messi.awards.length, ronaldo: players.ronaldo.awards.length }, date: awardsReviewed, note: awardComparisons["ballon-dor"].note }} /></div>
        </div>
        <div className={styles.trophySummary}>
          <Link href="/honours"><span>{t("Overall trophies")}<ArrowUpRight size={14} aria-hidden="true" /></span><strong>{format(teamTrophyTotals[player])}</strong></Link>
          <p>{t("Overall totals include every team honour listed, including youth/Olympic titles and the MLS conference championship. Individual awards are separate.")}</p>
          <StatImageButton player={player} stat={{ title: "Overall trophies", context: "Club & country · Team honours", values: teamTrophyTotals, date: "2026-09-21", note: "Includes youth/Olympic titles and MLS conference championship. Individual awards excluded." }} />
        </div>
      </section>
    </div>

    <div id="club-records" className={`${styles.section} ${styles.clubs}`}><ClubBreakdown only={player} /></div>

    <aside className={styles.methodology}>
      <div><h2>{t("Read the numbers with their date")}</h2><p>{t("The career figures on this page were updated through {0}. They are a dated release and do not refresh during a match. See the methodology for the counting rules, coverage gaps and supporting sources.", { "0": t(snapshotLabel) })}</p></div>
      <Link href="/methodology">{t("Sources & methodology")}<ArrowRight size={16} aria-hidden="true" /></Link>
    </aside>
  </div>;
}
