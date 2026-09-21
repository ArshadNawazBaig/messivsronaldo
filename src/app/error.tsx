"use client";
import { StatusScreen } from "@/components/status-screen";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return <><title>Page unavailable | The Rivalry</title><meta name="robots" content="noindex, follow" /><StatusScreen onRetry={retry} /></>;
}
