import { localizedPath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { getPublishedData } from "@/lib/server-data";
import Link from "@/components/localized-link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, ShieldCheck } from "lucide-react";
import { ClubBreakdown, TeamHonours, CurrentHighlights, teamTrophyTotals } from "@/components/expanded-details";
import { Comparison, ExploreCards } from "@/components/comparison";
import { PlayerMatchup } from "@/components/player-matchup";
import { AwardChart } from "@/components/award-chart";
import { AwardComparison, HonoursNavigation } from "@/components/award-comparison";
import { isAwardSlug } from "@/lib/awards";
import { CorrectionForm } from "@/components/correction-form";
import { players, scopeIds, sources } from "@/lib/data";
import { jsonLd, pageMetadata, siteUrl } from "@/lib/site";
import { contentPages as pages } from "@/lib/content-pages";
import { policies } from "@/lib/policies";
import { PolicyContent } from "@/components/policy-content";
import { ScoringCalculator } from "@/components/scoring-calculator";
import { EditorialCards } from "@/components/editorial";
import { FootballQuiz } from "@/components/football-quiz";
import { CareerTimeline } from "@/components/career-timeline";
import { MilestonePlanner } from "@/components/milestone-planner";
import { ToolCards, ToolNavigation } from "@/components/tool-cards";
import { toolPages } from "@/lib/tools";
import { comparisonIntro } from "@/lib/comparison-copy";
import { ComparisonQuestions } from "@/components/comparison-questions";
async function getPage(slug: string) {
    const page = Object.hasOwn(pages, slug) ? pages[slug] : undefined;
    if (!page)
        return undefined;
    const data = await getPublishedData();
    const { t } = await getI18n();
    const introduction = comparisonIntro(slug, data, t, teamTrophyTotals);
    if (introduction) return { ...page, description: introduction };
    return page.scope && data.coverageNote ? { ...page, description: `${data.scopes[page.scope].label}. Reviewed baseline plus published match updates. See each statistic’s coverage and the public update log.` } : page;
}
export function generateStaticParams() { return Object.keys(pages).map(slug => ({ slug })); }
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) {
    const { slug } = await params;
    const page = await getPage(slug);
    if (!page)
        return {};
    return pageMetadata(page.title, page.description, `/${slug}`);
}
export default async function ContentPage({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) {
    const { t, locale } = await getI18n();
    const liveData = await getPublishedData();
    const careerAssists = liveData.scopes.career.metrics.find(m => m.id === "assists")!.values;
    const { slug } = await params;
    const page = await getPage(slug);
    if (!page)
        notFound();
    return <div className="page-container inner-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: t("Overview"), item: `${siteUrl}${localizedPath("/", locale)}` }, { "@type": "ListItem", position: 2, name: t(page.title), item: `${siteUrl}${localizedPath(`/${slug}`, locale)}` }] }) }}/><div className="page-intro inner-intro"><div><span className="eyebrow"><span className="tiny-dot"/>{t(page.eyebrow)}</span><h1>{t(page.heading)}</h1><p>{t(page.description)}</p></div></div>
    {slug === "assists" && <div className="notice-card"><ShieldCheck size={21}/><div><strong>{t("Career assists: Messi {0} \u00B7 Ronaldo {1}.", { "0": t(careerAssists.messi), "1": t(careerAssists.ronaldo) })}</strong><p>{t("{0} The Champions League view separately uses UEFA\u2019s definition: 40 and 42. ", { "0": t(liveData.coverageNote ? "These combine the reviewed baseline and the sourced match records in the public update log. Provider assist definitions may differ." : "These use the named statistical reference’s conventional-assist totals.") })}<Link href="/insights/why-assist-totals-differ">{t("Why totals can differ ")}<ArrowRight size={13}/></Link></p></div></div>}
    {(Object.hasOwn(toolPages, slug) || slug === "scoring-calculator") && <ToolNavigation current={slug}/>}
    {slug === "tools" && <><ToolCards/><div className="prose panel"><h2>{t("Built for curious football fans")}</h2><p>{t("Our tools turn the published records into questions, charts and calculations you can explore. Every tool runs on this website, with no embedded third-party game or account required.")}</p><p>{t("Quiz answers and chart totals come from the same dataset as the comparison pages. Scenarios use your assumptions. Source references remain available so you can check the underlying records.")}</p><Link className="text-link" href="/methodology">{t("Sources & counting rules")}</Link></div></>}
    {slug === "football-quiz" && <FootballQuiz/>}
    {slug === "career-timeline" && <CareerTimeline/>}
    {slug === "milestone-planner" && <MilestonePlanner/>}
    {slug === "scoring-calculator" && <><ScoringCalculator /><EditorialCards limit={3} calculatorsOnly/></>}
    {slug === "records" && <CurrentHighlights />}
    {page.scope && <><Comparison initialScope={page.scope} initialGroup={page.scoring ? "scoring" : "overview"} focusMetric={page.focusMetric}/>{slug === "clubs" && <ClubBreakdown />}<ComparisonQuestions slug={slug} data={liveData}/><ExploreCards /></>}
    {(slug === "honours" || isAwardSlug(slug)) && <HonoursNavigation current={slug} />}
    {isAwardSlug(slug) && <AwardComparison slug={slug} />}
    {slug === "honours" && <>
      <section className="honours-comparison" aria-label={t("Player honours comparison")}>
        <div className="snapshot-line"><span><span className="snapshot-dot"/>{t(" Team trophies \u00B7 Through September 2026")}</span><Link href="/methodology">{t("Sources & counting rules ")}<ShieldCheck size={12}/></Link></div>
        <PlayerMatchup values={teamTrophyTotals} label={t("OVERALL TROPHIES")} accessibleLabel={t("overall team trophies")} context={t("Club & country \u00B7 Through Sep 2026")} exportData={{ title: "Overall trophies", context: "Club & country · Team honours", date: "2026-09-21", note: "Includes youth/Olympic titles and MLS conference championship. Individual awards excluded." }}/>
      </section>
      <TeamHonours />
      <ComparisonQuestions slug={slug} data={liveData}/>
      <div className="honours-summary">{(["messi", "ronaldo"] as const).map(id => <div className={`honour-player panel ${id}`} key={id}><span className="section-kicker">{t(players[id].name.toUpperCase())}</span><h2>{t("{0} Ballon d\u2019Or awards", { "0": t(players[id].awards.length) })}</h2><div className="award-years">{players[id].awards.map(year => <span key={year}>{t(year)}</span>)}</div></div>)}</div>
      <AwardChart full/><div className="prose panel"><h2>{t("What this timeline measures")}</h2><p>{t("Men\u2019s Ballon d\u2019Or and FIFA Ballon d\u2019Or wins through the latest completed edition, 2025. These are individual awards, not team trophies. No Ballon d\u2019Or was awarded in 2020.")}</p><p>{t("Between 2008 and 2025, 17 awards were presented. Messi and Ronaldo won 13. The 2026 ceremony has not taken place at this snapshot date, so no 2026 winner is assumed.")}</p><a href={sources.ballon.url} target="_blank" rel="noreferrer">{t("See the complete winners list at UEFA ")}<ArrowUpRight size={14}/></a></div>
    </>}
    {slug === "methodology" && <Methodology />}
    {slug === "about" && <div className="prose panel"><h2>{t("Perspective before verdicts")}</h2><p>{t("The Rivalry is an independent football comparison project. We make statistics easier to explore without turning a choice of metrics into an objective verdict about the greatest player.")}</p><p>{t("Our dataset was updated through 21 September 2026. It covers 25 calendar years, eight clubs, goals, assists, minutes, scoring breakdowns and international tournaments. A date is part of every statistic, and a missing field is never silently replaced with zero.")}</p><h2>{t("Made to be questioned")}</h2><p>{t("Every comparison names its scope and links to supporting sources. Derived figures are explained, assist definitions stay attached to their provider, and categories that overlap are labelled.")}</p><h2>{t("Independent by design")}</h2><p>{t("This website is not affiliated with, endorsed by, or operated by either player, their clubs, national associations, UEFA or FIFA. Photographs and source names identify the subjects and evidence; they do not imply endorsement.")}</p><Link href="/methodology">{t("Explore our methodology ")}<ArrowRight size={14}/></Link></div>}
    {Object.hasOwn(policies, slug) && <PolicyContent policy={policies[slug]}/>}
    {slug === "contact" && <><div className="contact-summary"><h2>{t("Contact the publisher")}</h2>{process.env.CONTACT_EMAIL ? <p>{t("For general questions, privacy, accessibility or image rights, email ")}<a href={`mailto:${process.env.CONTACT_EMAIL}`}>{t(process.env.CONTACT_EMAIL)}</a>.</p> : <p>{t("A public email address is not currently listed. The tool below prepares a correction report on your device; it does not send a message to us.")}</p>}</div><CorrectionForm email={process.env.CONTACT_EMAIL}/><div className="prose panel"><h2>{t("Useful evidence makes a difference")}</h2><p>{t("Include the competition, cutoff date and assist or goal definition. A different total can reflect a different scope rather than an error. A direct match record or source explanation is especially helpful.")}</p><p>{t("When we adopt a correction, it belongs in the dataset\u2019s revision history with the original value, new value, reason and source.")}</p></div></>}
    {slug === "credits" && <div className="prose panel"><h2>{t("Lionel Messi")}</h2><p>{t("Argentina\u2019s official FIFA World Cup 2026 portrait session, 11 June 2026. Photograph by Florencia Tan Jun \u2013 FIFA/FIFA via Getty Images. \u00A9 2026 FIFA.")}</p><p><a href="https://www.gettyimages.com/detail/2281293668" target="_blank" rel="noreferrer">{t("Original photograph and credit")}</a></p><h2>{t("Cristiano Ronaldo")}</h2><p>{t("Portugal\u2019s official FIFA World Cup 2026 portrait session, 14 June 2026. Photograph by Carmen Mandato \u2013 FIFA/FIFA via Getty Images. \u00A9 2026 FIFA.")}</p><p><a href="https://www.gettyimages.com/detail/2281747967" target="_blank" rel="noreferrer">{t("Original photograph and credit")}</a></p><h2>{t("Presentation")}</h2><p>{t("Photographs are displayed with responsive cropping and tonal overlays. Copyright remains with the respective rights holders. No photographer or subject endorses this website.")}</p><h2>{t("Icons and typography")}</h2><p>{t("Interface icons: Lucide (ISC license). Fonts: Inter and Roboto Condensed, distributed under the SIL Open Font License and hosted locally.")}</p></div>}
  </div>;
}
async function Methodology() {
    const { t } = await getI18n();
    const { datasetVersion, reviewedDate, scopes, snapshotDate, snapshotLabel, coverageNote } = await getPublishedData();
    return <>{coverageNote && <div className="prose panel"><p>{t(coverageNote)}</p><Link href="/updates">{t("Published match updates \u2197")}</Link></div>}<div className="methodology-status panel"><ShieldCheck size={26}/><div><h2>{t("Updated through {0}.", { "0": t(snapshotLabel) })}</h2><p>{t("Data cutoff: ")}<time dateTime={snapshotDate}>{t(snapshotLabel)}</time>{t(" \u00B7 Source review: ")}<time dateTime={reviewedDate}>{t(reviewedDate)}</time>{t(" \u00B7 Edition {0}", { "0": t(datasetVersion) })}</p></div><span className="snapshot-badge">{t("2026 DATA EDITION")}</span></div><div className="prose panel"><h2>{t("What was updated")}</h2><p>{t("The September 2026 release replaces the old 2024 career totals and adds calendar years through 2026. It contains career, club, country, World Cup, continental tournament, league, European-club and direct-meeting views. Every goal, assist, appearance and minute in the calendar-year series reconciles with the career total.")}</p><h2>{t("Where the figures come from")}</h2><p>{t("Current detailed totals come from the named secondary statistical reference, Messi vs Ronaldo App. Individual club and calendar-year pages link directly to their evidence. UEFA is the primary source for Champions League goals, appearances and assists and the Ballon d\u2019Or winners. News reports corroborate recent scoring milestones. These are reviewed source figures, not a claim that every match event has been independently audited.")}</p><h2>{t("The comparison boundaries")}</h2><ul><li>{t("Career totals include senior competitive club games and recognized senior A internationals, including international friendlies.")}</li><li>{t("Club friendlies, exhibitions, youth/reserve games and shootout kicks are excluded.")}</li><li>{t("Champions League figures exclude qualifying. La Liga covers each complete Spanish league career.")}</li><li>{t("The 2026 calendar year is incomplete. Earlier calendar years run January to December; the shared-Spain archive uses club seasons.")}</li><li>{t("World Cup means the final tournament through 2026, excluding qualifiers. Copa Am\u00E9rica and Euros are separate competitions.")}</li><li>{t("League statistics exclude MLS playoffs. Club statistics include them.")}</li><li>{t("Club and country sum to career totals. Champions League, goal types and penalties are overlapping subsets; do not add them all together.")}</li></ul><h2>{t("Calculated statistics")}</h2><p>{t("Goal contributions = goals + assists. Goals per appearance = goals \u00F7 appearances. Goals per 90 = goals \u00D7 90 \u00F7 minutes. Penalty conversion = penalty goals \u00F7 attempts \u00D7 100. Non-penalty goals = goals \u2212 penalties. Rates are calculated before rounding. A rate with no minutes or appearances is unavailable, not zero.")}</p><h2>{t("Assist definitions and disputed counts")}</h2><p>{t("Baseline career assists follow the secondary source: 424 Messi and 261 Ronaldo. Any later match additions are identified in the public update log with their own provider. UEFA reports 40 Messi and 42 Ronaldo Champions League assists; the career reference reports 41 for Ronaldo in that tournament. The UEFA view retains 42 and explains the difference. Do not subtract a UEFA assist subtotal from the other provider\u2019s career total. Ronaldo\u2019s Madrid count uses 450; the club\u2019s 451 assigns a disputed deflected goal differently.")}</p><h2>{t("Trophies need counting rules too")}</h2><p>{t("Overall trophy totals sum the team honours listed in the table, including youth and Olympic titles and the MLS conference championship. Ballon d\u2019Or and other individual awards are separate. The table identifies youth and Olympic awards, conference championships and senior titles. The Supporters\u2019 Shield and MLS Cup are different achievements. Participation exceptions for super cups are stated next to the category.")}</p><h2>{t("Freshness and remaining coverage")}</h2><p>{t("This release is dated {0}; it is not an automatic live feed. The protected admin dashboard publishes verified match updates without a rebuild. The public update log lists post-baseline records and provider definitions; goal-type data keeps its original cutoff. Full match logs, arbitrary opponent/age filters and advanced event data such as xG are not yet included. Partial-coverage dribbling, shot or chance totals are not presented as complete career statistics.", { "0": t(snapshotLabel) })}</p></div><div className="section-title-row"><div><span className="section-kicker">{t("FOLLOW THE EVIDENCE")}</span><h2>{t("The source register")}<span className="heading-dot">.</span></h2></div></div><div className="sources-grid">{Object.entries(sources).map(([id, source]) => <article id={id} className="source-register-card panel" key={id}><span className="source-register-label"><ShieldCheck size={15}/>{t(source.name)}</span><h3>{t(source.title)}</h3><p>{t(source.note)}</p><a href={source.url} target="_blank" rel="noreferrer">{t("Open source ")}<ArrowUpRight size={15}/></a></article>)}</div><section className="panel coverage-panel"><div className="panel-heading"><div><span className="section-kicker">{t("WHAT YOU CAN EXPLORE")}</span><h2>{t("Coverage at a glance")}</h2></div><CalendarDays size={21}/></div><table className="coverage-table"><thead><tr><th>{t("Comparison")}</th><th>{t("Goals")}</th><th>{t("Minutes")}</th><th>{t("Assists")}</th></tr></thead><tbody>{scopeIds.map(id => <tr key={id}><th scope="row">{t(scopes[id].label)}</th>{["goals", "minutes", "assists"].map(field => <td key={field}><Check size={16} aria-label={t("Available")}/></td>)}</tr>)}</tbody></table></section><div className="prose panel"><h2>{t("Revision history")}</h2><p>{t("21 September 2026: replaced the end-of-2024 career figures (850 / 916) with 930 / 979. Added assists, appearances, minutes, scoring rates and goal types; 25 calendar years; eight club records; tournament comparisons and team honours. The old Spanish-season archive remains available as an explicitly historical section.")}</p><Link href="/contact">{t("Prepare a correction report ")}<ArrowRight size={14}/></Link></div></>;
}
