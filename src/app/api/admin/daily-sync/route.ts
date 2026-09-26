import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { runDailySync } from "@/lib/admin/daily-sync";
import { AdminError } from "@/lib/admin/model";

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
    const result = await runDailySync();
    return Response.json(result, { status: result.status === "failed" && !result.skipped ? 503 : 200, headers });
  } catch (error) {
    return Response.json({ error: error instanceof AdminError ? error.message : "Automatic update could not finish." }, {
      status: error instanceof AdminError ? error.status : 500, headers,
    });
  } finally {
    // Earlier dates may have published even when a later date failed.
    revalidatePath("/", "layout");
  }
}
