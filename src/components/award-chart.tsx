"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { awardHistory, players, sources } from "@/lib/data";

export function AwardChart({ full = false }: { full?: boolean }) {
  const [annual, setAnnual] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const x = (i: number) => 36 + i * (600 / (awardHistory.length - 1));
  const y = (value: number) => 210 - value * 21;
  const points = (player: "messi" | "ronaldo") => awardHistory.map((item, i) => `${i === 0 ? "M" : "H"} ${x(i)} ${i === 0 ? y(item[player]) : `V ${y(item[player])}`}`).join(" ");
  return <div className={`story-grid ${full ? "full-chart" : ""}`}>
    <section className="panel award-chart"><div className="panel-heading"><div><span className="section-kicker">INDIVIDUAL AWARDS</span><h2>Ballon d’Or wins</h2></div><div className="chart-toggle" aria-label="Chart display" role="group"><button className={!annual ? "selected" : ""} aria-pressed={!annual} onClick={() => setAnnual(false)}>Cumulative</button><button className={annual ? "selected" : ""} aria-pressed={annual} onClick={() => setAnnual(true)}>By year</button></div></div><div className="chart-subline"><span>Men’s awards · 2008–2025</span><div className="chart-legend"><span><i className="legend-dot messi-dot" />Messi</span><span><i className="legend-dot ronaldo-dot" />Ronaldo</span></div></div>
      <div className="chart-container"><svg viewBox="0 0 690 250" role="img" aria-labelledby="award-chart-title award-chart-description"><title id="award-chart-title">{`${annual ? "Annual" : "Cumulative"} Ballon d’Or awards, 2008 to 2025`}</title><desc id="award-chart-description">Messi won eight awards and Ronaldo won five. A complete table follows the chart. No award was given in 2020.</desc>
        <defs><linearGradient id="messi-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6fc7ef" stopOpacity="0.14" /><stop offset="100%" stopColor="#6fc7ef" stopOpacity="0" /></linearGradient></defs>
        {(annual ? [0, 1] : [0, 2, 4, 6, 8]).map(value => <g key={value}><line x1="36" x2="644" y1={annual ? 210 - value * 150 : y(value)} y2={annual ? 210 - value * 150 : y(value)} className="chart-gridline" /><text x="12" y={(annual ? 210 - value * 150 : y(value)) + 4} className="chart-axis">{value}</text></g>)}
        {!annual && <><path d={`${points("messi")} L ${x(awardHistory.length - 1)} 210 L 36 210 Z`} fill="url(#messi-area)" /><path d={points("messi")} className="chart-line messi-line" /><path d={points("ronaldo")} className="chart-line ronaldo-line" /><circle cx={x(awardHistory.length - 1)} cy={y(8)} r="4" fill="var(--messi)" /><circle cx={x(awardHistory.length - 1)} cy={y(5)} r="4" fill="var(--ronaldo)" /><text x="652" y={y(8) + 5} className="chart-end-label" fill="var(--messi)">8</text><text x="652" y={y(5) + 5} className="chart-end-label" fill="var(--ronaldo)">5</text></>}
        {awardHistory.map((item, i) => <g key={item.year} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>{annual && <><rect x={x(i) - 7} y={players.messi.awards.some(year => year === item.year) ? 60 : 210} width="10" height={players.messi.awards.some(year => year === item.year) ? 150 : 0} rx="3" fill="var(--messi)" /><rect x={x(i) + 4} y={players.ronaldo.awards.some(year => year === item.year) ? 60 : 210} width="10" height={players.ronaldo.awards.some(year => year === item.year) ? 150 : 0} rx="3" fill="var(--ronaldo)" /></>}{(i % 4 === 0 || i === awardHistory.length - 1) && <text x={x(i)} y="239" textAnchor="middle" className="chart-axis">{item.year}</text>}<rect x={x(i) - 17} y="25" width="34" height="185" fill="transparent"><title>{`${item.year}: Messi ${item.messi}, Ronaldo ${item.ronaldo} cumulative awards${item.year === 2020 ? "; award cancelled" : ""}`}</title></rect></g>)}
        {hovered !== null && !annual && <g pointerEvents="none"><line x1={x(hovered)} x2={x(hovered)} y1="22" y2="210" className="chart-hoverline" /><circle cx={x(hovered)} cy={y(awardHistory[hovered].messi)} r="5" fill="var(--messi)" /><circle cx={x(hovered)} cy={y(awardHistory[hovered].ronaldo)} r="5" fill="var(--ronaldo)" /></g>}
      </svg></div>
      <details className="chart-data"><summary>View data & source <Chevron /></summary><table><caption>Cumulative awards at year end</caption><thead><tr><th>Year</th><th>Messi</th><th>Ronaldo</th></tr></thead><tbody>{awardHistory.map(item => <tr key={item.year}><th scope="row">{item.year}{item.year === 2020 ? " (cancelled)" : ""}</th><td>{item.messi}</td><td>{item.ronaldo}</td></tr>)}</tbody></table><a href={sources.ballon.url} target="_blank" rel="noreferrer">Source: {sources.ballon.name} <ArrowUpRight size={12} /></a></details>
    </section>
    {!full && <aside className="legacy-card"><span className="section-kicker">2008—2025</span><h2>13 of 17<span> Ballon d’Or awards</span></h2><p>Between them, Messi and Ronaldo won 13 of the 17 Ballon d’Or awards presented from 2008 to 2025.</p><div className="legacy-counts"><div><strong className="messi-text">8</strong><span>MESSI</span></div><span className="legacy-count-divider" /><div><strong className="ronaldo-text">5</strong><span>RONALDO</span></div></div><Link href="/honours">Explore the honours <ArrowRight size={16} /></Link></aside>}
  </div>;
}

function Chevron() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m3 4.5 3 3 3-3" stroke="currentColor" /></svg>; }
