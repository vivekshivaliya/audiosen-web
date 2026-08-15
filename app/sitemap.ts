import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";
import { localServicePageList } from "@/lib/local-service-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://audiosen.com";
  const lastSiteUpdate = "2026-08-15";
  const staticRouteDefinitions = [
    { path: "", frequency: "weekly" as const, priority: 1 },
    { path: "/about", frequency: "monthly" as const, priority: 0.7 },
    { path: "/accessibility", frequency: "yearly" as const, priority: 0.3 },
    { path: "/blog", frequency: "weekly" as const, priority: 0.8 },
    { path: "/careers", frequency: "monthly" as const, priority: 0.4 },
    { path: "/hearing-aids-india", frequency: "weekly" as const, priority: 0.9 },
    { path: "/hearing-aids-dehradun", frequency: "weekly" as const, priority: 0.9 },
    { path: "/hearing-test", frequency: "monthly" as const, priority: 0.6 },
    { path: "/legal", frequency: "yearly" as const, priority: 0.2 },
    { path: "/privacy-policy", frequency: "yearly" as const, priority: 0.2 },
    { path: "/terms-of-service", frequency: "yearly" as const, priority: 0.2 },
    { path: "/refund-cancellation", frequency: "yearly" as const, priority: 0.2 },
    { path: "/sitemap", frequency: "monthly" as const, priority: 0.3 },
  ];
  const staticRoutes: MetadataRoute.Sitemap = staticRouteDefinitions.map(({ path, frequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: lastSiteUpdate,
    changeFrequency: frequency,
    priority,
  }));

  const localServiceRoutes: MetadataRoute.Sitemap = localServicePageList.map((page) => ({
    url: `${base}/${page.slug}`,
    lastModified: lastSiteUpdate,
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
