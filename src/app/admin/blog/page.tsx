import type { Metadata } from "next";
import { configured, isAdmin } from "@/lib/admin/auth";
import { AdminLogin } from "@/components/admin/dashboard";
import BlogManager from "@/components/admin/blog-manager";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog editor", robots: { index: false, follow: false }, alternates: { canonical: "/admin/blog", languages: {} } };
export default async function BlogAdminPage() {
  if (!await isAdmin()) return <AdminLogin configured={configured()}/>;
  return <BlogManager/>;
}
