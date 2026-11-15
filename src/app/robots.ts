import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/auth", "/login", "/signup", "/check-email", "/reset-password", "/forgot-password"] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
