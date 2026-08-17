import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";
import { localServicePageList } from "@/lib/local-service-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://audiosen.com";
  type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  type RouteDefinition = {
    path: string;
    frequency: ChangeFrequency;
    priority: number;
    lastModified?: string;
  };

  const staticRouteDefinitions: RouteDefinition[] = [
    { path: "", frequency: "weekly", priority: 1, lastModified: "2026-08-17" },
    { path: "/about", frequency: "monthly", priority: 0.7 },
    { path: "/accessibility", frequency: "yearly", priority: 0.3 },
    { path: "/blog", frequency: "weekly", priority: 0.8 },
    { path: "/careers", frequency: "monthly", priority: 0.4 },
    { path: "/contact", frequency: "monthly", priority: 0.8, lastModified: "2026-08-17" },
    { path: "/editorial-policy", frequency: "yearly", priority: 0.5, lastModified: "2026-08-17" },
    { path: "/hearing-aids", frequency: "weekly", priority: 0.9, lastModified: "2026-08-17" },
    { path: "/hearing-aids-india", frequency: "weekly", priority: 0.9 },
    { path: "/hearing-aids-dehradun", frequency: "weekly", priority: 0.9 },
    { path: "/hearing-aid-prices-india", frequency: "monthly", priority: 0.9, lastModified: "2026-08-17" },
    { path: "/hearing-aid-types", frequency: "monthly", priority: 0.8, lastModified: "2026-08-17" },
    { path: "/hearing-aid-fitting-aftercare", frequency: "monthly", priority: 0.8, lastModified: "2026-08-17" },
    { path: "/hearing-aid-repair-india", frequency: "monthly", priority: 0.8, lastModified: "2026-08-17" },
    { path: "/hearing-test", frequency: "monthly", priority: 0.7 },
    { path: "/offers/50-percent-off", frequency: "weekly", priority: 0.7, lastModified: "2026-08-17" },
    { path: "/tools/hearing-aid-cost-calculator", frequency: "monthly", priority: 0.7, lastModified: "2026-08-17" },
    { path: "/legal", frequency: "yearly", priority: 0.2 },
    { path: "/privacy-policy", frequency: "yearly", priority: 0.2 },
    { path: "/terms-of-service", frequency: "yearly", priority: 0.2 },
    { path: "/refund-cancellation", frequency: "yearly", priority: 0.2 },
    { path: "/sitemap", frequency: "monthly", priority: 0.3, lastModified: "2026-08-17" },
  ];
  const staticRoutes: MetadataRoute.Sitemap = staticRouteDefinitions.map(
    ({ path, frequency, priority, lastModified }) => ({
      url: `${base}${path}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: frequency,
      priority,
    }),
  );

  const localServiceRoutes: MetadataRoute.Sitemap = localServicePageList.map((page) => ({
    url: `${base}/${page.slug}`,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const articleRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...localServiceRoutes, ...articleRoutes];
}
