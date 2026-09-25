import { DataProvider } from '@/components/data-provider';
import { getPublishedData } from '@/lib/server-data';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ThemeInitializer } from '@/components/theme-initializer';
import './globals.css';
import './editorial.css';
import { SiteShell } from '@/components/site-shell';
import { indexable, jsonLd, siteName, siteUrl } from '@/lib/site';
import { getI18n } from '@/lib/i18n/server';
import { I18nProvider } from '@/components/i18n-provider';
import { AdminExportProvider } from '@/components/admin-stat-export';
import { isAdmin } from '@/lib/admin/auth';
import { Analytics } from '@vercel/analytics/react';

const inter = localFont({
  src: '../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
});
const display = localFont({
  src: '../../node_modules/@fontsource-variable/roboto-condensed/files/roboto-condensed-latin-wght-normal.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '100 900',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Messi vs Ronaldo: Goals, Stats & Perspective | The Rivalry',
    template: '%s | The Rivalry',
  },
  description:
    'Explore Messi vs Ronaldo with sourced statistics updated in 2026, interactive comparisons and clear definitions. Career goals, assists, World Cup, club records and trophies.',
  robots: {
    index: indexable,
    follow: true,
    googleBot: {
      index: indexable,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
  applicationName: siteName,
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, messages, t } = await getI18n();
  const admin = await isAdmin();
  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <ThemeInitializer />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              name: siteName,
              alternateName: 'Messi vs Ronaldo 17',
              publisher: {
                '@type': 'Organization',
                '@id': `${siteUrl}/#publisher`,
                name: siteName,
                url: siteUrl,
                logo: `${siteUrl}/icon.svg`,
              },
              url: siteUrl,
              description: t(
                'An independent, source-transparent Messi and Ronaldo comparison publication.',
              ),
              inLanguage: locale,
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${display.variable}`}>
        <I18nProvider locale={locale} messages={messages}>
          <DataProvider value={await getPublishedData()}>
            <AdminExportProvider admin={admin}>
              <SiteShell>{children}</SiteShell>
            </AdminExportProvider>
          </DataProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
