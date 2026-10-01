/* eslint-disable @next/next/no-head-element -- Shared document for the public and admin root layouts. */
import { getArticleNavigation, getArticleLanguages } from '@/lib/blog/server';
import { DataProvider } from '@/components/data-provider';
import { getPublishedData } from '@/lib/server-data';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ThemeInitializer } from '@/components/theme-initializer';
import '@/app/globals.css';
import '@/app/editorial.css';
import '@/app/public-layout.css';
import { SiteShell } from '@/components/site-shell';
import { indexable, jsonLd, publisherOrganization, siteName, siteUrl } from '@/lib/site';
import { getLocaleI18n } from '@/lib/i18n/server';
import type { Locale } from '@/lib/i18n/config';
import { I18nProvider } from '@/components/i18n-provider';
import { AdminExportProvider } from '@/components/admin-stat-export';
import { PublicAnalytics } from '@/components/public-analytics';
import { publisherConfiguration } from '@/lib/publisher-config';
import { socialImageAlt, socialImagePath } from '@/lib/social-image';

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

const publisher = publisherConfiguration(process.env);
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
  ...(publisher.adsensePublisherId && { other: { 'google-adsense-account': `ca-${publisher.adsensePublisherId}` } }),
  applicationName: siteName,
  openGraph: {
    images: [{ url: socialImagePath, width: 1200, height: 630, type: 'image/png', alt: socialImageAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: socialImagePath, alt: socialImageAlt }],
  },
};

export default async function DocumentLayout({
  children, locale, admin,
}: Readonly<{ children: React.ReactNode; locale: Locale; admin?: boolean }>) {
  const { messages, t } = await getLocaleI18n(locale);
  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <ThemeInitializer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              name: siteName,
              alternateName: 'Messi vs Ronaldo 17',
              publisher: publisherOrganization,
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
              <SiteShell articleLinks={(await getArticleNavigation(locale)).map(article => ({ href: `/insights/${article.slug}`, label: article.managed ? article.title : t(article.title) }))} articleLanguages={await getArticleLanguages()}>{children}</SiteShell>
            </AdminExportProvider>
          </DataProvider>
        </I18nProvider>
        {publisher.analyticsEnabled && admin === undefined && <PublicAnalytics />}
      </body>
    </html>
  );
}
