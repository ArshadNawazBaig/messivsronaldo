"use client";
import { useI18n } from "@/components/i18n-provider";
import { useState } from "react";
import { Check, FileText, Mail } from "lucide-react";
export function CorrectionForm({ email }: {
    email?: string;
}) {
    const { t } = useI18n();
    const [saved, setSaved] = useState(false);
    const [report, setReport] = useState("");
    function prepare(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const text = `THE RIVALRY — DATA CORRECTION\nPrepared: ${new Date().toISOString()}\n\nPage: ${data.get("page")}\nMetric: ${data.get("metric")}\nSupporting source: ${data.get("source")}\n\n${data.get("details")}\n\nThis report was prepared in the browser and has not been sent.\n`;
        setReport(text);
        setSaved(true);
    }
    return <form className="correction-form panel" onSubmit={prepare} onChange={() => setSaved(false)}><label htmlFor="correction-page">{t("Page or comparison")}<input id="correction-page" name="page" required placeholder={t("For example, Champions League")} maxLength={300}/></label><label htmlFor="correction-metric">{t("Statistic to review")}<input id="correction-metric" name="metric" required placeholder={t("For example, Ronaldo's assists")} maxLength={200}/></label><label htmlFor="correction-source">{t("Supporting source URL")}<input type="url" id="correction-source" name="source" required placeholder={t("https://\u2026")} maxLength={1000}/></label><label htmlFor="correction-details">{t("What should we look at?")}<textarea id="correction-details" name="details" required minLength={15} maxLength={4000} rows={5} placeholder={t("Include the figure, the proposed correction and how the source supports it.")}/></label><button className="primary-button" type="submit"><FileText size={16}/>{t("Prepare report")}</button><p className="form-note">{t("Your report stays in your browser until you choose to share it. Preparing it does not submit it.")}</p>{saved && <><div className="form-success" role="status"><Check size={18}/><div><strong>{t("Your report is ready.")}</strong><p>{t("Review and copy the report below to share it with the publisher.{0}", { "0": t(email ? " You can also send it by email below." : " No report has been sent automatically.") })}</p>{email && <a href={`mailto:${email}?subject=${encodeURIComponent("The Rivalry: data correction")}&body=${encodeURIComponent(report)}`}><Mail size={15}/>{t("Open email with report")}</a>}</div></div><label htmlFor="prepared-report">{t("Prepared report")}<textarea id="prepared-report" readOnly value={report} rows={10} onFocus={event => event.currentTarget.select()}/></label></>}</form>;
}
