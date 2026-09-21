import { getPublishedData } from "@/lib/server-data";
import { isScope, sources } from "@/lib/data";
export async function GET(_request: Request, { params }: { params: Promise<{ scope: string }> }) {
  const { scopes, snapshotDate, reviewedDate, datasetVersion, coverageNote } = await getPublishedData();
  const { scope } = await params;
  if (!isScope(scope)) return Response.json({ error: "Unknown comparison scope" }, { status: 404 });
  return Response.json({ version: datasetVersion, coverageEnds: snapshotDate, sourcesReviewed: reviewedDate, live: false, coverageNote, comparison: scopes[scope], sources: scopes[scope].source.map(id => sources[id]) }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
