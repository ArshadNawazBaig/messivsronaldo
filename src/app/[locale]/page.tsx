import { PageContext } from "@/components/page-context";
import { getI18n } from "@/lib/i18n/server";
import Link from "@/components/localized-link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { ComparisonGuide } from "@/components/comparison-guide";
import { Comparison, ExploreCards } from "@/components/comparison";
import { AwardChart } from "@/components/award-chart";
import { EditorialCards } from "@/components/editorial";
import { CurrentHighlights } from "@/components/expanded-details";
import { getPublishedData } from "@/lib/server-data";
import { pageMetadata } from "@/lib/site";
import { RecordAnswers } from "@/components/record-answers";
import { buildRecordAnswers } from "@/lib/record-answers";
import { ToolCards } from "@/components/tool-cards";
import { homeTitle } from "@/lib/home-content";
export async function generateMetadata() {
    const { t } = await getI18n();
    const { snapshotLabel } = await getPublishedData();
    return pageMetadata(homeTitle, t("Compare Messi vs Ronaldo career goals, assists, trophies and scoring rates. Explore club, World Cup and Champions League records. Data through {0}.", { 0: t(snapshotLabel) }), "/");
}
export default async function Home() {
    const { t } = await getI18n();
    const data = await getPublishedData();
    return <div className="page-container home-page">
    <PageContext path="/" title={t(homeTitle)} players={["messi", "ronaldo"]} mainEntityId="#comparison-dataset" breadcrumbs={[]} />
    <div className="edition-line"><span>{t("FOOTBALL / PLAYER COMPARISON")}</span></div>
    <section className="page-intro"><div><h1>{t("Messi ")}<span className="title-vs">{t("vs")}</span>{t(" Ronaldo")}</h1><p>{t("Career goals, assists and trophies. Choose a competition. Compare the records.")}</p></div><Link className="intro-link" href="/methodology">{t("How we count ")}<ArrowUpRight size={16}/></Link></section>
    <Comparison />
    <RecordAnswers answers={buildRecordAnswers(data, t)} compact />
    <CurrentHighlights />
    <AwardChart />
    <ExploreCards />
    <ComparisonGuide />
    <ToolCards />
    <section className="trust-banner"><div><span className="section-kicker">{t("THE SCORING CALCULATOR")}</span><h2>{t("Same opportunity. Your comparison.")}</h2><p>{t("Choose a record for each player. Compare their goals at equal minutes or appearances, explore peak seasons, and share your calculation.")}</p></div><Link href="/scoring-calculator">{t("Open the calculator")}<ArrowUpRight size={17}/></Link></section>
    <EditorialCards limit={3} />
    <section className="trust-banner"><div><span className="section-kicker">{t("ABOUT THE DATA")}</span><h2>{t("A comparison you can check.")}</h2><p>{t("Every statistic links to its source. Counting rules, coverage dates and corrections are public.")}</p></div><Link href="/methodology">{t("Sources & methodology ")}<ArrowUpRight size={17}/></Link></section>
    <div className="back-to-data"><a href="#comparison">{t("Back to the comparison ")}<ArrowDown size={13}/></a></div>
  </div>;
}
