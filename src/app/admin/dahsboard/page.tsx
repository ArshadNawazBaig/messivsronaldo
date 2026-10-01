import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin/login";
import { AdminOverview } from "@/components/admin/overview";
import { configured, isAdmin } from "@/lib/admin/auth";
import { getAdminState } from "@/lib/admin/service";
import { getAdminSummary } from "@/lib/admin/overview";
import { getPublishedData } from "@/lib/server-data";
export const metadata: Metadata = { title: "Admin dashboard" };
export default async function DashboardPage() {
  if (!await isAdmin()) return <AdminLogin configured={configured()}/>;
  const [state,summary,data] = await Promise.all([getAdminState(),getAdminSummary(),getPublishedData()]);
  return <AdminOverview state={state} summary={summary} data={data}/>;
}
