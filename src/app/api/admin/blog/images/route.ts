import sharp from "sharp";
import { checkOrigin, requireAdmin } from "@/lib/admin/auth";
import { AdminError } from "@/lib/admin/model";
import { blogFailure, limitedBody, privateHeaders } from "@/lib/blog/http";
import { saveMedia } from "@/lib/blog/store";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request); await requireAdmin();
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(request.headers.get("content-type") ?? "")) throw new AdminError("Choose a JPEG, PNG, WebP or AVIF image.", 415);
    const input = await limitedBody(request, 3_000_000);
    let data: Buffer;
    try {
      const image = sharp(input, { limitInputPixels: 40_000_000, animated: false });
      const metadata = await image.metadata();
      if (!["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format ?? "")) throw new Error("Invalid format");
      data = await image.rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    } catch { throw new AdminError("This image could not be opened. Use a valid image under 3 MB and 40 megapixels.", 422); }
    return Response.json({ path: await saveMedia(data) }, { headers: privateHeaders });
  } catch (error) { return blogFailure(error); }
}
