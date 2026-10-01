import { publisherConfiguration } from "@/lib/publisher-config";
import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { ArrowUpRight } from "lucide-react";
import { policyUpdated, policyUpdatedLabel, type Policy } from "@/lib/policies";
export async function PolicyContent({ policy }: {
    policy: Policy;
}) {
    const { t, locale } = await getI18n();
    const { contactEmail } = publisherConfiguration(process.env);
    return <div className="policy-layout">
    <aside className="policy-index">
      <span className="section-kicker">{t("ON THIS PAGE")}</span>
      <nav aria-label={t("On this page")}><ol>{policy.sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{t(section.title)}</a></li>)}</ol></nav>
      <p>{t("Last updated")}<br /><time dateTime={policyUpdated}>{t(policyUpdatedLabel)}</time></p>
    </aside>
    <article className="policy-body">
      {policy.sections.map((section, index) => <section key={section.id} id={section.id} className="policy-section">
        <span className="section-kicker" aria-hidden="true">{t(String(index + 1).padStart(2, "0"))}</span>
        <h2>{t(section.title)}</h2>
        {section.paragraphs.map(paragraph => <p key={paragraph} lang={locale !== "en" && t(paragraph) === paragraph ? "en" : undefined}>{t(paragraph)}</p>)}
        {section.links && <div className="policy-related">{section.links.map(link => <Link key={link.href} href={link.href}>{t(link.label)}<ArrowUpRight size={15} aria-hidden="true"/></Link>)}</div>}
      </section>)}
      <div className="policy-contact"><h2>{t("Questions about this page?")}</h2>{contactEmail ? <p>{t("Email ")}<a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p> : <p>{t("See our ")}<Link href="/contact">{t("contact and correction options")}</Link>.</p>}</div>
    </article>
  </div>;
}
