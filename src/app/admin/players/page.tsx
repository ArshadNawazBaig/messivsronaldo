import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { AdminLogin } from "@/components/admin/login";
import { PlayerCards } from "@/components/admin/overview";
import { configured, isAdmin } from "@/lib/admin/auth";
import { getPublishedData } from "@/lib/server-data";
import styles from "@/components/admin/workspace.module.css";
export const metadata: Metadata = { title: "Players" };
export default async function PlayersAdminPage() {
  if (!await isAdmin()) return <AdminLogin configured={configured()}/>;
  const data = await getPublishedData();
  return <div><div className={styles.heading}><div><h1>Players</h1><p>Manage the records behind each player’s published statistics.</p></div><span className={styles.pill}>2 tracked players</span></div><PlayerCards data={data}/><div className={styles.note}><ShieldCheck size={18}/><p>Career totals are calculated from the reviewed baseline and verified match entries. Open a player’s records to correct an entry, or add a match to update goals, assists, appearances, minutes and supported scoring details across the website. Historical baseline totals remain protected from duplicate entry.</p></div></div>;
}
