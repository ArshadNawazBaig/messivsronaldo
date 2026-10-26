#!/usr/bin/env python3
"""Summarize an unmodified Search Console Performance CSV export, without joining dimensions.

python3 scripts/analyze-search-console.py --input /path/to/export --output .artifacts/search-console-summary.json
Uses only the standard library. Missing query rows are never interpreted as zero demand.
Add --artifacts-dir /path/to/audit to also write URL buckets and query review CSVs.
"""
import argparse
from collections import defaultdict
import csv
from datetime import date, timedelta
from hashlib import sha256
import json
from pathlib import Path
import re
import unicodedata
from urllib.parse import urlsplit


DIMENSIONS = {
    "Chart": "Date", "Pages": "Top pages", "Queries": "Top queries",
    "Countries": "Country", "Devices": "Device", "Search appearance": "Search Appearance",
}
LOCALES = {"ar", "de", "es", "fr", "hi", "nl", "pt", "th"}

# Operational review thresholds, not Google classifications or CTR benchmarks.
NEAR_ZERO_MAX = 10
LOW_CTR_MIN_IMPRESSIONS = 100
LOW_CTR_PERCENT = 1.0
QUESTION_WORDS = re.compile(
    r"\b(who|what|why|when|where|how|which|combien|quel|quelle|quels|quelles|qui|"
    r"wer|wie|wann|warum|wieviel|wanneer|hoe|hoeveel|wat|cuantos|cuantas|quien|"
    r"cuando|como|quantos|quantas|quem|quanto|كم|متى|كيف|لماذا)\b|من (?:هو|الافضل)|[?؟]"
)
COMPARISON_WORDS = re.compile(r"\b(vs|versus|better|best|besser|beter|meilleur|mejor|melhor)\b")


def normalized(value):
    return "".join(char for char in unicodedata.normalize("NFKD", value.casefold())
                   if not unicodedata.combining(char))


def query_tags(query):
    text = normalized(query)
    # Keep the distinctive brand contiguous: stripping punctuation would
    # incorrectly classify the season query "messi vs ronaldo 17/18" as brand.
    branded = bool(re.search(r"\bmessivsronaldo17(?:\.com)?\b", text))
    if branded:
        intent = "navigational"
    elif re.search(r"\b(buy|purchase|tickets|comprar|acheter)\b", text):
        intent = "transactional_candidate"
    elif re.search(r"\b(price|pricing|subscription|coupon)\b", text):
        intent = "commercial_candidate"
    elif text.endswith(" app") or ".com" in text or re.search(r"\bmessivsronaldo\b", text):
        intent = "navigational_candidate"
    elif len(text) < 4 or re.fullmatch(r"[\d /-]+", text):
        intent = "ambiguous_short_query"
    else:
        intent = "informational_candidate"
    return {
        "brand_class": "explicit_site_brand" if branded else "no_explicit_site_brand",
        "intent_heuristic": intent,
        "question_heuristic": bool(QUESTION_WORDS.search(text)),
        "comparison_or_best_heuristic": bool(COMPARISON_WORDS.search(text)),
    }


def page_bucket(row):
    impressions, clicks, position = row["Impressions"], row["Clicks"], row["Position"]
    ctr = 100 * clicks / impressions if impressions else 0
    near_zero = impressions <= NEAR_ZERO_MAX
    low_ctr = impressions >= LOW_CTR_MIN_IMPRESSIONS and ctr < LOW_CTR_PERCENT
    striking = position is not None and 8 <= position <= 30
    healthy = (impressions >= 100 and clicks >= 3 and ctr >= 1
               and position is not None and position < 8)
    if near_zero:
        bucket = "b_near_zero_impressions_current_indexing_unknown"
    elif low_ctr:
        bucket = "c_very_low_ctr_review"
    elif striking:
        bucket = "d_average_position_8_to_30"
    elif healthy:
        bucket = "e_relatively_healthy_observed_performance"
    else:
        bucket = "f_limited_sample_or_other_performance_review"
    return {
        "performance_bucket": bucket,
        "near_zero_impressions_flag": near_zero,
        "very_low_ctr_flag": low_ctr,
        "position_8_to_30_flag": striking,
        "healthy_observed_flag": healthy,
        "current_indexing_status": "unknown_requires_page_indexing_or_url_inspection",
        "exact_not_indexed_reason": "not_available_in_performance_export",
    }


def change_between(before, after):
    earlier, later = totals(before), totals(after)
    return {
        "before": {"start": before[0]["Date"], "end": before[-1]["Date"], **earlier},
        "after": {"start": after[0]["Date"], "end": after[-1]["Date"], **later},
        "change_percent": {
            key: 100 * (later[key] / earlier[key] - 1) if earlier[key] else None
            for key in ("clicks", "impressions")
        },
        "ctr_change_percentage_points": later["ctr_percent"] - earlier["ctr_percent"],
    }


def write_csv(path, rows):
    if not rows:
        raise ValueError(f"Cannot infer CSV columns for empty output {path}")
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


# Editorially selected distinct tasks for this export. Query metrics always come
# from the exact query row. Candidate URLs are suggestions, never joined GSC data.
OPPORTUNITIES = [
    ("total de but de messi et ronaldo 2026", "/fr/goals", "/fr/2026",
     "Clarify career totals versus 2026-only totals in the first answer; show as-of date and sources."),
    ("wanneer wordt de ballon d or uitgereikt 2026", "/nl/insights/ballon-dor-2026-date-voting-rules", "",
     "Verify the official ceremony date/status and lead with it in Dutch; do not infer a date or treat an elapsed event as upcoming."),
    ("ronaldo international assists", "/international", "",
     "Answer Portugal senior assists directly with provider definition, as-of date and source; distinguish competitive matches and friendlies."),
    ("nombre de coup franc marqué par messi et ronaldo", "/fr/insights/messi-ronaldo-free-kick-records", "/fr/free-kicks",
     "State sourced direct-free-kick totals and exclusions in French; assign a distinct role to the records article and stats table."),
    ("2008 ronaldo vs 2009 messi stats", "/seasons/2008", "/seasons/2009",
     "Confirm the actual landing page in GSC; link the existing year pages and compare matching calendar-year scopes before considering one dedicated comparison."),
    ("messi vs cr7 estadísticas 2026", "/es/2026", "",
     "Provide a Spanish year-to-date comparison with a timestamp, competition coverage and definition of goals/assists."),
    ("wie viele freistoßtore hat messi", "/de/free-kicks", "",
     "Place a sourced German direct answer above the free-kick table with update date and counting rules."),
    ("messi vs ronaldo free kick goals", "/free-kicks", "",
     "Improve the direct answer and table labels for total direct free kicks; cite sources and link the methodology."),
    ("total goals scored by messi and ronaldo", "/goals", "",
     "Lead with career club-plus-country totals, date and scope; retain separate year-only and non-penalty breakdowns."),
    ("wer ist besser messi oder ronaldo 2026", "/de/2026", "",
     "Answer with transparent 2026 comparison criteria and sourced statistics; avoid presenting an opinion as an objective winner."),
]


def query_opportunities(rows, pages):
    queries = {row["Top queries"]: row for row in rows}
    observed_pages = {row["Top pages"] for row in pages}
    output = []
    for query, path, secondary_path, action in OPPORTUNITIES:
        if query not in queries:
            continue
        row = queries[query]
        url = "https://messivsronaldo17.com" + path
        output.append({
            "priority": len(output) + 1, "query": query, "clicks": row["Clicks"],
            "impressions": row["Impressions"], "ctr_percent": 100 * row["Clicks"] / row["Impressions"],
            "average_position": row["Position"],
            "signal": "average_position_8_to_20" if 8 <= row["Position"] <= 20 else "visible_demand_review_answer_and_snippet",
            "candidate_url": url,
            "secondary_candidate_url": "https://messivsronaldo17.com" + secondary_path if secondary_path else "",
            "candidate_url_has_own_page_export_row": url in observed_pages,
            "mapping_evidence": "editorial_topic_match_only_not_query_page_attribution",
            "action": action,
            "verification": "Filter the exact query in GSC and open Pages before changing URL targeting; compare matched dates/device/country.",
        })
    return output


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
    parser.add_argument("--artifacts-dir", type=Path,
                        help="Optionally write performance buckets and query review CSVs here")
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
        "A page with impressions was credited search visibility during this window; its current indexing state is unknown.",
        "No page-by-date or query-by-page table was supplied: page gains/losses and cannibalization cannot be established.",
        "No expected CTR curve is supplied. Low-CTR thresholds are triage rules, not causal findings or industry benchmarks.",
        "Intent, question, comparison and site-brand labels are transparent heuristics; names Messi and Ronaldo alone are not site brand.",
        "All measurements retain the Filters.csv search type, including its Web (text-based) wording; no AI report is present.",
    ]
    if len(tables["Queries"]) == 1000:
        notes.append("Exactly 1,000 exported query rows suggests a UI row limit; anonymized/omitted queries also prevent complete query coverage.")
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
    bucket_rows, bucket_groups = [], defaultdict(list)
    for row in tables["Pages"]:
        tags = page_bucket(row)
        bucket_groups[tags["performance_bucket"]].append(row)
        bucket_rows.append({
            "url": row["Top pages"], "clicks": row["Clicks"], "impressions": row["Impressions"],
            "ctr_percent": 100 * row["Clicks"] / row["Impressions"] if row["Impressions"] else 0,
            "average_position": row["Position"], **tags,
        })
    query_rows, intent_groups, brand_groups = [], defaultdict(list), defaultdict(list)
    question_rows, comparison_rows = [], []
    for row in tables["Queries"]:
        tags = query_tags(row["Top queries"])
        intent_groups[tags["intent_heuristic"]].append(row)
        brand_groups[tags["brand_class"]].append(row)
        query_rows.append({"query": row["Top queries"], "clicks": row["Clicks"],
                           "impressions": row["Impressions"], "ctr": row["CTR"],
                           "average_position": row["Position"], **tags})
        if tags["question_heuristic"]:
            question_rows.append(row)
        if tags["comparison_or_best_heuristic"]:
            comparison_rows.append(row)
    pages_sorted = sorted(tables["Pages"], key=lambda row: (row["Clicks"], row["Impressions"]), reverse=True)
    page_totals = summary["Pages"]
    opportunities = query_opportunities(tables["Queries"], tables["Pages"])
    report.update({
        "performance_bucket_definitions": {
            "indexing": "No category a (not indexed) assignment is possible from these performance CSVs.",
            "priority_order": "near-zero impressions, low CTR, position 8-30, relatively healthy, other; additional flags retain overlaps",
            "b_near_zero_impressions_current_indexing_unknown": "0-10 impressions in the supplied window; current indexing state unknown",
            "c_very_low_ctr_review": "At least 100 impressions and calculated CTR below 1%; operational threshold, not a position-adjusted benchmark",
            "d_average_position_8_to_30": "Average exported position from 8 through 30 inclusive, after prior buckets",
            "e_relatively_healthy_observed_performance": "At least 100 impressions, 3 clicks, 1% CTR and average position below 8, after prior buckets",
            "f_limited_sample_or_other_performance_review": "Remaining rows; avoids mislabelling small samples or poor positions as healthy",
        },
        "performance_bucket_totals": {key: totals(rows) for key, rows in sorted(bucket_groups.items())},
        "page_counts": {
            "with_impressions": sum(row["Impressions"] > 0 for row in tables["Pages"]),
            "with_clicks": sum(row["Clicks"] > 0 for row in tables["Pages"]),
            "without_clicks": sum(row["Clicks"] == 0 for row in tables["Pages"]),
            "average_position_8_to_30_all_samples": sum(row["position_8_to_30_flag"] for row in bucket_rows),
            "at_least_100_impressions_and_ctr_below_1_percent": sum(row["very_low_ctr_flag"] for row in bucket_rows),
        },
        "click_concentration": {
            "denominator": "Sum of page table clicks (different aggregation from Chart)",
            "top_1_percent": 100 * pages_sorted[0]["Clicks"] / page_totals["clicks"],
            "top_2_percent": 100 * sum(row["Clicks"] for row in pages_sorted[:2]) / page_totals["clicks"],
            "top_10_percent": 100 * sum(row["Clicks"] for row in pages_sorted[:10]) / page_totals["clicks"],
        } if page_totals["clicks"] else {},
        "top_pages_by_clicks": pages_sorted[:20],
        "high_impression_low_ctr_pages": sorted(
            [row for row in tables["Pages"] if page_bucket(row)["very_low_ctr_flag"]],
            key=lambda row: row["Impressions"], reverse=True)[:25],
        "top_page_families_by_clicks": [
            {"path_without_language_prefix": key, **totals(rows)}
            for key, rows in sorted(families.items(), key=lambda item: totals(item[1])["clicks"], reverse=True)[:20]
        ],
        "query_brand_heuristic": {
            "definition": "Explicit contiguous domain/name messivsronaldo17; entity names and season queries such as 17/18 do not count",
            "totals": {key: totals(brand_groups[key]) for key in ("explicit_site_brand", "no_explicit_site_brand")},
            "limitation": "Absence of branded rows does not prove absence of brand demand; query export is incomplete",
        },
        "query_intent_heuristic": {key: totals(intent_groups[key]) for key in (
            "informational_candidate", "navigational", "navigational_candidate", "commercial_candidate",
            "transactional_candidate", "ambiguous_short_query")},
        "question_query_heuristic": {"totals": totals(question_rows), "top_30": sorted(
            question_rows, key=lambda row: row["Impressions"], reverse=True)[:30]},
        "comparison_or_best_query_heuristic": totals(comparison_rows),
        "selected_query_clusters": {
            "dutch_ballon_ceremony_date": {
                "definition": "Query contains ballon and at least one of wanneer, uitreik, hoe laat; observed query rows only",
                **totals([row for row in tables["Queries"] if "ballon" in row["Top queries"]
                          and any(term in row["Top queries"] for term in ("wanneer", "uitreik", "hoe laat"))]),
            },
            "messi_ronaldo_2008_2009": {
                "definition": "Query contains both 2008 and 2009, plus messi or ronaldo; observed query rows only",
                **totals([row for row in tables["Queries"] if "2008" in row["Top queries"]
                          and "2009" in row["Top queries"]
                          and any(term in row["Top queries"] for term in ("messi", "ronaldo"))]),
            },
        },
        "visible_head_query_examples": [row for row in tables["Queries"] if row["Top queries"] in (
            "messi vs ronaldo", "ronaldo vs messi", "messi vs ronaldo stats", "messi stats", "ronaldo stats")],
        "queries_position_8_to_20_at_least_30_impressions": sorted(
            [row for row in tables["Queries"] if row["Position"] is not None
             and 8 <= row["Position"] <= 20 and row["Impressions"] >= 30],
            key=lambda row: row["Impressions"], reverse=True),
        "top_10_distinct_editorial_query_opportunities": opportunities,
        "opportunity_selection": "Ten manually selected distinct query/topic tasks from this audit's data, balancing impressions, CTR and position; no projected clicks or inferred URL attribution",
        "devices": tables["Devices"],
        "top_countries_by_clicks": sorted(tables["Countries"], key=lambda row: row["Clicks"], reverse=True)[:15],
        "search_appearance": {"rows": len(tables["Search appearance"]), "interpretation": "Empty table; cannot infer rich-result eligibility, absence of features or AI visibility"},
        "highest_impression_day_and_last_day": {
            "highest_impression_day": max(chart, key=lambda row: row["Impressions"]),
            "last_day": chart[-1],
            "caveat": "Descriptive daily values; weekday mix, demand, query mix and reporting effects prevent a causal conclusion",
        },
    })
    if len(chart) >= 14:
        report["first_vs_last_seven_days"] = change_between(chart[:7], chart[-7:])
        report["previous_vs_latest_seven_days"] = change_between(chart[-14:-7], chart[-7:])
    if len(chart) == 28:
        report["first_vs_second_fourteen_days"] = change_between(chart[:14], chart[14:])
        report["four_seven_day_blocks"] = [
            {"start": chart[index]["Date"], "end": chart[index + 6]["Date"], **totals(chart[index:index + 7])}
            for index in range(0, 28, 7)
        ]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    if args.artifacts_dir:
        args.artifacts_dir.mkdir(parents=True, exist_ok=True)
        write_csv(args.artifacts_dir / "url-buckets.csv", bucket_rows)
        write_csv(args.artifacts_dir / "query-segments.csv", query_rows)
        if opportunities:
            write_csv(args.artifacts_dir / "query-opportunities.csv", opportunities)
    print(json.dumps({"daily_coverage": report["daily_coverage"], "baseline": baseline,
                      "totals_by_dimension": summary, "reconciliation": reconciliation}, indent=2))


if __name__ == "__main__":
    main()
