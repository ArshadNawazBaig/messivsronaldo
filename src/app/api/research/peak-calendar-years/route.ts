import { getPublishedData } from "@/lib/server-data";
import { peakYearStudyCsv } from "@/lib/peak-year-study";

export const revalidate = 86400;
export async function GET() {
  return new Response(peakYearStudyCsv(await getPublishedData()), { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="messi-2012-ronaldo-2013-calculation.csv"',
    "X-Robots-Tag": "noindex",
    "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600",
  } });
}
