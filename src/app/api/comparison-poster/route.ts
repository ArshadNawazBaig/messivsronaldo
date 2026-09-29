import { createHash } from "node:crypto";
import { comparisonPosterFilename } from "@/lib/comparison-poster";
import { renderComparisonPoster } from "@/lib/comparison-poster-renderer";
import { PosterRenderBusy, PosterRenderCache } from "@/lib/poster-render-cache";
import { resolvePublicPoster } from "@/lib/public-comparison-poster";
import { getPublishedData } from "@/lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cache = new PosterRenderCache();
const headers = { "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff" };
function error(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { ...headers, "Cache-Control": "no-store", ...(status === 503 ? { "Retry-After": "3" } : {}) } });
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  if (params.toString().length > 1200) return error("Poster selection is too long.", 422);
  // The published version changes preview URLs after a data refresh. It never
  // changes the facts or the internal cache key, which includes the full data.
  if (params.getAll("v").length > 1 || (params.get("v")?.length ?? 0) > 100) return error("Invalid data version.", 422);
  params.delete("v");
  try {
    const data = await getPublishedData();
    let selection;
    try { selection = resolvePublicPoster(params, data); }
    catch { return error("Invalid poster selection. Choose a published competition and its available statistics.", 422); }
    const { request, poster } = selection;
    const key = createHash("sha256").update(JSON.stringify([request, poster])).digest("hex");
    const png = await cache.get(key, async () => (await renderComparisonPoster(request, poster)).arrayBuffer());
    return new Response(png, { headers: {
      ...headers, "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${comparisonPosterFilename(request, poster)}"`,
      "Cache-Control": "public, max-age=60, s-maxage=300",
    } });
  } catch (cause) {
    if (cause instanceof PosterRenderBusy) return error("The poster studio is busy. Please try again in a few seconds.", 503);
    console.error("Public comparison poster render failed", cause instanceof Error ? cause.message : "Unknown error");
    return error("We could not create the poster. Please try again.", 500);
  }
}
