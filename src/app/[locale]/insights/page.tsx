import { getI18n } from "@/lib/i18n/server";
import { EditorialCards } from "@/components/editorial";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata() { return pageMetadata("The Reading Room — Football Stats Explained", "Explore Messi and Ronaldo peak years, league seasons and Champions League campaigns with interactive calculators and sourced scoring guides.", "/insights"); }
export default async function InsightsPage() { const { t } = await getI18n(); return <div className="page-container inner-page"><div className="page-intro inner-intro"><div><span className="eyebrow"><span className="tiny-dot"/>{t("THE READING ROOM")}</span><h1>{t("The reading room.")}</h1><p>{t("Explore peak seasons, test scoring rates, and understand the rules behind the records.")}</p></div></div><EditorialCards /></div>; }
