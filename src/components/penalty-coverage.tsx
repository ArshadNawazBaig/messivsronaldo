"use client";
import Link from "@/components/localized-link";
import { useI18n } from "@/components/i18n-provider";
import type { Metric } from "@/lib/football";

export function PenaltyCoverage({ metric, baselineDate }: { metric: Metric; baselineDate: string }) {
  const { t, numberLocale } = useI18n();
  if (!metric.ratioInputs) return null;
  const { numerator, denominator } = metric.ratioInputs;
  const rows = [
    { label: "Penalty goals in this sample", values: numerator },
    { label: "Penalties taken", values: denominator },
    { label: "Unsuccessful attempts", values: { messi: denominator.messi - numerator.messi, ronaldo: denominator.ronaldo - numerator.ronaldo } },
    { label: "Penalty conversion", values: metric.values, percent: true },
  ];
  return <section className="panel penalty-coverage" aria-labelledby="penalty-sample-title" id="penalty-sample">
    <h2 id="penalty-sample-title">{t("Conversion for the verified sample")}</h2>
    <p>{t("Only penalties with both scored and attempted counts verified enter this calculation. Newer penalty goals may appear above without entering this sample. Shootouts are excluded.")}</p>
    <div className="stats-table-wrap"><table className="penalty-sample-table">
      <caption>{metric.coverage ? t(metric.coverage) : `${t("Data cutoff: ")}${t(baselineDate)}`}</caption>
      <thead><tr><th scope="col">{t("Statistic")}</th><th scope="col">Messi</th><th scope="col">Ronaldo</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.label}><th scope="row">{t(row.label)}</th>{(["messi", "ronaldo"] as const).map(player => <td key={player}>{row.values[player].toLocaleString(numberLocale, { minimumFractionDigits: row.percent ? 2 : 0, maximumFractionDigits: row.percent ? 2 : 0 })}{row.percent ? t("%") : ""}</td>)}</tr>)}</tbody>
    </table></div>
    <p>{t("Successful in-match penalties ÷ attempts × 100. Shootout kicks excluded.")}</p>
    <p className="penalty-inputs">{(["messi", "ronaldo"] as const).map(player => <span key={player}>{player === "messi" ? "Messi" : "Ronaldo"}: {numerator[player].toLocaleString(numberLocale)} ÷ {denominator[player].toLocaleString(numberLocale)} × 100 = {metric.values[player].toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{t("%")}</span>)}</p>
    <p><Link href="/updates">{t("Published match updates")}</Link>{" · "}<Link href="/methodology">{t("Sources & counting rules")}</Link></p>
  </section>;
}
