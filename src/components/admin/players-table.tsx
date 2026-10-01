"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { players } from "@/lib/data";
import type { PublishedData } from "@/lib/published-data";
import { AdminPagination, useTablePagination } from "./pagination";

export function PlayersTable({ data }: { data: PublishedData }) {
  const [query, setQuery] = useState("");
  const ids = (["messi", "ronaldo"] as const).filter(id => `${players[id].name} ${players[id].country}`.toLowerCase().includes(query.trim().toLowerCase()));
  const pagination = useTablePagination(ids, query);
  const career = data.scopes.career;
  return <section className="panel admin-table-panel"><div className="admin-table-tools"><label className="admin-field">Search players<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Player or country…"/></label></div><div className="admin-table-wrap" role="region" aria-label="Player records" tabIndex={0}><table className="admin-table"><caption className="sr-only">Players</caption><thead><tr><th scope="col">Player</th><th scope="col">Current club</th><th scope="col">Goals</th><th scope="col">Assists</th><th scope="col">Appearances</th><th scope="col">Manage</th></tr></thead><tbody>{pagination.rows.map(id => <tr key={id}><th scope="row"><div className="admin-row-actions"><Image src={players[id].image} width={32} height={38} alt="" sizes="32px" style={{ objectFit: "cover", objectPosition: "top", borderRadius: 5 }}/><div><Link href={`/players/${id}`} target="_blank" rel="noopener noreferrer">{players[id].name}</Link><small>{players[id].country}</small></div></div></th><td>{id === "messi" ? "Inter Miami" : "Al Nassr"}</td><td>{career.goals[id].toLocaleString("en-GB")}</td><td>{Number(career.metrics.find(metric => metric.id === "assists")?.values[id] ?? 0).toLocaleString("en-GB")}</td><td>{career.appearances[id].toLocaleString("en-GB")}</td><td><div className="admin-row-actions"><Link className="admin-button" href={`/admin/matches?player=${id}`}>Manage records<ArrowRight size={13}/></Link><Link className="admin-button" href={`/admin/statistics?player=${id}`}><Plus size={13}/> Add match</Link></div></td></tr>)}{!pagination.total && <tr><td colSpan={6} className="admin-table-empty">No players match this search.</td></tr>}</tbody></table></div><AdminPagination label="Players" {...pagination}/></section>;
}
