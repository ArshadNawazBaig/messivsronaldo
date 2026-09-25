import { checkOrigin, requireAdmin } from "@/lib/admin/auth";
import { AdminError } from "@/lib/admin/model";
import { imageFilename, statImageSchema } from "@/lib/stat-image";
import { renderStatImage } from "@/lib/stat-image-renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin();
    // Bound the stream before parsing; client Content-Length is not trusted.
    const reader = request.body?.getReader();
    const decoder = new TextDecoder();
    let raw = "",
      bytes = 0;
    if (reader)
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 12_000) {
          await reader.cancel();
          throw new AdminError("Request is too large.", 413);
        }
        raw += decoder.decode(value, { stream: true });
      }
    raw += decoder.decode();
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new AdminError("Invalid image request.", 422);
    }
    const result = statImageSchema.safeParse(body);
    if (!result.success)
      throw new AdminError(
        "This comparison cannot be exported. Check its values and date.",
        422,
      );
    const rendered = await renderStatImage(result.data);
    // Consume here so rendering failures become a safe JSON error rather than a broken PNG.
    const png = await rendered.arrayBuffer();
    return new Response(png, {
      headers: {
        ...headers,
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${imageFilename(result.data)}"`,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof AdminError
            ? error.message
            : "The image could not be created. Please try again.",
      },
      { status: error instanceof AdminError ? error.status : 500, headers },
    );
  }
}
