import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * The API routes are excluded because there is nothing there to index: they
 * answer JSON, and a crawler following /api/x/login would burn an OAuth
 * round trip to reach an error.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
