"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- The root router/layout may be unavailable in this fallback. */
import { StatusScreen } from "@/components/status-screen";
import Image from "next/image";

// This replaces the root layout, so it cannot depend on the database or DataProvider.
export default function GlobalError({ retry }: { retry: () => void }) {
  return <html lang="en"><head><title>Page unavailable | The Rivalry</title><meta name="robots" content="noindex, follow" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
    <body className="rivalry-status-standalone"><header className="rivalry-status-header"><a href="/" aria-label="The Rivalry home"><Image src="/images/brand/the-rivalry-mark.svg" width={38} height={38} alt="" unoptimized />THE RIVALRY</a></header><main><StatusScreen onRetry={retry} /></main></body>
  </html>;
}
