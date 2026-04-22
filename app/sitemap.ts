import type { MetadataRoute } from "next";

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

  return staticRoutes;
}
