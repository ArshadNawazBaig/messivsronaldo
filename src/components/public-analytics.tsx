"use client";
import { Analytics } from "@vercel/analytics/next";
import { publicAnalyticsEvent } from "@/lib/analytics-privacy";
export function PublicAnalytics() { return <Analytics beforeSend={publicAnalyticsEvent}/>; }
