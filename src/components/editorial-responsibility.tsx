import Link from "@/components/localized-link";
import { getI18n } from "@/lib/i18n/server";
import { publisherConfiguration } from "@/lib/publisher-config";
import { jsonLd, siteUrl } from "@/lib/site";
export async function EditorialResponsibility() {
  const { t } = await getI18n();
  const { editor } = publisherConfiguration(process.env);
  const biography = editor && t(editor.biography);
  return <section id="editorial-responsibility" className="prose panel">
    <h2>{t("Editorial responsibility")}</h2>
    <p>{t("The Rivalry publishes under its publication name. Editorial responsibility covers the comparison definitions, source references, explanations and corrections on this website.")}</p>
    {editor && <section id="editor" data-editor-profile>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Person", "@id": `${siteUrl}/about#editor`, name: editor.name, description: editor.biography, url: `${siteUrl}/about#editor`, ...(editor.profileUrl && { sameAs: [editor.profileUrl] }) }) }} />
      <h3>{t("Editor")}: {editor.name}</h3>
      <p lang={biography === editor.biography ? "en" : undefined}>{biography}</p>
      {editor.profileUrl && <p><a href={editor.profileUrl} rel="me">{t("Editor’s public profile")}</a></p>}
      <p><Link href="/contact">{t("Contact the editor")}</Link></p>
    </section>}
    <h3>{t("How the publication works")}</h3>
    <p>{t("The site combines a sourced statistical baseline with match updates. Calculations use the displayed counting rules. Provider imports and publishing tools assist this process; a published total is not a claim that every underlying match event has been independently verified.")}</p>
    <p>{t("Automated checks compare totals and detect inconsistent records. They cannot establish whether a source is correct. Readers can inspect the methodology, compare the linked evidence and submit a correction for editorial review.")}</p>
    <h3>{t("Evidence and interpretation")}</h3>
    <p>{t("Statistical calculations are reproducible from the linked records. Tactical explanations are editorial interpretations, not access to a team’s private instructions. An article’s sources support its factual claims; an interpretation should explain its reasoning and limits.")}</p>
    <p>{t("We use software and AI assistance for drafting, translation and calculations. These tools do not supply independent evidence. Material factual claims need a traceable source, and readers can challenge both the claim and its interpretation through the correction form.")}</p>
    <h3>{t("Corrections and accountability")}</h3>
    <p>{t("Reports reach a private support inbox. Accepted statistical corrections should include the reason and supporting source in the revision history. A report being received does not mean its proposed change has been accepted.")}</p>
    <p><Link href="/methodology">{t("Sources & methodology")}</Link> · <Link href="/updates">{t("Published updates")}</Link> · <Link href="/contact">{t("Contact and corrections")}</Link></p>
  </section>;
}
