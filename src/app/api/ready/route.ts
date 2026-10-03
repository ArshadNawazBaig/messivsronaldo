import { revision } from "@/lib/admin/database";
import { reportServerError } from "@/lib/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET() {
  try {
    // Deployment readiness must reach initialized storage, even with warm caches.
    // Detailed scheduler health remains behind the authenticated /api/health API.
    const current = await revision();
    if (!Number.isSafeInteger(current) || current < 0) throw new Error("Missing database state");
    return Response.json({ ok: true }, { headers });
  } catch (error) {
    reportServerError(error, "readiness");
    return Response.json({ ok: false }, { status: 503, headers });
  }
}
