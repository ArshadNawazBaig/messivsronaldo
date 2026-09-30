import { revision } from "@/lib/admin/database";
import { readDailySyncState } from "@/lib/admin/daily-sync-state";
import { dailySyncHealth, monitorAuthorized, reportServerError } from "@/lib/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: Request) {
  if (!monitorAuthorized(request.headers.get("authorization"), process.env.HEALTHCHECK_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  try {
    // Intentionally uncached so healthy page caches cannot hide a DB outage.
    const [currentRevision, state] = await Promise.all([revision(), readDailySyncState()]);
    const dailySync = dailySyncHealth(state);
    return Response.json({ ok: dailySync.healthy, database: "ok", revision: currentRevision, dailySync },
      { status: dailySync.healthy ? 200 : 503, headers });
  } catch (error) {
    reportServerError(error, "health-check");
    return Response.json({ ok: false, database: "unavailable" }, { status: 503, headers });
  }
}
