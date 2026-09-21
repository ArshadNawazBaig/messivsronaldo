import { z } from "zod";
import { AdminError } from "./model";

const base = "https://v3.football.api-sports.io";
const maxPages = 10;
const envelopeSchema = z.object({
  errors: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]),
  response: z.array(z.unknown()),
  paging: z.object({ current: z.number().int().positive(), total: z.number().int().positive() }).optional(),
});
export type ProviderFetch = (path: string, params: Record<string, string | number>) => Promise<unknown[]>;

function safeDetail(errors: unknown, key: string) {
  if (!errors || typeof errors !== "object") return "";
  const parts = Object.entries(errors).map(([field, value]) =>
    typeof value === "string" ? `${field}: ${value}` : field,
  );
  let detail = parts.join("; ");
  // A provider may echo credentials in an authentication error. Never persist/display them.
  for (const secret of [key, encodeURIComponent(key)]) {
    if (secret) detail = detail.split(secret).join("[redacted]");
  }
  return detail.replace(/\s+/g, " ").trim().slice(0, 600);
}

function remaining(response: Response, header: string) {
  const value = response.headers.get(header);
  return value !== null && /^\d+$/.test(value) ? Number(value) : null;
}

function providerError(path: string, response: Response, detail: string) {
  const prefix = `API-Football /${path}`;
  let reason: string;
  let status = 502;
  if (remaining(response, "x-ratelimit-requests-remaining") === 0 || /daily|per day|for (?:the |this )?day|daily quota/i.test(detail)) {
    reason = "Daily request quota reached. Check your API-Football dashboard for the quota reset before retrying.";
    status = 429;
  } else if (response.status === 429 || /rate.?limit|requests per minute|too many requests/i.test(detail)) {
    const retry = response.headers.get("retry-after");
    reason = `Request rate limit reached. Wait ${retry && /^\d+$/.test(retry) ? `${retry} seconds` : "at least 60 seconds"} before retrying.`;
    status = 429;
  } else if (response.status === 401 || /api.?key|token|authentication/i.test(detail)) {
    reason = "Key rejected. Use the API-Sports key from Account → My Access in the API-Football dashboard.";
  } else if (response.status === 403 || /subscription|access|free plan|season|not subscribed/i.test(detail)) {
    reason = "Access restricted. Check whether your subscription permits this endpoint and season.";
  } else {
    reason = `Request rejected${response.ok ? "" : ` (HTTP ${response.status})`}.`;
  }
  return new AdminError(`${prefix}: ${reason}${detail ? ` Provider message: ${detail}` : ""} No changes were saved.`, status);
}

export function apiClient(key: string, send: typeof fetch = fetch): ProviderFetch {
  let dailyRemaining: number | null = null;
  let minuteRemaining: number | null = null;
  return async (path, params) => {
    const records: unknown[] = [];
    let total = 1;
    for (let page = 1; page <= total; page++) {
      if (dailyRemaining === 0) throw new AdminError(`API-Football /${path}: Daily request quota reached. Check the quota reset in your provider dashboard before retrying. No changes were saved.`, 429);
      if (minuteRemaining === 0) throw new AdminError(`API-Football /${path}: Request rate limit reached. Wait at least 60 seconds before retrying. No changes were saved.`, 429);
      const url = new URL(`${base}/${path}`);
      for (const [name, value] of Object.entries(params)) url.searchParams.set(name, String(value));
      if (page > 1) url.searchParams.set("page", String(page));
      let response: Response;
      try {
        response = await send(url, { headers: { "x-apisports-key": key }, cache: "no-store", signal: AbortSignal.timeout(15_000), redirect: "error" });
      } catch {
        throw new AdminError(`API-Football /${path}: The request timed out or could not connect. Try again later. No changes were saved.`, 502);
      }
      dailyRemaining = remaining(response, "x-ratelimit-requests-remaining");
      minuteRemaining = remaining(response, "x-ratelimit-remaining");
      let body: unknown;
      try { body = await response.json(); }
      catch {
        if (!response.ok) throw providerError(path, response, "");
        throw new AdminError(`API-Football /${path}: Invalid JSON response. No changes were saved.`, 502);
      }
      const errors = body && typeof body === "object" && "errors" in body ? body.errors : undefined;
      const detail = safeDetail(errors, key);
      if (!response.ok || detail) throw providerError(path, response, detail);
      const parsed = envelopeSchema.safeParse(body);
      if (!parsed.success) throw new AdminError(`API-Football /${path}: Incomplete response format. No changes were saved.`, 502);
      const paging = parsed.data.paging;
      if ((paging?.current ?? 1) !== page || (page > 1 && paging?.total !== total)) {
        throw new AdminError(`API-Football /${path}: Inconsistent result pages. No changes were saved.`, 502);
      }
      total = paging?.total ?? 1;
      if (total > maxPages) throw new AdminError(`API-Football /${path}: Search exceeds ${maxPages} pages. Refine the lookup before retrying. No changes were saved.`, 502);
      if (total > 1 && !parsed.data.response.length) throw new AdminError(`API-Football /${path}: A result page is empty. No changes were saved.`, 502);
      records.push(...parsed.data.response);
    }
    return records;
  };
}
