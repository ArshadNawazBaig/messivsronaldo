import { getPublishedData } from "@/lib/server-data";
import { isScope, sources } from "@/lib/data";
export const revalidate = 3600;
export function generateStaticParams() { return []; }
export async function GET(_request: Request, { params }: { params: Promise<{ scope: string }> }) {
  const { scope } = await params;
  if (!isScope(scope)) return Response.json({ error: "Unknown comparison scope" }, { status: 404 });
  const { scopes, snapshotDate, reviewedDate, datasetVersion, coverageNote } = await getPublishedData();
  return Response.json({ version: datasetVersion, coverageEnds: snapshotDate, sourcesReviewed: reviewedDate, live: false, coverageNote, comparison: scopes[scope], sources: scopes[scope].source.map(id => sources[id]) }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate", "X-Robots-Tag": "noindex" } });
}
