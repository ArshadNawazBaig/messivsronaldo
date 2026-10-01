"use client";
import { defaultAdminPageSize } from "@/lib/admin/pagination";
import { useEffect, useState } from "react";
import type { RunRecord } from "@/lib/admin/model";
import { AdminPagination, useTablePagination } from "./pagination";

const actionLabels: Record<string, string> = { latest: "Recent match update", daily: "Automatic daily update", sync: "Match sync", manual: "Manual correction", check: "Date checked", undo: "Publication restored", connection: "Provider connection", remove: "Record removed" };
export function ActivityRowsTable({ rows, label = "Activity records" }: { rows: RunRecord[]; label?: string }) {
  return <div className="admin-table-wrap" role="region" aria-label={label} tabIndex={0}><table className="admin-table"><caption className="sr-only">{label}</caption><thead><tr><th scope="col">Recorded (UTC)</th><th scope="col">Action</th><th scope="col">Result</th><th scope="col">Match date</th><th scope="col">Details</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><time dateTime={row.at}>{new Date(row.at).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })}</time></td><th scope="row">{actionLabels[row.action] ?? row.action}<small>#{row.id}</small></th><td><span className={`admin-status ${row.status === "failed" ? "failed" : ""}`}>{row.status}</span></td><td>{row.date}</td><td className="admin-cell-text">{row.message.length > 180 ? <details className="admin-cell-details"><summary><span className="admin-cell-preview">{row.message}</span><span className="admin-cell-expand">Read full details</span><span className="admin-cell-collapse">Collapse details</span></summary><p>{row.message}</p></details> : row.message}</td></tr>)}{!rows.length && <tr><td colSpan={5} className="admin-table-empty">No activity matches this view.</td></tr>}</tbody></table></div>;
}

export function RecentActivityTable({ rows }: { rows: RunRecord[] }) {
  const pagination = useTablePagination(rows);
  return <><ActivityRowsTable rows={pagination.rows} label="Recent activity"/><AdminPagination label="Recent activity" {...pagination}/></>;
}

export function ActivityTable({ revision }: { revision: number }) {
  const [page, setPage] = useState(0); const [pageSize, setPageSize] = useState(defaultAdminPageSize);
  const [query, setQuery] = useState(""); const [search, setSearch] = useState("");
  const [data, setData] = useState<{ rows: RunRecord[]; total: number; page: number }>({ rows: [], total: 0, page: 0 });
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/activity?${new URLSearchParams({ page: String(page), pageSize: String(pageSize), query: search })}`, { cache: "no-store" }).then(async response => {
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Activity could not be loaded.");
      if (active) { setData(result); setError(""); }
    }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, pageSize, search, revision, reload]);
  return <div className="admin-table-panel"><form className="admin-table-tools" onSubmit={event => { event.preventDefault(); setPage(0); setSearch(query.trim()); setLoading(true); setReload(value => value + 1); }}><label className="admin-field">Search activity<input type="search" maxLength={200} value={query} onChange={event => setQuery(event.target.value)} placeholder="Action, status, match date or message…"/></label><button className="admin-button" disabled={loading}>Search</button></form>
    {error ? <div role="alert"><p className="admin-message error">{error}</p><button className="admin-button" onClick={() => { setLoading(true); setReload(value => value + 1); }}>Retry</button></div> : <div aria-busy={loading}>{loading ? <p className="admin-help">Loading activity…</p> : <ActivityRowsTable rows={data.rows}/>}</div>}
    <AdminPagination label="Activity" total={data.total} page={data.page} pageSize={pageSize} disabled={loading || !!error} onPageChange={next => { setPage(next); setLoading(true); }} onPageSizeChange={size => { setPageSize(size); setPage(0); setLoading(true); }}/>
  </div>;
}
