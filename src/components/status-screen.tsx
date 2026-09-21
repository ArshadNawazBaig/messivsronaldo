"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Native navigation recovers when the router or root layout has failed. */

import { ArrowRight, RotateCcw } from "lucide-react";
import { statusStyles } from "@/lib/status-styles";

export function StatusScreen({ notFound = false, onRetry }: { notFound?: boolean; onRetry?: () => void }) {
  return <section className="rivalry-status" aria-labelledby="status-title">
    <style>{statusStyles}</style>
    <div className="rivalry-status-layout">
      <div><span className="rivalry-status-kicker">{notFound ? "404 / PAGE NOT FOUND" : "SOMETHING WENT WRONG"}</span>
        <h1 id="status-title">{notFound ? "A little wide of the mark." : "A pause in play."}</h1>
        <p>{notFound ? "We couldn’t find that page. The link may have changed, or there may be a typo in the address. There’s plenty of football to explore from here." : "We couldn’t load this page. Try again, or return to the overview and pick up where you left off."}</p>
        <div className="rivalry-status-actions">
          {onRetry && <button onClick={onRetry}><RotateCcw size={16} aria-hidden="true" />Try again</button>}
          {/* Full navigation can also recover from a client router error. */}
          <a className={onRetry ? "rivalry-status-secondary" : undefined} href="/">Back to the overview<ArrowRight size={16} aria-hidden="true" /></a>
        </div>
      </div>
      <div className="rivalry-status-pitch" aria-hidden="true"><span>{notFound ? "404" : "500"}</span></div>
    </div>
    <nav className="rivalry-status-links" aria-label="Explore the website"><span>Continue exploring</span><a href="/compare">Compare the careers</a><a href="/seasons">Years & seasons</a><a href="/sitemap">Site map</a></nav>
  </section>;
}
