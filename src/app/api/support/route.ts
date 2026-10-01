import { checkOrigin } from "@/lib/admin/auth";
import { AdminError } from "@/lib/admin/model";
import { limitedBody, privateHeaders, supportClientKey, supportFailure } from "@/lib/support/http";
import { submitSupport } from "@/lib/support/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw new AdminError("Use the contact form to submit a report.", 415);
    let input: unknown;
    const raw = await limitedBody(request, 24_000);
    try { input = JSON.parse(raw.toString("utf8")); } catch { throw new AdminError("Invalid report.", 400); }
    const id = await submitSupport(input, supportClientKey(request));
    return Response.json({ id }, { status: 201, headers: privateHeaders });
  } catch (error) { return supportFailure(error); }
}
