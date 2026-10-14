import type { NextConfig } from "next";
import { canonicalHostRedirects } from "./src/lib/site-config";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Railway keeps a single server alive. Keep the disk-backed ISR cache, but
  // retain fewer duplicate page/data responses in the Node process.
  cacheMaxMemorySize: 16 * 1024 * 1024,
  experimental: {
    globalNotFound: true,
    // Load infrequently visited admin/image routes when requested.
    preloadEntriesOnStart: false,
    // Reuse styles as static assets instead of duplicating them in every ISR
    // document and RSC payload. Group chunks to limit first-paint CSS requests.
    cssChunking: { type: "graph", requestCost: 100000 },
  },
  // Vercel uses Postgres and native Linux Sharp. Keep SQLite for local work,
  // but omit its unused native binary and Sharp's optional WASM fallback there.
  ...(process.env.VERCEL === "1" ? {
    outputFileTracingExcludes: { "/*": [
      "./node_modules/@img/sharp-wasm32/**/*",
      "./node_modules/better-sqlite3/**/*.node",
    ] },
  } : {}),
  images: {
    // Only public, checked-in assets may enter the shared image cache. CMS
    // media has publication/auth checks and is served directly, unoptimized.
    localPatterns: [{ pathname: "/images/**", search: "" }],
    minimumCacheTTL: 86400,
    // Include intermediate portrait widths for high-density mobile screens.
    imageSizes: [32, 48, 64, 96, 128, 160, 192, 256, 320, 384, 480],
    qualities: [75, 85],
  },
  async redirects() {
    return canonicalHostRedirects(process.env);
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ] }, ...["/images/:path*", "/fonts/:path*"].map(source => ({
      source,
      // Unversioned filenames: short browser lifetime; Railway purges the
      // shared asset cache on deployment. Next's hashed bundles stay immutable.
      headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400" }],
    }))];
  },
};
export default nextConfig;
