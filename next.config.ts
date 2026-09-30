import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { globalNotFound: true },
  // Vercel runs native Linux Sharp. Its optional WASM fallback otherwise gets
  // copied into every image-rendering function alongside the native library.
  ...(process.env.VERCEL === "1" ? {
    outputFileTracingExcludes: { "/*": ["./node_modules/@img/sharp-wasm32/**/*"] },
  } : {}),
  images: {
    // Keep small thumbnails light while preserving detail in player portraits.
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
