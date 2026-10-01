import { AdminPageHeader } from "./page-header";
import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, FileText, LifeBuoy, Plus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import type { AdminState } from "@/lib/admin/model";
import type { getAdminSummary } from "@/lib/admin/overview";
import type { PublishedData } from "@/lib/published-data";
import { players } from "@/lib/data";
import styles from "./workspace.module.css";
type Summary = Awaited<ReturnType<typeof getAdminSummary>>;
export function PlayerCards({ data }: {data: PublishedData}) {
  const career = data.scopes.career;
  return <div className={styles.players}>{(["messi", "ronaldo"] as const).map(id => <article className={styles.player} key={id}>
    <div className={styles.playerIdentity}><Image src={players[id].image} width={49} height={55} alt="" sizes="49px"/><div><h2>{players[id].name}</h2><p>{players[id].country} · {id === "messi" ? "Inter Miami" : "Al Nassr"}</p></div><Link href={`/players/${id}`} target="_blank" aria-label={`View ${players[id].short}'s public profile`}><ArrowUpRight size={17}/></Link></div>
    <dl className={styles.playerMetrics}>{[["Career goals",career.goals[id]],["Assists",career.metrics.find(metric => metric.id === "assists")!.values[id]],["Appearances",career.appearances[id]]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{Number(value).toLocaleString("en-GB")}</dd></div>)}</dl>
    <div className={styles.playerActions}><Link className="admin-button" href={`/admin/matches?player=${id}`}>Manage records<ArrowRight size={13}/></Link><Link className="admin-button" href={`/admin/statistics?player=${id}`}><Plus size={13}/> Add match</Link></div>
  </article>)}</div>;
}
export function AdminOverview({ state, summary, data }: {state: AdminState; summary: Summary; data: PublishedData}) {
  const metrics = [
    { label:"Published articles", value:summary.articles, note:`Across ${summary.languages} language editions`, icon:FileText, href:"/admin/blog" },
    { label:"Match records", value:state.records.length, note:`New records after ${state.baseline}`, icon:CalendarDays, href:"/admin/matches" },
    { label:"Drafts & changes", value:summary.drafts, note:"Saved privately, ready for your review", icon:FileText, href:"/admin/blog" },
    { label:"Open support reports", value:summary.support, note:"Reader reports awaiting resolution", icon:LifeBuoy, href:"/admin/support" },
  ];
  const quick = [
    {href:"/admin/blog",title:"Write your next story",description:"Open the editor and article library",icon:FileText},
    {href:"/admin/statistics",title:"Add match statistics",description:"Goals, assists and scoring details",icon:Plus},
    {href:"/admin/updates",title:"Check the latest matches",description:"Verify and publish provider updates",icon:RefreshCw},
  ];
  return <div className="page-container admin-page">
    <AdminPageHeader title="Admin dashboard" description="Welcome back. Here’s what’s happening with your publication." actions={<><Link className="admin-button" href="/admin/blog"><FileText size={15}/> Manage articles</Link><Link className="admin-button primary" href="/admin/statistics"><Plus size={15}/> Add match</Link></>}/>
    <div className={styles.metrics}>{metrics.map(({label,value,note,icon:Icon,href})=><Link className={styles.metric} href={href} key={label}><div className={styles.metricTop}>{label}<span><Icon size={16}/></span></div><strong>{value.toLocaleString("en-GB")}</strong><p>{note}</p></Link>)}</div>
    <div className={styles.overviewGrid}>
      <div className={styles.stack}><section className={styles.card}><div className={styles.cardHeading}><div><h2>Recent activity</h2><p>Updates and publications from your statistics ledger</p></div><Link href="/admin/activity">View log<ArrowUpRight size={13}/></Link></div>{state.history.length ? <ol className={styles.activity}>{state.history.slice(0,3).map(run=><li key={run.id}><span className={styles.activityIcon}>{run.status === "success" ? <Check size={15}/> : <Activity size={15}/>}</span><div><strong>{run.action === "manual" ? "Match record published" : run.action === "sync" ? "Match statistics synced" : run.action === "undo" ? "Publication restored" : run.action === "remove" ? "Match record removed" : "Data update"} · {run.status}</strong><p>{run.message}</p><time dateTime={run.at}>{new Date(run.at).toLocaleString("en-GB",{timeZone:"UTC",dateStyle:"medium",timeStyle:"short"})} UTC</time></div></li>)}</ol> : <div className={styles.empty}><Clock3 size={29}/><strong>Your next update starts here</strong><p>Publish a match or connect your provider. Each update will appear here with its result.</p><Link href="/admin/statistics" className="admin-button">Add your first record<ArrowRight size={13}/></Link></div>}</section>
      <section><div className={styles.cardHeading} style={{padding:"0 0 16px",border:0}}><div><h2>Player overview</h2><p>Published career totals · {data.snapshotLabel}</p></div><Link href="/admin/players">Players<Users size={14}/></Link></div><PlayerCards data={data}/></section></div>
      <div className={styles.stack}><section className={styles.card}><div className={styles.cardHeading}><h2>Quick actions</h2><span className={styles.pill}>Workspace</span></div><div className={styles.quickLinks}>{quick.map(({href,title,description,icon:Icon})=><Link key={href} href={href}><Icon size={17}/><span><strong>{title}</strong><small>{description}</small></span><ArrowUpRight size={15}/></Link>)}</div></section>
      <section className={styles.card}><div className={styles.cardHeading}><h2>Publication status</h2><ShieldCheck size={17}/></div><div className={styles.health}><div className={styles.healthRow}><span>Data provider</span><strong>{state.providerConnected ? "Connected" : "Not connected"}</strong></div><div className={styles.healthRow}><span>Daily schedule</span><strong>{state.automaticUpdates.scheduled && state.providerConnected ? "Scheduled" : "Setup required"}</strong></div><div className={styles.healthRow}><span>Statistics revision</span><strong>#{state.revision}</strong></div><div className={styles.healthRow}><span>Reviewed baseline</span><strong>{state.baseline}</strong></div><Link className="admin-back-link" href="/admin/settings">Manage settings<ArrowRight size={13}/></Link></div></section>
      <div className={styles.note}><ShieldCheck size={17}/><p>Verified records power every comparison. Manual corrections are preserved when the provider syncs.</p></div></div>
    </div>
  </div>;
}
