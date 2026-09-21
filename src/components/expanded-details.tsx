import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getPublishedData } from "@/lib/server-data";
import { players, sources } from "@/lib/data";

export async function CurrentHighlights() {
  const { scopes, snapshotLabel } = await getPublishedData();
  return <div className="current-strip" aria-label="2026 highlights"><Link className="current-tile" href="/2026"><span className="section-kicker">2026 · CLUB + COUNTRY GOALS</span><strong><span className="messi-text">{scopes["2026"].goals.messi}</span><span className="ronaldo-text">{scopes["2026"].goals.ronaldo}</span></strong><p>The current year, side by side ↗</p></Link><Link className="current-tile" href="/clubs"><span className="section-kicker">INTER MIAMI / AL NASSR GOALS</span><strong><span className="messi-text">{scopes["current-clubs"].goals.messi}</span><span className="ronaldo-text">{scopes["current-clubs"].goals.ronaldo}</span></strong><p>Every competitive goal at their current clubs ↗</p></Link><Link className="current-tile" href="/records"><span className="section-kicker">THE ROAD TO 1,000 · GOALS TO GO</span><strong><span className="messi-text">{1000 - scopes.career.goals.messi}</span><span className="ronaldo-text">{1000 - scopes.career.goals.ronaldo}</span></strong><p>Career milestones, updated {snapshotLabel} ↗</p></Link></div>;
}
export async function ClubBreakdown({ only }: { only?: "messi" | "ronaldo" }) {
  const { clubs, snapshotLabel } = await getPublishedData();
  return <section aria-label="Club-by-club statistics"><div className="section-title-row"><div><span className="section-kicker">EVERY SHIRT. EVERY CHAPTER.</span><h2>Club by club<span className="heading-dot">.</span></h2></div></div><div className="club-columns">{(["messi", "ronaldo"] as const).filter(p => !only || p === only).map(player => <div className="club-column" key={player}><h2 className={`${player}-text`}>{players[player].name}</h2>{clubs.filter(c => c.player === player).toReversed().map(club => <article className="panel club-card" key={club.id}><span className="section-kicker">{club.period}</span><h3>{club.name}</h3><div className="club-stat-grid"><div><strong className={`${player}-text`}>{club.goals}</strong><span>GOALS</span></div><div><strong>{club.assists}</strong><span>ASSISTS</span></div><div><strong>{club.appearances}</strong><span>APPEARANCES</span></div></div><p>{club.minutes.toLocaleString("en-US")} minutes · {(club.goals * 90 / club.minutes).toFixed(2)} goals per 90 · {club.hatTricks} hat-tricks</p><a href={club.source} target="_blank" rel="noreferrer">Club record & counting rules <ArrowUpRight size={12} /></a></article>)}</div>)}</div><p className="freshness-note">Competitive first-team matches through {snapshotLabel}. Manchester United combines both spells. Ronaldo’s Real Madrid total uses the standard 450-goal convention; the club’s own 451 count assigns a disputed goal differently.</p></section>;
}
export const trophyRows = [
  { label: "Champions League", messi: 4, ronaldo: 5, note: "Messi: 2006, 2009, 2011, 2015. Ronaldo: 2008, 2014, 2016, 2017, 2018." },
  { label: "Domestic league titles", messi: 12, ronaldo: 8, note: "Messi: 10 La Liga + 2 Ligue 1. Ronaldo: 3 Premier League + 2 La Liga + 2 Serie A + 1 Saudi Pro League (2025/26)." },
  { label: "Domestic cups", messi: 7, ronaldo: 6, note: "Messi: 7 Copa del Rey. Ronaldo: 1 FA Cup, 2 League Cups, 2 Copa del Rey, 1 Coppa Italia." },
  { label: "Domestic super cups", messi: 9, ronaldo: 7, note: "Includes Messi's 2005 Spanish Super Cup and Ronaldo's 2002 Portuguese / 2008 English super cups without a match appearance." },
  { label: "UEFA Super Cup", messi: 3, ronaldo: 3, note: "Ronaldo's 2016 title is included although he did not feature in the squad." },
  { label: "FIFA Club World Cup", messi: 3, ronaldo: 4, note: "Titles in the tournament's earlier format." },
  { label: "MLS Supporters’ Shield", messi: 1, ronaldo: 0, note: "2024 regular-season points title. Separate from the MLS Cup championship." },
  { label: "MLS Cup", messi: 1, ronaldo: 0, note: "2025 playoff championship." },
  { label: "Leagues Cup / Arab Club Champions Cup", messi: 1, ronaldo: 1, note: "Both in 2023, in different competitions." },
  { label: "Campeones Cup", messi: 1, ronaldo: 0, note: "Inter Miami, September 2026." },
  { label: "World Cup", messi: 1, ronaldo: 0, note: "Argentina, 2022." },
  { label: "Copa América / European Championship", messi: 2, ronaldo: 1, note: "Argentina: 2021, 2024. Portugal: 2016. Different tournaments." },
  { label: "Finalissima / UEFA Nations League", messi: 1, ronaldo: 2, note: "Messi: 2022 Finalissima. Ronaldo: 2019, 2025 Nations League. Different competitions." },
  { label: "Conference championship", messi: 1, ronaldo: 0, note: "2025 MLS Eastern Conference. A stage on the way to the MLS Cup; listed separately to make the overlap clear." },
  { label: "Youth & Olympic titles", messi: 2, ronaldo: 0, note: "2005 U20 World Cup and 2008 Olympic gold. Not senior national-team titles." },
];
export const teamTrophyTotals = trophyRows.reduce((totals, row) => ({
  messi: totals.messi + row.messi,
  ronaldo: totals.ronaldo + row.ronaldo,
}), { messi: 0, ronaldo: 0 });

export function TeamHonours() {
  return <section className="panel"><div className="panel-heading"><div><span className="section-kicker">TEAM HONOURS · THROUGH SEPTEMBER 2026</span><h2>The trophy cabinet<span className="heading-dot">.</span></h2></div></div><div className="year-table-wrap" role="region" aria-label="Scrollable team honours" tabIndex={0}><table className="year-table trophy-table"><caption className="sr-only">Team honours by category, including participation and counting notes.</caption><thead><tr><th scope="col">TITLE & CONTEXT</th><th scope="col">MESSI</th><th scope="col">RONALDO</th></tr></thead><tbody>{trophyRows.map(row => <tr key={row.label}><th scope="row">{row.label}<small>{row.note}</small></th><td className="messi-text">{row.messi}</td><td className="ronaldo-text">{row.ronaldo}</td></tr>)}</tbody><tfoot><tr><th scope="row">Overall trophies</th><td className="messi-text">{teamTrophyTotals.messi}</td><td className="ronaldo-text">{teamTrophyTotals.ronaldo}</td></tr></tfoot></table></div><div className="stats-footnote"><span>Overall totals include every team honour listed, including youth/Olympic titles and the MLS conference championship. Individual awards are separate.</span><a href={sources.trophies.url} target="_blank" rel="noreferrer">Trophy register <ArrowUpRight size={14} /></a></div></section>;
}
