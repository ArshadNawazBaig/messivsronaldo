import { DataProvider } from "@/components/data-provider";
import { getPublishedData } from "@/lib/server-data";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteShell } from "@/components/site-shell";
import { indexable, jsonLd, siteName, siteUrl } from "@/lib/site";

const inter = localFont({ src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", variable: "--font-inter", display: "swap", weight: "100 900" });
const manrope = localFont({ src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2", variable: "--font-manrope", display: "swap", weight: "200 800" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Messi vs Ronaldo: Goals, Stats & Perspective | The Rivalry", template: "%s | The Rivalry" },
  description: "Explore Messi vs Ronaldo with sourced statistics updated in 2026, interactive comparisons and clear definitions. Career goals, assists, World Cup, club records and trophies.",
  robots: { index: indexable, follow: true, googleBot: { index: indexable, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
  applicationName: siteName,
};

const themeScript = `(function(){try{var theme=localStorage.getItem('rivalry-theme');if(theme==='light')document.documentElement.dataset.theme='light';}catch(e){}})();`;

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "WebSite", name: siteName, url: siteUrl, description: "An independent, source-transparent Messi and Ronaldo comparison publication.", inLanguage: "en" }) }} /></head><body className={`${inter.variable} ${manrope.variable}`}><DataProvider value={getPublishedData()}><SiteShell>{children}</SiteShell></DataProvider></body></html>;
}
