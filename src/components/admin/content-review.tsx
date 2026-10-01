"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { AdminPagination, useTablePagination } from "./pagination";
import type { contentReview } from "@/lib/content-review";
import styles from "./content-review.module.css";

// Rendered only behind the existing admin sign-in check.
export function ContentReview({ report }: { report: ReturnType<typeof contentReview> }) {
  const actions = report.issues.filter(issue => issue.severity === "action");
  const [severity, setSeverity] = useState("all");
  const pagination = useTablePagination(report.issues.filter(issue => severity === "all" || issue.severity === severity), severity);
  return <section className={`panel ${styles.review}`} aria-labelledby="content-review-title">
    <span className="section-kicker">EDITORIAL OPERATIONS</span><h2 id="content-review-title">Content review</h2>
    <p>Automatic checks for references, related links, review dates and data coverage. These are editorial checks, not a search ranking score. Checked {report.today} (UTC).</p>
    <dl className={styles.summary}><div><dt>Public pages per language</dt><dd>{report.pageCount}</dd></div><div><dt>Articles checked</dt><dd>{report.articleCount}</dd></div><div><dt>Items to review</dt><dd>{actions.length}</dd></div></dl>
    <div className={styles.cutoffs}><p><strong>Core-stat cutoff</strong><time dateTime={report.coreCutoff}>{report.coreCutoff}</time></p><p><strong>Career scoring coverage</strong><span><time dateTime={report.goalTypeCutoff}>{report.goalTypeCutoff}</time>{report.goalTypeLatest !== report.goalTypeCutoff && <> – <time dateTime={report.goalTypeLatest}>{report.goalTypeLatest}</time></>}</span></p><Link href="/updates">Review match coverage <ArrowUpRight size={14}/></Link></div>
    {!actions.length && <p className={styles.status}><CheckCircle2 size={18}/> No urgent issues detected by these checks.</p>}
    <h3>Review queue</h3><div className="admin-table-tools"><label className="admin-field">Priority<Select label="Review priority" value={severity} onValueChange={setSeverity} options={[{value:"all",label:"All checks"},{value:"action",label:"Review needed"},{value:"suggestion",label:"Editorial suggestions"}]}/></label></div><div className="admin-table-wrap" role="region" aria-label="Content review queue" tabIndex={0}><table className="admin-table"><caption className="sr-only">Content review queue</caption><thead><tr><th scope="col">Page</th><th scope="col">Priority</th><th scope="col">Finding</th><th scope="col">Action</th></tr></thead><tbody>{pagination.rows.map((issue, index) => <tr key={`${issue.path}-${index}`}><th scope="row" className="admin-cell-text">{issue.title}</th><td><span className="admin-status">{issue.severity === "action" ? "Review needed" : "Suggestion"}</span></td><td className="admin-cell-text">{issue.reason}</td><td><Link href={issue.path} target="_blank" rel="noopener noreferrer">Review page<ArrowUpRight size={14}/></Link></td></tr>)}{!pagination.total && <tr><td colSpan={4} className="admin-table-empty">No review suggestions in this view.</td></tr>}</tbody></table></div><AdminPagination label="Review queue" {...pagination}/>
    <p>Checks refresh when this page reloads. Publishing match updates recalculates numeric answers. Written articles remain under editorial control; updating a date requires a real source review.</p>
  </section>;
}
