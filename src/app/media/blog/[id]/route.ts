import { isAdmin } from "@/lib/admin/auth";
import { getMediaBytes, getMediaVisibility } from "@/lib/blog/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const missing = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  if (!/^[a-f0-9-]{36}\.webp$/.test(id)) return missing();
  const published = await getMediaVisibility(id);
  if (!published && !await isAdmin()) return missing();
  const data = await getMediaBytes(id);
  if (data === null) return missing();
  // Browser/CDN responses stay private so unpublishing takes effect on the next
  // request. Repeated database transfers are avoided by the server caches above.
  return new Response(new Uint8Array(data), { headers: { "Content-Type": "image/webp", "Content-Length": String(data.length), "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store", ...(!published ? { "X-Robots-Tag": "noindex" } : {}) } });
}
