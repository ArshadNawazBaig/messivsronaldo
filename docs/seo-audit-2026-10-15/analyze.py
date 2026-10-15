"""Reproduce the supplied GSC baseline without joining query and page reports.

Usage: python3 docs/seo-audit-2026-10-15/analyze.py /path/to/export
Outputs stay beside this script. Query groups overlap where documented.
"""
import csv
import hashlib
import json
import pathlib
import re
import sys
from collections import Counter, defaultdict
from datetime import date, timedelta
from urllib.parse import urlparse

source = pathlib.Path(sys.argv[1])
out = pathlib.Path(__file__).parent
data = {f.stem: list(csv.DictReader(f.open(encoding="utf-8-sig"))) for f in sorted(source.glob("*.csv"))}

def metrics(rows):
    clicks = sum(int(r["Clicks"]) for r in rows)
    impressions = sum(int(r["Impressions"]) for r in rows)
    return {"rows": len(rows), "clicks": clicks, "impressions": impressions,
            "ctr_percent": 100 * clicks / impressions if impressions else None,
            "approx_impression_weighted_position": sum(float(r["Position"] or 0) * int(r["Impressions"]) for r in rows) / impressions if impressions else None}

summary = {"research_date": "2026-10-15", "source_directory": str(source), "filters": data["Filters"],
           "property": "Not recorded in the supplied exports; page URLs are on messivsronaldo17.com and host/protocol variants.",
           "input_sha256": {f.name: hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(source.glob("*.csv"))},
           "reports": {}, "query_groups_overlap": True}
for name, rows in data.items():
    if not rows or "Clicks" not in rows[0]:
        summary["reports"][name] = {"rows": len(rows)}
        continue
    key = next(iter(rows[0]))
    invalid=[]
    for index, row in enumerate(rows, start=2):
        c, i = int(row["Clicks"]), int(row["Impressions"])
        if c < 0 or i < 0 or c > i: invalid.append({"line":index,"reason":"invalid click/impression count"})
        if i and abs(float(row["CTR"].rstrip("%")) - 100*c/i) > 0.011:invalid.append({"line":index,"reason":"CTR exceeds rounding tolerance"})
    summary["reports"][name] = {**metrics(rows), "duplicate_dimension_rows": len(rows) - len({r[key] for r in rows}),
                                 "blank_fields": {k: sum(r[k] == "" for r in rows) for k in rows[0]}, "invalid_rows": invalid}
dates=sorted(date.fromisoformat(r["Date"]) for r in data["Chart"])
summary["dates"]={"first":str(dates[0]),"last":str(dates[-1]),"missing_inside_interval":[str(dates[0]+timedelta(days=i)) for i in range((dates[-1]-dates[0]).days+1) if dates[0]+timedelta(days=i) not in dates],"nominal_filter":"Last 28 days","observed_days":len(dates),"preliminary_status":"Unknown: CSV has no final/preliminary marker."}
locales={"ar","de","es","fr","hi","nl","pt","th"}
groups=defaultdict(list)
for row in data["Pages"]:
    prefix=urlparse(row["Top pages"]).path.strip("/").split("/")[0]
    groups[prefix if prefix in locales else "en"].append(row)
summary["page_locale_groups"]={k:metrics(v) for k,v in groups.items()}
summary["page_hosts"]=dict(Counter(urlparse(r["Top pages"]).netloc for r in data["Pages"]))
summary["page_protocols"]=dict(Counter(urlparse(r["Top pages"]).scheme for r in data["Pages"]))
summary["zero_click_page_rows"]=sum(int(r["Clicks"])==0 for r in data["Pages"])
queries=data["Queries"]
definitions=[
 ("international_player_records", "Contains international and Messi/Ronaldo/CR7; excludes unrelated international queries", lambda q:"international" in q and any(x in q for x in ["messi","ronaldo","cr7"]),"/international"),
 ("ronaldo_international_assists_only", "Subset of international: contains assist and Ronaldo/CR7; excludes Messi and goal",lambda q:"international" in q and "assist" in q and any(x in q for x in ["ronaldo","cr7"]) and "messi" not in q and "goal" not in q,"/international"),
 ("english_penalty_terms", "English lexical penalty/penalties, including non-penalty and generic wording; mixed subintents", lambda q:bool(re.search(r"\b(penalty|penalties)\b",q)),"/penalties and explanatory article, by intent"),
 ("english_free_kicks", "Contains free kick, free-kick or freekick; English lexical grouping", lambda q:bool(re.search(r"free[ -]?kick",q)),"/free-kicks"),
 ("year_2017", "Contains 2017; mixed calendar/season and language intent, needs manual review",lambda q:"2017" in q,"/seasons/2017 or club-season URL, by intent"),
 ("years_2012_or_2013", "Contains 2012 or 2013; mixed calendar/season/language, NOT a peak-comparison cluster",lambda q:"2012" in q or "2013" in q,"Existing calendar-year/club-season/peak article, by intent"),
 ("broad_comparison_exact", "Exact Messi vs Ronaldo / Ronaldo vs Messi, optionally stats or statistics",lambda q:q in ["messi vs ronaldo","ronaldo vs messi","messi vs ronaldo stats","messi vs ronaldo statistics","ronaldo vs messi stats","ronaldo vs messi statistics"],"/"),
 ("owned_brand_strict", "Contains domain messivsronaldo17 or phrase the rivalry; player names are not publisher brand",lambda q:"messivsronaldo17" in q or bool(re.search(r"\bthe rivalry\b",q)),"/"),
 ("ambiguous_domain_navigation", "Contains concatenated messivsronaldo but not messivsronaldo17, or Messi vs Ronaldo app",lambda q:("messivsronaldo" in q and "messivsronaldo17" not in q) or "messi vs ronaldo app" in q,"Ambiguous or competitor navigation; no new page"),
]
members=[]; summaries=[]
for name,definition,predicate,target in definitions:
    rows=[r for r in queries if predicate(r["Top queries"].lower())]
    summaries.append({"group":name,"definition":definition,"proposed_destination_not_observed_attribution":target,**metrics(rows)})
    for row in rows:members.append({"group":name,"query":row["Top queries"],"clicks":row["Clicks"],"impressions":row["Impressions"],"ctr":row["CTR"],"position":row["Position"]})
summary["query_groups"]=summaries
summary["position_triage"]={label:metrics([r for r in queries if lo<=float(r["Position"])<=hi]) for label,lo,hi in [("4.00_to_10.00",4,10),("11.00_to_20.00",11,20)]}
summary["position_triage_note"]="Literal inclusive ranges; averages 3.xx and 10.xx are outside these two filters. No rounded ranks or promises."
for name,rows in [("query-clusters.csv",summaries),("query-members.csv",members),("english-pages.csv",sorted(groups['en'],key=lambda r:int(r['Impressions']),reverse=True))]:
    with (out/name).open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
(out/'baseline.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
assert summary['reports']['Chart']['clicks']==summary['reports']['Countries']['clicks']==summary['reports']['Devices']['clicks']==346
assert summary['reports']['Chart']['impressions']==summary['reports']['Countries']['impressions']==summary['reports']['Devices']['impressions']==30358
assert all(not r.get('invalid_rows') and not r.get('duplicate_dimension_rows') for r in summary['reports'].values())
print(json.dumps({"reports":summary['reports'],"dates":summary['dates'],"hosts":summary['page_hosts'],"protocols":summary['page_protocols'],"zero_click_page_rows":summary['zero_click_page_rows'],"query_groups":summaries},ensure_ascii=False,indent=2))
