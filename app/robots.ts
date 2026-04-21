import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://audiosen.com/sitemap.xml",
    host: "https://audiosen.com",
  };
}
