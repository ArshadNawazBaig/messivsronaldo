"use client";
import { useI18n } from "@/components/i18n-provider";
import Link from "@/components/localized-link";
import { useState } from "react";
import { Check, Send } from "lucide-react";
import { supportCategories } from "@/lib/support/model";
import { Select } from "@/components/ui/select";

const categoryOptions = Object.entries(supportCategories).map(([value, label]) => ({ value, label }));

export function CorrectionForm() {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [category, setCategory] = useState("correction");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true); setError(""); setReference("");
    try {
      const response = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, locale }) });
      const result = await response.json();
      if (!response.ok) throw new Error(response.status === 429 ? "Too many reports. Please try again later." : "The report could not be saved. Please try again.");
      setReference(result.id); form.reset(); setCategory("correction");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The report could not be saved. Please try again."); }
    finally { setBusy(false); }
  }
  return <form className="correction-form panel" onSubmit={submit} aria-busy={busy}>
    <div className="correction-field"><label htmlFor="support-category">{t("What is your message about?")}</label><Select id="support-category" name="category" label="What is your message about?" disabled={busy} value={category} onValueChange={setCategory} options={categoryOptions}/></div>
    <label htmlFor="support-name">{t("Name (optional)")}<input id="support-name" name="name" autoComplete="name" maxLength={100} disabled={busy}/></label>
    <label htmlFor="support-email">{t("Email for a reply (optional)")}<input id="support-email" name="email" type="email" autoComplete="email" maxLength={254} disabled={busy}/><span>{t("Without an email address, we can review your report but cannot reply to you.")}</span></label>
    <label htmlFor="correction-page">{t("Page or comparison (optional)")}<input id="correction-page" name="page" placeholder={t("For example, Champions League")} maxLength={300} disabled={busy}/></label>
    <label htmlFor="correction-source">{t("Supporting source URL (optional)")}<input type="url" id="correction-source" name="source" placeholder="https://…" maxLength={1000} disabled={busy}/></label>
    <label htmlFor="correction-details">{t("What should we look at?")}<textarea id="correction-details" name="details" required minLength={15} maxLength={4000} rows={5} disabled={busy} placeholder={t("Describe the issue and include any useful evidence. Do not include passwords or sensitive personal information.")}/></label>
    <div hidden aria-hidden="true"><label htmlFor="support-website">Website<input id="support-website" name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <p className="form-note">{t("Submitting sends your report to our private support inbox. Reports are available for up to 90 days.")} <Link href="/privacy#contact-and-corrections">{t("Read the privacy policy")}</Link></p>
    <button className="primary-button" type="submit" disabled={busy}><Send size={16}/>{t(busy ? "Sending…" : "Submit report")}</button>
    {error && <p role="alert">{t(error)}</p>}
    {reference && <div className="form-success" role="status"><Check size={18}/><div><strong>{t("Your report has been received.")}</strong><p>{t("Save this reference for any follow-up:")} <code>{reference}</code></p><p>{t("Replies are not automatic. If you supplied an email address, the publisher can contact you there.")}</p></div></div>}
    <noscript>{t("Please enable JavaScript to submit a support report.")}</noscript>
  </form>;
}
