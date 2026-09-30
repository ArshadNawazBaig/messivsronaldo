import { parsePublicPoster, publicPosterImagePath, resolvePublicPoster } from "@/lib/public-comparison-poster";
import { getPublishedData } from "@/lib/server-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
    try { parsePublicPoster(params); }
    catch { return error("Invalid poster selection. Choose a published competition and its available statistics.", 422); }
    const data = await getPublishedData();
    let selection;
    try { selection = resolvePublicPoster(params, data); }
    catch { return error("Invalid poster selection. Choose a published competition and its available statistics.", 422); }
    return new Response(null, { status: 307, headers: {
      ...headers, Location: publicPosterImagePath(selection.request, data.datasetVersion),
      "Cache-Control": "public, max-age=30, s-maxage=30",
    } });
  } catch (cause) {
    console.error("Public comparison poster render failed", cause instanceof Error ? cause.message : "Unknown error");
    return error("We could not create the poster. Please try again.", 500);
  }
}
