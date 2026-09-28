import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ClipboardList } from "lucide-react";
import type { contentReview } from "@/lib/content-review";
import styles from "./content-review.module.css";

// Rendered only behind the existing admin sign-in check.
export function ContentReview({ report }: { report: ReturnType<typeof contentReview> }) {
  const actions = report.issues.filter(issue => issue.severity === "action");
  return <section className={`panel ${styles.review}`} aria-labelledby="content-review-title">
    <span className="section-kicker">EDITORIAL OPERATIONS</span><h2 id="content-review-title">Content review</h2>
    <p>Automatic checks for references, related links, review dates and data coverage. These are editorial checks, not a search ranking score. Checked {report.today} (UTC).</p>
    <dl className={styles.summary}><div><dt>Public pages per language</dt><dd>{report.pageCount}</dd></div><div><dt>Articles checked</dt><dd>{report.articleCount}</dd></div><div><dt>Items to review</dt><dd>{actions.length}</dd></div></dl>
    <div className={styles.cutoffs}><p><strong>Core-stat cutoff</strong><time dateTime={report.coreCutoff}>{report.coreCutoff}</time></p><p><strong>Career scoring coverage</strong><span><time dateTime={report.goalTypeCutoff}>{report.goalTypeCutoff}</time>{report.goalTypeLatest !== report.goalTypeCutoff && <> – <time dateTime={report.goalTypeLatest}>{report.goalTypeLatest}</time></>}</span></p><Link href="/updates">Review match coverage <ArrowUpRight size={14}/></Link></div>
    {!actions.length && <p className={styles.status}><CheckCircle2 size={18}/> No urgent issues detected by these checks.</p>}
    <h3>Review queue</h3><ul className={styles.queue}>{report.issues.map((issue, index) => <li key={`${issue.path}-${index}`}><ClipboardList size={18}/><div><span>{issue.severity === "action" ? "Review needed" : "Editorial suggestion"}</span><Link href={issue.path}>{issue.title}<ArrowUpRight size={14}/></Link><p>{issue.reason}</p></div></li>)}</ul>
    {!report.issues.length && <p>No review suggestions at this time.</p>}
    <p>Checks refresh when this page reloads. Publishing match updates recalculates numeric answers. Written articles remain under editorial control; updating a date requires a real source review.</p>
  </section>;
}
