import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Preserve existing share URLs; canonical theme paths use the ISR cache.
  const theme =
    request.nextUrl.searchParams.get("theme") === "light" ? "light" : "dark";
  return new Response(null, { status: 307, headers: {
    Location: `/opengraph-image/${theme}`,
    "Cache-Control": "public, max-age=86400, s-maxage=86400",
  } });
}
