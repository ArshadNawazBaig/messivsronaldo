import Link from "@/components/localized-link";
import { getI18n } from "@/lib/i18n/server";
export async function EditorialResponsibility() {
  const { t } = await getI18n();
  return <section id="editorial-responsibility" className="prose panel">
    <h2>{t("Editorial responsibility")}</h2>
    <p>{t("The Rivalry publishes under its publication name. Editorial responsibility covers the comparison definitions, source references, explanations and corrections on this website.")}</p>
    <h3>{t("How the publication works")}</h3>
    <p>{t("The site combines a sourced statistical baseline with match updates. Calculations use the displayed counting rules. Provider imports and publishing tools assist this process; a published total is not a claim that every underlying match event has been independently verified.")}</p>
    <p>{t("Automated checks compare totals and detect inconsistent records. They cannot establish whether a source is correct. Readers can inspect the methodology, compare the linked evidence and submit a correction for editorial review.")}</p>
    <h3>{t("Corrections and accountability")}</h3>
    <p>{t("Reports reach a private support inbox. Accepted statistical corrections should include the reason and supporting source in the revision history. A report being received does not mean its proposed change has been accepted.")}</p>
    <p><Link href="/methodology">{t("Sources & methodology")}</Link> · <Link href="/updates">{t("Published updates")}</Link> · <Link href="/contact">{t("Contact and corrections")}</Link></p>
  </section>;
}
