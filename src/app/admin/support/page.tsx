import type { Metadata } from "next";
import { configured, isAdmin } from "@/lib/admin/auth";
import { AdminLogin } from "@/components/admin/login";
import { SupportManager } from "@/components/admin/support-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Support inbox", robots: { index: false, follow: false }, alternates: { canonical: "/admin/support", languages: {} } };
export default async function SupportPage() {
  if (!await isAdmin()) return <AdminLogin configured={configured()}/>;
  return <SupportManager/>;
}
