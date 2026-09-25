"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { useI18n } from "./i18n-provider";
import styles from "./interactive-tools.module.css";

export function ToolShare({ hash }: { hash: string }) {
  const { t } = useI18n();
  const [share, setShare] = useState({ url: "", message: "" });
  async function copy() {
    const url = new URL(window.location.href); url.hash = hash;
    setShare({ url: url.href, message: "Copy this link to share your settings." });
    try { await navigator.clipboard.writeText(url.href); setShare({ url: url.href, message: "Comparison link copied." }); } catch { /* Selectable link is the fallback. */ }
  }
  return <div className={styles.share}><button className="text-link" type="button" onClick={copy}><Share2 size={14}/>{t("Share comparison")}</button>{share.url && <><p role="status">{t(share.message)}</p><input value={share.url} readOnly aria-label={t("Comparison link")} onFocus={event => event.currentTarget.select()}/></>}</div>;
}
