"use client";
import { StatImageButton } from "@/components/admin-stat-export";
import { awardsReviewed } from "@/lib/awards";
import { useI18n } from "@/components/i18n-provider";
import Link from "@/components/localized-link";
import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { awardHistory, players } from "@/lib/football";
import { ChartTooltip, useChartTooltip } from "./chart-tooltip";
export function AwardChart({ full = false }: {
    full?: boolean;
}) {
    const { t, numberLocale } = useI18n();
    const [annual, setAnnual] = useState(false);
    const [hovered, setHovered] = useState(awardHistory.length - 1);
    const uid = useId();
    const tooltip = useChartTooltip<SVGSVGElement>();
    const active = awardHistory[hovered];
    const displayed = (player: "messi" | "ronaldo", item = active) => annual ? Number(players[player].awards.some(year => year === item.year)) : item[player];
    const x = (i: number) => 36 + i * (600 / (awardHistory.length - 1));
    const y = (value: number) => 210 - value * 21;
    const points = (player: "messi" | "ronaldo") => awardHistory.map((item, i) => `${i === 0 ? "M" : "H"} ${x(i)} ${i === 0 ? y(item[player]) : `V ${y(item[player])}`}`).join(" ");
    function selectPoint(clientX: number, element: SVGSVGElement) {
        const bounds = element.getBoundingClientRect();
        const point = (clientX - bounds.left) / bounds.width * 690;
        setHovered(Math.max(0, Math.min(awardHistory.length - 1, Math.round((point - 36) / 600 * (awardHistory.length - 1)))));
        tooltip.show();
    }
    return <div className={`story-grid ${full ? "full-chart" : ""}`}>
    <section className="panel award-chart"><div className="panel-heading"><div><span className="section-kicker">{t("INDIVIDUAL AWARDS")}</span><h2>{t("Ballon d\u2019Or wins")}</h2></div><div className="chart-toggle" aria-label={t("Chart display")} role="group"><button className={!annual ? "selected" : ""} aria-pressed={!annual} onClick={() => setAnnual(false)}>{t("Cumulative")}</button><button className={annual ? "selected" : ""} aria-pressed={annual} onClick={() => setAnnual(true)}>{t("By year")}</button></div></div><div className="chart-subline"><span>{t("Men\u2019s awards \u00B7 2008\u20132025")}</span><div className="chart-legend"><span><i className="legend-dot messi-dot"/>{t("Messi")}</span><span><i className="legend-dot ronaldo-dot"/>{t("Ronaldo")}</span></div></div>
      <div className="chart-container"><svg {...tooltip.triggerProps} viewBox="0 0 690 250" role="img" aria-label={t(`${annual ? "Annual" : "Cumulative"} Ballon d’Or awards, 2008 to 2025`)} aria-describedby={`${uid}-description${tooltip.tooltipProps.open ? ` ${tooltip.tooltipProps.id}` : ""}`} onPointerMove={event => { if (event.pointerType === "mouse") selectPoint(event.clientX, event.currentTarget); }} onPointerDown={event => selectPoint(event.clientX, event.currentTarget)} onKeyDown={event => {
        const index = event.key === "Home" ? 0 : event.key === "End" ? awardHistory.length - 1 : event.key === "ArrowLeft" ? hovered - 1 : event.key === "ArrowRight" ? hovered + 1 : null;
        if (index === null) return;
        event.preventDefault();
        setHovered(Math.max(0, Math.min(awardHistory.length - 1, index)));
        tooltip.show();
      }}><desc id={`${uid}-description`}>{`${active.year}: ${t("Messi")} ${displayed("messi")}, ${t("Ronaldo")} ${displayed("ronaldo")}. ${t("The 2020 award was cancelled.")}`}</desc>
        <defs><linearGradient id="messi-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6fc7ef" stopOpacity="0.14"/><stop offset="100%" stopColor="#6fc7ef" stopOpacity="0"/></linearGradient></defs>
        {(annual ? [0, 1] : [0, 2, 4, 6, 8]).map(value => <g key={value}><line x1="36" x2="644" y1={annual ? 210 - value * 150 : y(value)} y2={annual ? 210 - value * 150 : y(value)} className="chart-gridline"/><text x="12" y={(annual ? 210 - value * 150 : y(value)) + 4} className="chart-axis">{t(value)}</text></g>)}
        {!annual && <><path d={`${points("messi")} L ${x(awardHistory.length - 1)} 210 L 36 210 Z`} fill="url(#messi-area)"/><path d={points("messi")} className="chart-line messi-line"/><path d={points("ronaldo")} className="chart-line ronaldo-line"/><circle cx={x(awardHistory.length - 1)} cy={y(8)} r="4" fill="var(--messi)"/><circle cx={x(awardHistory.length - 1)} cy={y(5)} r="4" fill="var(--ronaldo)"/><text x="652" y={y(8) + 5} className="chart-end-label" fill="var(--messi)">8</text><text x="652" y={y(5) + 5} className="chart-end-label" fill="var(--ronaldo)">5</text></>}
        {awardHistory.map((item, i) => <g key={item.year}>{annual && <><rect x={x(i) - 7} y={players.messi.awards.some(year => year === item.year) ? 60 : 210} width="10" height={players.messi.awards.some(year => year === item.year) ? 150 : 0} rx="3" fill="var(--messi)"/><rect x={x(i) + 4} y={players.ronaldo.awards.some(year => year === item.year) ? 60 : 210} width="10" height={players.ronaldo.awards.some(year => year === item.year) ? 150 : 0} rx="3" fill="var(--ronaldo)"/></>}{(i % 4 === 0 || i === awardHistory.length - 1) && <text x={x(i)} y="239" textAnchor="middle" className="chart-axis">{t(item.year)}</text>}</g>)}
        {hovered !== null && !annual && <g pointerEvents="none"><line x1={x(hovered)} x2={x(hovered)} y1="22" y2="210" className="chart-hoverline"/><circle cx={x(hovered)} cy={y(awardHistory[hovered].messi)} r="5" fill="var(--messi)"/><circle cx={x(hovered)} cy={y(awardHistory[hovered].ronaldo)} r="5" fill="var(--ronaldo)"/></g>}
      </svg><ChartTooltip {...tooltip.tooltipProps} x={x(hovered) / 690} y={(annual ? 210 - Math.max(displayed("messi"), displayed("ronaldo")) * 150 : y(Math.max(active.messi, active.ronaldo))) / 250} title={String(active.year)} metric={`${t("Ballon d’Or wins")} · ${t(annual ? "Annual totals" : "Cumulative")}`} entries={(["messi", "ronaldo"] as const).map(player => ({ player, value: displayed(player).toLocaleString(numberLocale) }))} note={active.year === 2020 ? t("The 2020 award was cancelled.") : undefined}/></div>
      <StatImageButton placement="toolbar" stats={awardHistory.toReversed().map(item => ({ title: "Ballon d’Or awards", context: `${annual ? "Annual" : "Cumulative"} · ${item.year}`, values: annual ? { messi: Number(players.messi.awards.some(year => year === item.year)), ronaldo: Number(players.ronaldo.awards.some(year => year === item.year)) } : { messi: item.messi, ronaldo: item.ronaldo }, date: awardsReviewed, note: item.year === 2020 ? "The 2020 award was cancelled." : "Men’s Ballon d’Or · Completed editions" }))}/>
    </section>
    {!full && <aside className="legacy-card"><span className="section-kicker">2008—2025</span><h2>{t("13 of 17")}<span>{t(" Ballon d\u2019Or awards")}</span></h2><p>{t("Between them, Messi and Ronaldo won 13 of the 17 Ballon d\u2019Or awards presented from 2008 to 2025.")}</p><div className="legacy-counts"><div><strong className="messi-text">8</strong><span>{t("MESSI")}</span></div><span className="legacy-count-divider"/><div><strong className="ronaldo-text">5</strong><span>{t("RONALDO")}</span></div></div><Link href="/honours">{t("Explore the honours ")}<ArrowRight size={16}/></Link></aside>}
  </div>;
}
