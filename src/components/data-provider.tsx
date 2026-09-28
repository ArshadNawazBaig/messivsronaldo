"use client";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { type PublishedData } from "@/lib/published-data";
const Context = createContext<PublishedData | null>(null);
export function DataProvider({value,children}:{value:PublishedData;children:ReactNode}) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    let pending = false;
    let disposed = false;
    let refreshingAt = 0;
    const controller = new AbortController();
    async function checkVersion() {
      if (document.visibilityState === "hidden" || pending || Date.now() - refreshingAt < 15_000) return;
      pending = true;
      try {
        const response = await fetch("/api/data-version", {cache:"no-store",signal:AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)])});
        if (!response.ok) return;
        const data = await response.json();
        if (!disposed && typeof data.version === "string" && data.version !== value.datasetVersion) {
          refreshingAt = Date.now();
          // Refresh server content and context together; retain selected filters.
          router.refresh();
        }
      } catch { /* Keep the last published data during a connection failure. */ }
      finally { pending = false; }
    }
    void checkVersion();
    const interval = window.setInterval(checkVersion, 60_000);
    window.addEventListener("focus", checkVersion);
    window.addEventListener("pageshow", checkVersion);
    document.addEventListener("visibilitychange", checkVersion);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", checkVersion);
      window.removeEventListener("pageshow", checkVersion);
      document.removeEventListener("visibilitychange", checkVersion);
    };
  }, [value.datasetVersion, pathname, router]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useFootballData() { const value = useContext(Context); if (!value) throw new Error("Football data provider is missing"); return value; }
