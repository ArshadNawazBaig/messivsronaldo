import { getPublishedData } from "@/lib/server-data";
import { renderSocialImage } from "@/lib/social-image-renderer";

export const runtime = "nodejs";
export const revalidate = 3600;
export function generateStaticParams() { return []; }

export async function GET(_request: Request, { params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  if (theme !== "light" && theme !== "dark") return new Response(null, { status: 404 });
  const { scopes, snapshotDate } = await getPublishedData();
  // Await rendering before returning so transient failures cannot become an ISR
  // response. The statistics tag invalidates both themes after publication.
  const image = await renderSocialImage(theme, { goals: scopes.career.goals, asOf: snapshotDate });
  return new Response(await image.arrayBuffer(), { headers: {
    "Content-Type": "image/png", "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
  } });
}
