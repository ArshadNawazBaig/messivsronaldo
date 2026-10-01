import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin/dashboard";
import { AdminLogin } from "@/components/admin/login";
import { adminEmail, configured, isAdmin } from "@/lib/admin/auth";
import { adminSections, isAdminSection } from "@/lib/admin/navigation";
import { getAdminState } from "@/lib/admin/service";
import { getPublishedData } from "@/lib/server-data";
import { getPublishedArticles } from "@/lib/blog/server";
import { contentReview } from "@/lib/content-review";
export async function generateMetadata({ params }: { params: Promise<{section: string}> }) {
  const { section } = await params;
  return { title: isAdminSection(section) ? adminSections[section].title : "Administration" };
}
export default async function AdminSectionPage({ params, searchParams }: { params: Promise<{section: string}>; searchParams: Promise<{player?: string}> }) {
  const { section } = await params;
  if (!isAdminSection(section)) notFound();
  if (!await isAdmin()) return <AdminLogin configured={configured()}/>;
  const { player } = await searchParams;
  const initial = await getAdminState();
  const report = section === "review" ? contentReview(await getPublishedData(), new Date().toISOString().slice(0,10), await getPublishedArticles("en")) : undefined;
  return <AdminDashboard key={`${section}:${player ?? "all"}`} initial={initial} section={section} playerFilter={player === "messi" || player === "ronaldo" ? player : "all"} contentReview={report} email={adminEmail()}/>;
}
