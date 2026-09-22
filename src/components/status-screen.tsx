"use client";
import { localizedPath } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n-provider";
// Native navigation recovers when the router or root layout has failed.
import { ArrowRight, RotateCcw } from "lucide-react";
import { statusStyles } from "@/lib/status-styles";
export function StatusScreen({ notFound = false, onRetry }: {
    notFound?: boolean;
    onRetry?: () => void;
}) {
    const { t, locale } = useI18n();
    return <section className="rivalry-status" aria-labelledby="status-title">
    <style>{statusStyles}</style>
    <div className="rivalry-status-layout">
      <div><span className="rivalry-status-kicker">{t(notFound ? "404 / PAGE NOT FOUND" : "SOMETHING WENT WRONG")}</span>
        <h1 id="status-title">{t(notFound ? "A little wide of the mark." : "A pause in play.")}</h1>
        <p>{t(notFound ? "We couldn’t find that page. The link may have changed, or there may be a typo in the address. There’s plenty of football to explore from here." : "We couldn’t load this page. Try again, or return to the overview and pick up where you left off.")}</p>
        <div className="rivalry-status-actions">
          {onRetry && <button onClick={onRetry}><RotateCcw size={16} aria-hidden="true"/>{t("Try again")}</button>}
          {/* Full navigation can also recover from a client router error. */}
          <a className={onRetry ? "rivalry-status-secondary" : undefined} href={localizedPath("/", locale)}>{t("Back to the overview")}<ArrowRight size={16} aria-hidden="true"/></a>
        </div>
      </div>
      <div className="rivalry-status-pitch" aria-hidden="true"><span>{t(notFound ? "404" : "500")}</span></div>
    </div>
    <nav className="rivalry-status-links" aria-label={t("Explore the website")}><span>{t("Continue exploring")}</span><a href={localizedPath("/compare", locale)}>{t("Compare the careers")}</a><a href={localizedPath("/seasons", locale)}>{t("Years & seasons")}</a><a href={localizedPath("/sitemap", locale)}>{t("Site map")}</a></nav>
  </section>;
}
