import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import DocumentLayout from "@/components/document-layout";

export { metadata } from "@/components/document-layout";
export const revalidate = 86400;
// Build each localized page on its first visit, then reuse it until publication
// invalidates its data tags. Avoid shipping hundreds of duplicate HTML files.
export function generateStaticParams() { return []; }

export default async function LanguageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <DocumentLayout locale={locale}>{children}</DocumentLayout>;
}
