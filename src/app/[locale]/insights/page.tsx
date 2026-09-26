import { getI18n } from "@/lib/i18n/server";
import { EditorialCards } from "@/components/editorial";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata() { return pageMetadata("Football analysis: Ballon d’Or, records & stats", "Explore Ballon d’Or 2026 contenders, verified season stats and Messi–Ronaldo records with sourced analysis and interactive comparisons.", "/insights"); }
export default async function InsightsPage() { const { t } = await getI18n(); return <div className="page-container inner-page"><div className="page-intro inner-intro"><div><span className="eyebrow"><span className="tiny-dot"/>{t("THE READING ROOM")}</span><h1>{t("The reading room.")}</h1><p>{t("The award debates, the standout seasons and the numbers behind them.")}</p></div></div><EditorialCards /></div>; }
