import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/login";
import { configured, isAdmin } from "@/lib/admin/auth";
import { adminHome } from "@/lib/admin/navigation";
export const metadata: Metadata = { title: "Sign in" };
export default async function AdminLoginPage() {
  if (await isAdmin()) redirect(adminHome);
  return <AdminLogin configured={configured()}/>;
}
