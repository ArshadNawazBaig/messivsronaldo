import { getI18n } from "@/lib/i18n/server";
import { EditorialCards } from "@/components/editorial";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata() { return pageMetadata("The Reading Room — Football Stats Explained", "Understand assist definitions, scoring rates and career-goal counting rules with original Messi and Ronaldo comparison guides.", "/insights"); }
export default async function InsightsPage() { const { t } = await getI18n(); return <div className="page-container inner-page"><div className="page-intro inner-intro"><div><span className="eyebrow"><span className="tiny-dot"/>{t("THE READING ROOM")}</span><h1>{t("The reading room.")}</h1><p>{t("Explanations of scoring rates, assist definitions and the rules behind career totals.")}</p></div></div><EditorialCards /></div>; }
