import type { BeforeSendEvent } from "@vercel/analytics/next";
export function publicAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url);
    if (/^\/(?:admin|api)(?:\/|$)/.test(url.pathname)) return null;
    url.search = ""; url.hash = "";
    return { ...event, url: url.href };
  } catch { return null; }
}
