import DocumentLayout from "@/components/document-layout";
import { isAdmin } from "@/lib/admin/auth";

export { metadata } from "@/components/document-layout";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DocumentLayout locale="en" admin={await isAdmin()}>{children}</DocumentLayout>;
}
