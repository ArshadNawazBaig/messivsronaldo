import { timingSafeEqual } from "node:crypto";
import { withStatisticsRevalidation } from "@/lib/public-cache";
import { runDailySync } from "@/lib/admin/daily-sync";
import { AdminError } from "@/lib/admin/model";
import { reportServerError } from "@/lib/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  try {
    const result = await withStatisticsRevalidation(() => runDailySync());
    if (result.status === "failed" && !result.skipped) reportServerError({ code: "DAILY_SYNC_FAILED" }, "daily-sync");
    return Response.json(result, { status: result.status === "failed" && !result.skipped ? 503 : 200, headers });
  } catch (error) {
    reportServerError(error, "daily-sync");
    return Response.json({ error: error instanceof AdminError ? error.message : "Automatic update could not finish." }, {
      status: error instanceof AdminError ? error.status : 500, headers,
    });
  }
}
