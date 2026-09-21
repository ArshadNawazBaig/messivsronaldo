"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- The root router/layout may be unavailable in this fallback. */
import { StatusScreen } from "@/components/status-screen";

// This replaces the root layout, so it cannot depend on the database or DataProvider.
export default function GlobalError({ retry }: { retry: () => void }) {
  return <html lang="en"><head><title>Page unavailable | The Rivalry</title><meta name="robots" content="noindex, follow" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
    <body className="rivalry-status-standalone"><header className="rivalry-status-header"><a href="/" aria-label="The Rivalry home"><svg viewBox="0 0 30 38" aria-hidden="true"><path fill="currentColor" d="M8 7h6L6 31H0zm9-7h6L11 38H5zm7 7h6l-8 24h-6z" /></svg>THE RIVALRY</a></header><main><StatusScreen onRetry={retry} /></main></body>
  </html>;
}
