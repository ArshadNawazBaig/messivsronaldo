import type { Metadata } from "next";
import { configured, isAdmin } from "@/lib/admin/auth";
import { getAdminState } from "@/lib/admin/service";
import { AdminDashboard, AdminLogin } from "@/components/admin/dashboard";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {title:"Admin dashboard",robots:{index:false,follow:false},alternates:{canonical:"/admin"}};
export default async function AdminPage() {
  if (!await isAdmin()) return <AdminLogin configured={configured()} />;
  return <AdminDashboard initial={getAdminState()} />;
}
