import type { NextRequest } from "next/server";
import { getPublishedData } from "@/lib/server-data";
import { renderSocialImage } from "@/lib/social-image-renderer";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // A stable URL per theme lets social crawlers cache each image independently.
  const theme =
    request.nextUrl.searchParams.get("theme") === "light" ? "light" : "dark";
  const { scopes, snapshotDate } = await getPublishedData();
  const goals = scopes.career.metrics.find(
    (metric) => metric.id === "goals",
  )!.values;
  return renderSocialImage(theme, { goals, asOf: snapshotDate });
}
