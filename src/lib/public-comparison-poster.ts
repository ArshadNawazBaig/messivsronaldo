import { comparisonPosterSchema, comparisonRows, getComparisonPoster, type ComparisonPosterRequest } from "./comparison-poster";
import type { PublishedData } from "./published-data";

export const defaultPublicPoster: ComparisonPosterRequest = {
  design: "comparison", scope: "career", format: "portrait", theme: "light", showBars: true,
};
export const posterQueryKeys = ["scope", "format", "theme", "bars", "metrics"] as const;

// Public requests select published facts; they cannot supply numbers, copy or assets.
export function parsePublicPoster(params: URLSearchParams): ComparisonPosterRequest {
  if (params.toString().length > 1000) throw new RangeError("Poster selection is too long.");
  for (const key of params.keys()) {
    if (!posterQueryKeys.includes(key as typeof posterQueryKeys[number]) || params.getAll(key).length !== 1)
      throw new RangeError("Unknown or repeated poster option.");
  }
  const bars = params.get("bars");
  if (bars !== null && bars !== "0" && bars !== "1") throw new RangeError("Invalid comparison style.");
  return comparisonPosterSchema.parse({
    ...defaultPublicPoster,
    ...Object.fromEntries(["scope", "format", "theme"].filter(key => params.has(key)).map(key => [key, params.get(key)])),
    showBars: bars !== "0",
    ...(params.has("metrics") ? { metrics: params.get("metrics")!.split(",") } : {}),
  });
}

export function publicPosterQuery(request: ComparisonPosterRequest) {
  const params = new URLSearchParams({ scope: request.scope, format: request.format, theme: request.theme, bars: request.showBars === false ? "0" : "1" });
  if (request.metrics) params.set("metrics", request.metrics.join(","));
  return params.toString();
}

export function resolvePublicPoster(params: URLSearchParams, data: PublishedData) {
  const request = parsePublicPoster(params);
  const poster = getComparisonPoster(data, request);
  // A valid metric can still be unavailable for this competition.
  comparisonRows(poster, request.metrics);
  return { request, poster };
}

// Ignore attribution parameters on the page, but keep the image API strict.
export function pagePosterParams(search: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const key of posterQueryKeys) {
    const value = search[key];
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  }
  return params;
}
