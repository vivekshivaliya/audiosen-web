import type { MetadataRoute } from "next";

export const SITE_ORIGIN = "https://audiosen.com";
export const SEO_CONTENT_LAST_MODIFIED = "2026-09-01";

export type SeoCanonicalPath = "/" | `/${string}`;

export type SeoRouteDefinition = Readonly<{
  path: SeoCanonicalPath;
  indexableByDefault: boolean;
  sitemap?: Readonly<{
    lastModified: string;
    changeFrequency: NonNullable<
      MetadataRoute.Sitemap[number]["changeFrequency"]
    >;
    priority: number;
  }>;
}>;

/**
 * Canonical policy for public, non-dynamic routes. Routes without a sitemap
 * definition remain crawlable when necessary, but are noindex by default.
 * Database-approved catalog, offer and review routes are added separately at
 * request time because their publication state is not a source-code fact.
 */
export const publicSeoRoutes: readonly SeoRouteDefinition[] = [
  {
    path: "/",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
  },
  {
    path: "/about",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  },
  {
    path: "/accessibility",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  },
  {
    path: "/blog",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  },
  {
    path: "/contact",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  },
  {
    path: "/editorial-policy",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  },
  {
    path: "/services",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  },
  {
    path: "/speech-language-services",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  },
  {
    path: "/book-consultation",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  },
  {
    path: "/home-hearing-care",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  },
  {
    path: "/audiogram-guidance",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  },
  {
    path: "/hearing-aids-india",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  },
  {
    path: "/hearing-aids-dehradun",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  },
  {
    path: "/hearing-test-dehradun",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  },
  {
    path: "/hearing-aid-prices-dehradun",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  },
  {
    path: "/hearing-aid-repair-dehradun",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  },
  {
    path: "/hearing-aid-fitting-dehradun",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  },
  {
    path: "/hearing-aid-prices-india",
    indexableByDefault: true,
    sitemap: {
      lastModified: "2026-08-17",
      changeFrequency: "monthly",
      priority: 0.8,
    },
  },
  {
    path: "/hearing-aid-types",
    indexableByDefault: true,
    sitemap: {
      lastModified: "2026-08-17",
      changeFrequency: "monthly",
      priority: 0.8,
    },
  },
  {
    path: "/hearing-aid-fitting-aftercare",
    indexableByDefault: true,
    sitemap: {
      lastModified: "2026-08-17",
      changeFrequency: "monthly",
      priority: 0.8,
    },
  },
  {
    path: "/hearing-aid-repair-india",
    indexableByDefault: true,
    sitemap: {
      lastModified: "2026-08-17",
      changeFrequency: "monthly",
      priority: 0.8,
    },
  },
  {
    path: "/hearing-test",
    indexableByDefault: true,
    sitemap: {
      lastModified: SEO_CONTENT_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  },
  {
    path: "/tools/hearing-aid-cost-calculator",
    indexableByDefault: true,
    sitemap: {
      lastModified: "2026-08-17",
      changeFrequency: "monthly",
      priority: 0.7,
    },
  },
  {
    path: "/sitemap",
    indexableByDefault: true,
    sitemap: {
      lastModified: "2026-08-17",
      changeFrequency: "monthly",
      priority: 0.3,
    },
  },
  { path: "/care-plans", indexableByDefault: false },
  { path: "/careers", indexableByDefault: false },
  { path: "/experts", indexableByDefault: false },
  { path: "/hearing-aid-repair", indexableByDefault: false },
  { path: "/home-hearing-care-dehradun", indexableByDefault: false },
  { path: "/legal", indexableByDefault: false },
  { path: "/privacy-policy", indexableByDefault: false },
  { path: "/refund-cancellation", indexableByDefault: false },
  { path: "/terms-of-service", indexableByDefault: false },
];

export function getPublicSeoRoute(
  path: SeoCanonicalPath,
): SeoRouteDefinition | undefined {
  return publicSeoRoutes.find((route) => route.path === path);
}

export function isIndexableByDefault(path: SeoCanonicalPath): boolean {
  return getPublicSeoRoute(path)?.indexableByDefault === true;
}

export function absoluteSeoUrl(path: SeoCanonicalPath): string {
  return path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

export const defaultSitemapRoutes: MetadataRoute.Sitemap = publicSeoRoutes.flatMap(
  (route) =>
    route.indexableByDefault && route.sitemap
      ? [
          {
            url: absoluteSeoUrl(route.path),
            lastModified: route.sitemap.lastModified,
            changeFrequency: route.sitemap.changeFrequency,
            priority: route.sitemap.priority,
          },
        ]
      : [],
);
