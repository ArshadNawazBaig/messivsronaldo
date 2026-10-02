import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    globalNotFound: true,
    // Deliver first-paint styles with HTML instead of waiting for ten CSS
    // requests on a cold mobile visit. Client navigation still reuses styles.
    inlineCss: true,
    // Keep unrelated route and admin styles out of public-page CSS bundles.
    cssChunking: { type: "graph", requestCost: 5000 },
  },
  // Vercel runs native Linux Sharp. Its optional WASM fallback otherwise gets
  // copied into every image-rendering function alongside the native library.
  ...(process.env.VERCEL === "1" ? {
    outputFileTracingExcludes: { "/*": ["./node_modules/@img/sharp-wasm32/**/*"] },
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
