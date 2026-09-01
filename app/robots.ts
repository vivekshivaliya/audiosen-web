import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo-routes";

// Azure promotes the same build artifact between slots. Evaluate the slot's
// indexability flags at request time so staging cannot inherit production's
// crawlable robots.txt (or vice versa).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (
    process.env.CATALOG_STAGING_PREVIEW_ENABLED === "true" ||
    process.env.AUDIOSEN_STAGING_DEPLOYMENT === "true"
  ) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
