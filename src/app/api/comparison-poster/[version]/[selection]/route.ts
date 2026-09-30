import { createHash } from "node:crypto";
import { comparisonPosterFilename } from "@/lib/comparison-poster";
import { renderComparisonPoster } from "@/lib/comparison-poster-renderer";
import { PosterRenderBusy, PosterRenderCache } from "@/lib/poster-render-cache";
import { parsePublicPoster, posterSelectionParams, publicPosterImagePath, publicPosterRenderVersion, resolvePublicPoster } from "@/lib/public-comparison-poster";
import { getPublishedData } from "@/lib/server-data";

export const runtime = "nodejs";
export const revalidate = 86400;
export function generateStaticParams() { return []; }
// ISR stores completed PNG responses across instances. The memory cache only
// bounds concurrent work while an uncached response is being generated.
const cache = new PosterRenderCache();
const headers = { "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff" };
export async function GET(_request: Request, { params }: { params: Promise<{ version: string; selection: string }> }) {
  try {
    const { version, selection } = await params;
    let query;
    try {
      if (version.length > 120) throw new RangeError("Invalid version.");
      query = posterSelectionParams(selection);
      parsePublicPoster(query);
    } catch { return Response.json({ error: "Invalid poster selection." }, { status: 422, headers: { ...headers, "Cache-Control": "no-store" } }); }
    const data = await getPublishedData();
    let resolved;
    try { resolved = resolvePublicPoster(query, data); }
    catch { return Response.json({ error: "Unavailable poster statistics." }, { status: 422, headers: { ...headers, "Cache-Control": "no-store" } }); }
    const { request, poster } = resolved;
    if (version !== `${publicPosterRenderVersion}-${data.datasetVersion}`) {
      // Never put newer statistics under an older version's image URL.
      return new Response(null, { status: 307, headers: { ...headers, Location: publicPosterImagePath(request, data.datasetVersion), "Cache-Control": "no-store" } });
    }
    const key = createHash("sha256").update(JSON.stringify([publicPosterRenderVersion, request, poster])).digest("hex");
    const png = await cache.get(key, async () => (await renderComparisonPoster(request, poster)).arrayBuffer());
    return new Response(png, { headers: {
      ...headers, "Content-Type": "image/png", ETag: `"${key}"`,
      "Content-Disposition": `inline; filename="${comparisonPosterFilename(request, poster)}"`,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    } });
  } catch (cause) {
    // ISR also stores returned error Responses, even with HTTP no-store. Throw
    // transient failures so a retry can render again and an existing good PNG
    // remains available during failed background regeneration. Keep DB/renderer
    // details out of the framework's error response and logs.
    throw new Error(cause instanceof PosterRenderBusy
      ? "The poster studio is busy. Please try again."
      : "We could not create the poster. Please try again.");
  }
}
