import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/premium",
        "/projects/",
        "/report",
        "/results",
        "/style",
        "/upload",
        "/variants",
        "/wizard",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
