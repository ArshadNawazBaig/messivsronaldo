import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { policyUpdated, policyUpdatedLabel, type Policy } from "@/lib/policies";

export function PolicyContent({ policy }: { policy: Policy }) {
  return <div className="policy-layout">
    <aside className="policy-index">
      <span className="section-kicker">ON THIS PAGE</span>
      <nav aria-label="On this page"><ol>{policy.sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></nav>
      <p>Last updated<br /><time dateTime={policyUpdated}>{policyUpdatedLabel}</time></p>
    </aside>
    <article className="policy-body">
      {policy.sections.map((section, index) => <section key={section.id} id={section.id} className="policy-section">
        <span className="section-kicker" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <h2>{section.title}</h2>
        {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        {section.links && <div className="policy-related">{section.links.map(link => <Link key={link.href} href={link.href}>{link.label}<ArrowUpRight size={15} aria-hidden="true" /></Link>)}</div>}
      </section>)}
      <div className="policy-contact"><h2>Questions about this page?</h2>{process.env.CONTACT_EMAIL ? <p>Email <a href={`mailto:${process.env.CONTACT_EMAIL}`}>{process.env.CONTACT_EMAIL}</a>.</p> : <p>See our <Link href="/contact">contact and correction options</Link>.</p>}</div>
    </article>
  </div>;
}
