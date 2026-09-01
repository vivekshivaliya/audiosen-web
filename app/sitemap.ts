import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";
import { getApprovedBusinessProfile } from "@/lib/business-profile";
import { getApprovedCatalogSnapshot } from "@/lib/catalog/approved-snapshot";
import { getCatalogModelPath } from "@/lib/catalog/repository";
import { getActivePublicOffers } from "@/lib/offers/public";
import {
  absoluteSeoUrl,
  defaultSitemapRoutes,
  SEO_CONTENT_LAST_MODIFIED,
} from "@/lib/seo-routes";
import { hearingServices, speechServices } from "@/lib/service-catalog";

export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (
    process.env.CATALOG_STAGING_PREVIEW_ENABLED === "true" ||
    process.env.AUDIOSEN_STAGING_DEPLOYMENT === "true"
  ) {
    return [];
  }

  const staticRoutes: MetadataRoute.Sitemap = [...defaultSitemapRoutes];
  if (process.env.LEGAL_CONTENT_APPROVED === "true") {
    staticRoutes.push(
      ...[
        "/legal",
        "/privacy-policy",
        "/terms-of-service",
        "/refund-cancellation",
      ].map((path) => ({
        url: absoluteSeoUrl(path as `/${string}`),
        lastModified: SEO_CONTENT_LAST_MODIFIED,
        changeFrequency: "yearly" as const,
        priority: 0.2,
      })),
    );
  }

  const articleRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: absoluteSeoUrl(`/blog/${post.slug}`),
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const hearingServiceRoutes: MetadataRoute.Sitemap = hearingServices.map((service) => ({
    url: absoluteSeoUrl(
      (service.canonicalPath ?? `/services/${service.slug}`) as `/${string}`,
    ),
    lastModified: SEO_CONTENT_LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const speechServiceRoutes: MetadataRoute.Sitemap = speechServices.map((service) => ({
    url: absoluteSeoUrl(`/speech-language-services/${service.slug}`),
    lastModified: SEO_CONTENT_LAST_MODIFIED,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const [approvedProfile, approvedCatalog, approvedOffers] = await Promise.all([
    getApprovedBusinessProfile(),
    getApprovedCatalogSnapshot(),
    getActivePublicOffers(),
  ]);
  const approvedGoogleRoutes: MetadataRoute.Sitemap = approvedProfile?.googleReviewUri
    ? [
        {
          url: absoluteSeoUrl("/review"),
          lastModified: approvedProfile.approvedAt ?? SEO_CONTENT_LAST_MODIFIED,
          changeFrequency: "monthly",
          priority: 0.6,
        },
      ]
    : [];

  const catalogLastModified = approvedCatalog
    ? [...approvedCatalog.brands, ...approvedCatalog.models]
        .map((entry) => entry.source.checkedAt)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? SEO_CONTENT_LAST_MODIFIED
    : SEO_CONTENT_LAST_MODIFIED;
  const approvedCatalogRoutes: MetadataRoute.Sitemap = approvedCatalog
    ? [
        ...[
          { path: "/hearing-aids", priority: 0.9 },
          { path: "/compare-hearing-aids", priority: 0.7 },
          { path: "/find-my-hearing-aid", priority: 0.7 },
        ].map(({ path, priority }) => ({
          url: absoluteSeoUrl(path as `/${string}`),
          lastModified: catalogLastModified,
          changeFrequency: "weekly" as const,
          priority,
        })),
        ...approvedCatalog.brands.map((brand) => ({
          url: absoluteSeoUrl(`/hearing-aids/${brand.slug}`),
          lastModified: brand.source.checkedAt ?? catalogLastModified,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })),
        ...approvedCatalog.models.map((model) => ({
          url: absoluteSeoUrl(getCatalogModelPath(model) as `/${string}`),
          lastModified: model.source.checkedAt ?? catalogLastModified,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ]
    : [];

  const approvedOfferRoutes: MetadataRoute.Sitemap = approvedOffers.length
    ? [
        {
          url: absoluteSeoUrl("/offers"),
          lastModified:
            approvedOffers.at(-1)?.startsAt ?? SEO_CONTENT_LAST_MODIFIED,
          changeFrequency: "weekly",
          priority: 0.6,
        },
        ...approvedOffers.map((offer) => ({
          url: absoluteSeoUrl(offer.landingPage as `/${string}`),
          lastModified: offer.startsAt,
          changeFrequency: "weekly" as const,
          priority: 0.6,
        })),
      ]
    : [];

  const routes: MetadataRoute.Sitemap = [
    ...staticRoutes,
    ...hearingServiceRoutes,
    ...speechServiceRoutes,
    ...articleRoutes,
    ...approvedGoogleRoutes,
    ...approvedCatalogRoutes,
    ...approvedOfferRoutes,
  ];

  return Array.from(new Map(routes.map((route) => [route.url, route])).values());
}
