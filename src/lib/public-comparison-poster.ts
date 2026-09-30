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

// Bump when artwork/layout changes independently of the published dataset.
export const publicPosterRenderVersion = "2";
export function publicPosterImagePath(request: ComparisonPosterRequest, datasetVersion: string) {
  const selection = [request.scope, request.format, request.theme, request.showBars === false ? "0" : "1", ...(request.metrics ?? [])].join("~");
  return `/api/comparison-poster/${encodeURIComponent(`${publicPosterRenderVersion}-${datasetVersion}`)}/${selection}`;
}
export function posterSelectionParams(selection: string) {
  if (selection.length > 500) throw new RangeError("Poster selection is too long.");
  const [scope, format, theme, bars, ...metrics] = selection.split("~");
  if (!scope || !format || !theme || !bars) throw new RangeError("Incomplete poster selection.");
  return new URLSearchParams({ scope, format, theme, bars, ...(metrics.length ? { metrics: metrics.join(",") } : {}) });
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
