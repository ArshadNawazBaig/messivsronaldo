"use client";
import { AdminPageHeader } from "./page-header";
import { defaultAdminPageSize } from "@/lib/admin/pagination";
import { Select } from "@/components/ui/select";
import { AdminPagination } from "./pagination";
import { useEffect, useState } from "react";
import { supportCategories, supportStatuses, type SupportTicket } from "@/lib/support/model";
import styles from "./support.module.css";

export function SupportManager() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState("all"); const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0); const [resultOffset, setResultOffset] = useState(0); const [pageSize, setPageSize] = useState(defaultAdminPageSize);
  const [selected, setSelected] = useState<SupportTicket | null>(null); const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/support?status=${filter}&offset=${offset}&pageSize=${pageSize}`, { cache: "no-store" }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Reports could not be loaded.");
      if (active) { setTickets(data.tickets); setTotal(data.total); setResultOffset(data.offset); }
    }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter, offset, pageSize, reload]);
  const refresh = () => { setError(""); setLoading(true); setReload(value => value + 1); };
  return <div className={`page-container admin-page ${styles.page}`}>

    <AdminPageHeader title="Support inbox" description="Review questions, corrections, privacy requests and image-rights reports submitted through Contact."/>

    <section className="panel admin-table-panel"><div className="admin-table-tools"><label className="admin-field">Show reports<Select label="Show reports" disabled={busy || loading} value={filter} onValueChange={value => { setFilter(value); setOffset(0); setLoading(true); setError(""); }} options={[{value:"all",label:"All reports"},...Object.entries(supportStatuses).map(([value,label])=>({value,label}))]}/></label><button className="admin-button" disabled={loading || busy} onClick={refresh}>Refresh inbox</button></div>
    {error && <p role="alert" className="admin-message error">{error}</p>}
    {loading ? <p role="status">Loading reports…</p> : !error && <div className="admin-table-wrap" role="region" aria-label="Support reports" tabIndex={0}><table className="admin-table"><caption className="sr-only">Support reports</caption><thead><tr><th scope="col">Submitted (UTC)</th><th scope="col">Category / sender</th><th scope="col">Status</th><th scope="col">Message</th><th scope="col">Manage</th></tr></thead><tbody>{tickets.map(ticket => <tr key={ticket.id} data-selected={selected?.id === ticket.id}><td><time dateTime={ticket.createdAt}>{ticket.createdAt.replace("T", " ").slice(0, 16)}</time></td><th scope="row">{supportCategories[ticket.category]}<small>{ticket.name || ticket.email || "Anonymous reader"}</small><small>{ticket.id}</small></th><td><span className="admin-status">{supportStatuses[ticket.status]}</span></td><td className="admin-cell-text"><span className={styles.excerpt}>{ticket.details}</span></td><td><button className="admin-button" disabled={busy} onClick={() => setSelected(ticket)} aria-label={`Review report ${ticket.id}`}>Review report</button></td></tr>)}{!tickets.length && <tr><td colSpan={5} className="admin-table-empty">No reports in this view.</td></tr>}</tbody></table></div>}
    <AdminPagination label="Support" total={total} page={Math.floor(resultOffset / pageSize)} pageSize={pageSize} disabled={loading || busy || !!error} onPageChange={page => { setOffset(page * pageSize); setLoading(true); }} onPageSizeChange={size => { setPageSize(size); setOffset(0); setLoading(true); }}/><div className="admin-table-note"><p className="admin-help">Reports expire 90 days after submission. Delete personal information sooner when it is no longer needed. Status changes and private notes do not send email. Check this inbox regularly; there are no automatic notifications.</p></div></section>
    {selected && <Ticket key={`${selected.id}:${selected.revision}`} ticket={selected} busy={busy} setBusy={setBusy} onSaved={ticket => { setSelected(ticket); refresh(); }} onClose={() => setSelected(null)}/>}

  </div>;
}

function Ticket({ ticket, busy, setBusy, onSaved, onClose }: { ticket: SupportTicket; busy: boolean; setBusy: (busy: boolean) => void; onSaved: (ticket: SupportTicket | null) => void; onClose: () => void }) {
  const [status, setStatus] = useState(ticket.status); const [notes, setNotes] = useState(ticket.notes);
  const [confirmDelete, setConfirmDelete] = useState(false); const [error, setError] = useState("");
  async function save(action: "update" | "delete") {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id: ticket.id, revision: ticket.revision, ...(action === "update" ? { status, notes } : {}) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "The report could not be updated.");
      onSaved(data.ticket);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The report could not be updated."); }
    finally { setBusy(false); }
  }
  return <article className={`panel ${styles.ticket}`}>
    <header><h2>{supportCategories[ticket.category]}</h2><div className="admin-row-actions"><span className="admin-status">{supportStatuses[ticket.status]}</span><button type="button" className="admin-button" disabled={busy} onClick={onClose}>Close report</button></div></header>
    <p><time dateTime={ticket.createdAt}>{ticket.createdAt.replace("T", " ").slice(0, 19)} UTC</time> · {ticket.locale}</p>
    <p>Reference: <code>{ticket.id}</code></p>
    <p>From: {ticket.name || "Name not supplied"}{ticket.email && <> · <a href={`mailto:${ticket.email}?subject=${encodeURIComponent(`The Rivalry: report ${ticket.id}`)}`}>{ticket.email}</a></>}</p>
    {ticket.page && <p>Page or comparison: {ticket.page}</p>}
    {ticket.source && <p>Submitted source: <a href={ticket.source} target="_blank" rel="noreferrer noopener">{ticket.source}</a></p>}
    <p className={styles.details} dir="auto">{ticket.details}</p>
    <form onSubmit={event => { event.preventDefault(); void save("update"); }}>
      <label className="admin-field">Status<Select label="Status" disabled={busy} value={status} onValueChange={value=>setStatus(value as SupportTicket["status"])} options={Object.entries(supportStatuses).map(([value,label])=>({value,label}))}/></label>
      <label className="admin-field">Private notes<textarea disabled={busy} value={notes} maxLength={4000} rows={3} onChange={event => setNotes(event.target.value)}/></label>
      <div className={styles.toolbar}><button className="admin-button primary" disabled={busy} type="submit">Save report</button><button className="admin-button" disabled={busy} type="button" onClick={() => setConfirmDelete(true)}>Delete report</button></div>
    </form>
    {confirmDelete && <div role="group" aria-label="Confirm deletion"><p>Permanently delete this report and its private notes?</p><button className="admin-button" disabled={busy} onClick={() => save("delete")}>Confirm deletion</button><button className="admin-button" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</button></div>}
    {error && <p role="alert">{error}</p>}
  </article>;
}
