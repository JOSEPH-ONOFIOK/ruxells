import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    {
      url: `${SITE_URL}/world`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/gallery`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/clearance`,
      changeFrequency: "daily",
      // The door is the page worth finding, so it is only a step below the
      // map rather than treated as a secondary route.
      priority: 0.9,
    },
  ];
}
