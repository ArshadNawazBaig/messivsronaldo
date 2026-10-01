import type { Metadata } from "next";
import localFont from "next/font/local";
import { DataProvider } from "@/components/data-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { AdminExportProvider } from "@/components/admin-stat-export";
import { ThemeInitializer } from "@/components/theme-initializer";
import { AdminShell } from "@/components/admin/admin-shell";
import { adminEmail, isAdmin } from "@/lib/admin/auth";
import { getPublishedData } from "@/lib/server-data";
import { getLocaleI18n } from "@/lib/i18n/server";
import "@/app/globals.css";
import "@/app/editorial.css";
import "./admin.css";
const inter = localFont({ src: "../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", variable: "--font-inter", display: "swap", weight: "100 900" });
const display = localFont({ src: "../../../node_modules/@fontsource-variable/roboto-condensed/files/roboto-condensed-latin-wght-normal.woff2", variable: "--font-display", display: "swap", weight: "100 900" });
export const metadata: Metadata = { title: { default: "Administration | The Rivalry", template: "%s | The Rivalry Admin" }, robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  const { messages } = await getLocaleI18n("en");
  return <html lang="en" dir="ltr" data-theme="light" suppressHydrationWarning><head><ThemeInitializer/></head><body className={`admin-document ${inter.variable} ${display.variable}`}><I18nProvider locale="en" messages={messages}>{admin ? <DataProvider value={await getPublishedData()}><AdminExportProvider admin><AdminShell email={adminEmail()}>{children}</AdminShell></AdminExportProvider></DataProvider> : <main>{children}</main>}</I18nProvider></body></html>;
}
