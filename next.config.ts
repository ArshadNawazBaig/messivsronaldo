import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
