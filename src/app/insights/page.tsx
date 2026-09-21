import { EditorialCards } from "@/components/editorial";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata("The Reading Room — Football Stats Explained", "Understand assist definitions, scoring rates and career-goal counting rules with original Messi and Ronaldo comparison guides.", "/insights");
export default function InsightsPage() { return <div className="page-container inner-page"><div className="page-intro inner-intro"><div><span className="eyebrow"><span className="tiny-dot" />THE READING ROOM</span><h1>The reading room.</h1><p>Explanations of scoring rates, assist definitions and the rules behind career totals.</p></div></div><EditorialCards /></div>; }
