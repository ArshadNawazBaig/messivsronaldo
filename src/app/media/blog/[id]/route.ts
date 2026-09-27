import { isAdmin } from "@/lib/admin/auth";
import { mediaIsPublic, readMedia, readPosts } from "@/lib/blog/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const missing = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  if (!/^[a-f0-9-]{36}\.webp$/.test(id)) return missing();
  const published = mediaIsPublic(id, await readPosts());
  if (!published && !await isAdmin()) return missing();
  const data = await readMedia(id);
  if (!data) return missing();
  return new Response(new Uint8Array(data), { headers: { "Content-Type": "image/webp", "Content-Length": String(data.length), "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store", ...(!published ? { "X-Robots-Tag": "noindex" } : {}) } });
}
