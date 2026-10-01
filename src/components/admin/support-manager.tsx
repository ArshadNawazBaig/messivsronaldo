"use client";
import { Select } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supportCategories, supportStatuses, type SupportTicket } from "@/lib/support/model";
import styles from "./support.module.css";

export function SupportManager() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState("all"); const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false); const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/support?status=${filter}&offset=${offset}`, { cache: "no-store" }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Reports could not be loaded.");
      if (active) { setTickets(data.tickets); setHasMore(data.hasMore); }
    }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter, offset, reload]);
  const refresh = () => { setError(""); setLoading(true); setReload(value => value + 1); };
  return <div className={`page-container admin-page ${styles.page}`}>

    <header><h1>Support inbox</h1><p>Review questions, corrections, privacy requests and image-rights reports submitted through Contact.</p></header>
    <p className="admin-help">Reports expire 90 days after submission. Delete personal information sooner when it is no longer needed. Status changes and private notes do not send email. Check this inbox regularly; there are no automatic notifications.</p>
    <div className={styles.toolbar}><label className="admin-field">Show reports<Select label="Show reports" disabled={busy || loading} value={filter} onValueChange={value => { setFilter(value); setOffset(0); setLoading(true); setError(""); }} options={[{value:"all",label:"All reports"},...Object.entries(supportStatuses).map(([value,label])=>({value,label}))]}/></label><button className="admin-button" disabled={loading || busy} onClick={refresh}>Refresh inbox</button></div>
    {error && <p role="alert" className="admin-message error">{error}</p>}
    {loading ? <p role="status">Loading reports…</p> : !error && !tickets.length ? <p>No reports in this view.</p> : !error && <div className={styles.list}>{tickets.map(ticket => <Ticket key={`${ticket.id}:${ticket.revision}`} ticket={ticket} busy={busy} setBusy={setBusy} onSaved={refresh}/>)}</div>}
    <div className={styles.toolbar}><button className="admin-button" disabled={loading || busy || offset === 0} onClick={() => { setOffset(value => Math.max(0, value - 50)); setLoading(true); }}>Previous page</button><span>Page {Math.floor(offset / 50) + 1}</span><button className="admin-button" disabled={loading || busy || !hasMore} onClick={() => { setOffset(value => value + 50); setLoading(true); }}>Next page</button></div>
  </div>;
}

function Ticket({ ticket, busy, setBusy, onSaved }: { ticket: SupportTicket; busy: boolean; setBusy: (busy: boolean) => void; onSaved: () => void }) {
  const [status, setStatus] = useState(ticket.status); const [notes, setNotes] = useState(ticket.notes);
  const [confirmDelete, setConfirmDelete] = useState(false); const [error, setError] = useState("");
  async function save(action: "update" | "delete") {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id: ticket.id, revision: ticket.revision, ...(action === "update" ? { status, notes } : {}) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "The report could not be updated.");
      onSaved();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The report could not be updated."); }
    finally { setBusy(false); }
  }
  return <article className={`panel ${styles.ticket}`}>
    <header><h2>{supportCategories[ticket.category]}</h2><span className="admin-status">{supportStatuses[ticket.status]}</span></header>
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
