"use client";

import Script from "next/script";

export function PublicAdSense({ publisherId, adsEnabled }: { publisherId: string; adsEnabled: boolean }) {
  if (!/^pub-\d{16}$/.test(publisherId)) return null;
  return <>
    <script id="rivalry-adsense-state" dangerouslySetInnerHTML={{ __html: `(window.adsbygoogle=window.adsbygoogle||[]).pauseAdRequests=${adsEnabled ? 0 : 1};` }}/>
    <Script id="rivalry-adsense" strategy="lazyOnload" async crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${publisherId}`}
      // The pause is initialized in the document head before any ad code runs.
      // Wait for page load and browser idle time so Google does not compete
      // with the portraits and hydration. Next deduplicates public navigation.
    />
  </>;
}
