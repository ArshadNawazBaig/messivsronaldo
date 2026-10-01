import { publisherConfiguration } from "@/lib/publisher-config";
export const dynamic = "force-static";
export function GET() {
  const { adsensePublisherId } = publisherConfiguration(process.env);
  if (!adsensePublisherId) return new Response("No advertising seller is configured.\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });
  return new Response(`google.com, ${adsensePublisherId}, DIRECT, f08c47fec0942fa0\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
