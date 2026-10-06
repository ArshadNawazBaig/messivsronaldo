#!/usr/bin/env python3
"""Summarize an unmodified Search Console Performance CSV export, without joining dimensions.

python3 scripts/analyze-search-console.py --input /path/to/export --output .artifacts/search-console-summary.json
Uses only the standard library. Missing query rows are never interpreted as zero demand.
"""
import argparse
from collections import defaultdict
import csv
from datetime import date, timedelta
from hashlib import sha256
import json
from pathlib import Path
from urllib.parse import urlsplit


DIMENSIONS = {
    "Chart": "Date", "Pages": "Top pages", "Queries": "Top queries",
    "Countries": "Country", "Devices": "Device", "Search appearance": "Search Appearance",
}
LOCALES = {"ar", "de", "es", "fr", "hi", "nl", "pt", "th"}


def totals(rows):
    clicks = sum(row["Clicks"] for row in rows)
    impressions = sum(row["Impressions"] for row in rows)
    positioned = [row for row in rows if row["Position"] is not None]
    position_weight = sum(row["Impressions"] for row in positioned)
    return {
        "rows": len(rows), "clicks": clicks, "impressions": impressions,
        "ctr_percent": 100 * clicks / impressions if impressions else None,
        "approx_position_from_rounded_rows": (
            sum(row["Position"] * row["Impressions"] for row in positioned) / position_weight
            if position_weight else None
        ),
    }


def load_table(directory, name, dimension):
    path = directory / (name + ".csv")
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {dimension, "Clicks", "Impressions", "CTR", "Position"}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError(f"{path.name}: expected columns {sorted(required)}")
        rows = list(reader)
    seen = set()
    for row in rows:
        if row[dimension] in seen:
            raise ValueError(f"{path.name}: duplicate dimension {row[dimension]!r}")
        seen.add(row[dimension])
        row["Clicks"], row["Impressions"] = int(row["Clicks"]), int(row["Impressions"])
        row["Position"] = float(row["Position"]) if row["Position"] else None
        if row["Clicks"] < 0 or row["Impressions"] < 0:
            raise ValueError(f"{path.name}: negative counts")
        if row["CTR"] and row["Impressions"]:
            calculated = 100 * row["Clicks"] / row["Impressions"]
            if abs(float(row["CTR"].rstrip("%")) - calculated) > 0.011:
                raise ValueError(f"{path.name}: CTR does not reconcile for {row[dimension]!r}")
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    tables = {name: load_table(args.input, name, key) for name, key in DIMENSIONS.items()}
    with (args.input / "Filters.csv").open(encoding="utf-8-sig", newline="") as handle:
        filters = list(csv.DictReader(handle))
    chart = sorted(tables["Chart"], key=lambda row: row["Date"])
    if not chart:
        raise ValueError("Chart.csv contains no daily rows")
    dates = [date.fromisoformat(row["Date"]) for row in chart]
    first, last = dates[0], dates[-1]
    expected_dates = [first + timedelta(days=i) for i in range((last - first).days + 1)]
    if dates != expected_dates:
        raise ValueError("Chart.csv has missing dates; do not silently treat them as zero")
    summary = {name: totals(rows) for name, rows in tables.items()}
    baseline = summary["Chart"]
    groups, families = defaultdict(list), defaultdict(list)
    for row in tables["Pages"]:
        path = urlsplit(row["Top pages"]).path
        first_segment = path.strip("/").split("/")[0]
        locale = first_segment if first_segment in LOCALES else "en"
        family = (path[len(first_segment) + 1:] or "/") if first_segment in LOCALES else path
        groups[locale].append(row)
        families[family].append(row)
    weeks = []
    if len(chart) >= 14:
        for rows in (chart[-14:-7], chart[-7:]):
            weeks.append({"start": rows[0]["Date"], "end": rows[-1]["Date"], **totals(rows)})
    reconciliation = {
        name: {metric: summary[name][metric] == baseline[metric] for metric in ("clicks", "impressions")}
        for name in ("Countries", "Devices")
    }
    notes = [
        "Chart totals are the baseline; Pages impressions have a different aggregation.",
        "Query rows may be incomplete. No query-to-page join is present in these separate tables.",
        "Position aggregates here are estimates weighted from already rounded exported values.",
        "Date labels are retained as supplied; daily Search Console reports use Pacific Time.",
        "URL language groups describe URL prefixes, not the searcher's language or country.",
        "A page absent from Pages.csv is not thereby known to be unindexed.",
    ]
    if not all(all(values.values()) for values in reconciliation.values()):
        notes.append("Country/device counts differ from Chart; inspect filters, limits and export consistency.")
    report = {
        "filters": filters,
        "daily_coverage": {"start": first.isoformat(), "end": last.isoformat(), "days": len(chart)},
        "source_sha256": {name + ".csv": sha256((args.input / (name + ".csv")).read_bytes()).hexdigest()
                          for name in [*DIMENSIONS, "Filters"]},
        "totals_by_dimension": summary, "country_device_reconciliation": reconciliation,
        "query_table_share": {
            metric + "_percent": 100 * summary["Queries"][metric] / baseline[metric] if baseline[metric] else None
            for metric in ("clicks", "impressions")
        },
        "latest_two_complete_seven_day_blocks": weeks,
        "url_language_totals": {locale: totals(rows) for locale, rows in sorted(groups.items())},
        "page_family_totals": {path: totals(rows) for path, rows in sorted(families.items())},
        "pages_with_at_least_100_impressions_and_no_clicks": [
            row for row in tables["Pages"] if row["Impressions"] >= 100 and row["Clicks"] == 0
        ],
        "notes": notes,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"daily_coverage": report["daily_coverage"], "baseline": baseline,
                      "totals_by_dimension": summary, "reconciliation": reconciliation}, indent=2))


if __name__ == "__main__":
    main()
