import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    globalNotFound: true,
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
    // Include intermediate portrait widths for high-density mobile screens.
    imageSizes: [32, 48, 64, 96, 128, 160, 192, 256, 320, 384, 480],
    qualities: [75, 85],
  },
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "www.messivsronaldo17.com" }],
      destination: "https://messivsronaldo17.com/:path*",
      permanent: true,
    }];
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ] }];
  },
};
export default nextConfig;
