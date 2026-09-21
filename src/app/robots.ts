import type { MetadataRoute } from "next";
import { indexable, siteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", ...(indexable ? { allow: "/", disallow: ["/api/", "/admin"] } : { disallow: "/" }) }, sitemap: `${siteUrl}/sitemap.xml` }; }
