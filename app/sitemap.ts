import type { MetadataRoute } from "next";
import { adLandingPageList } from "@/lib/ad-landing-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://audiosen.com";
  const staticRoutes = [
    "",
    "/about",
    "/accessibility",
    "/blog",
    "/careers",
    "/sitemap",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const adRoutes = adLandingPageList.map((page) => ({
    url: `${base}/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...adRoutes];
}
