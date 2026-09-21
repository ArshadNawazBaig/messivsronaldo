"use client";
import { useState } from "react";
import { Check, Download, Mail } from "lucide-react";

export function CorrectionForm({ email }: { email?: string }) {
  const [saved, setSaved] = useState(false);
  const [report, setReport] = useState("");
  function prepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = `THE RIVALRY — DATA CORRECTION\nPrepared: ${new Date().toISOString()}\n\nPage: ${data.get("page")}\nMetric: ${data.get("metric")}\nSupporting source: ${data.get("source")}\n\n${data.get("details")}\n\nThis report was prepared in the browser and has not been sent.\n`;
    setReport(text);
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a"); a.href = url; a.download = "the-rivalry-correction.txt"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSaved(true);
  }
  return <form className="correction-form panel" onSubmit={prepare}><label htmlFor="correction-page">Page or comparison<input id="correction-page" name="page" required placeholder="For example, Champions League" maxLength={300} /></label><label htmlFor="correction-metric">Statistic to review<input id="correction-metric" name="metric" required placeholder="For example, Ronaldo's assists" maxLength={200} /></label><label htmlFor="correction-source">Supporting source URL<input type="url" id="correction-source" name="source" required placeholder="https://…" maxLength={1000} /></label><label htmlFor="correction-details">What should we look at?<textarea id="correction-details" name="details" required minLength={15} maxLength={4000} rows={5} placeholder="Include the figure, the proposed correction and how the source supports it." /></label><button className="primary-button" type="submit"><Download size={16} />Prepare & download report</button><p className="form-note">Your report stays in your browser until you choose to share it. Downloading does not submit it.</p>{saved && <div className="form-success" role="status"><Check size={18} /><div><strong>Your report is ready.</strong><p>Keep the downloaded file and share it with the publisher.{email ? " You can also send it by email below." : " No report has been sent automatically."}</p>{email && <a href={`mailto:${email}?subject=${encodeURIComponent("The Rivalry: data correction")}&body=${encodeURIComponent(report)}`}><Mail size={15} />Open email with report</a>}</div></div>}</form>;
}
