import { afterEach, describe, expect, test } from "vitest";
import robots from "@/app/robots";
import {
  SITE_ORIGIN,
  defaultSitemapRoutes,
  publicSeoRoutes,
} from "@/lib/seo-routes";

const originalEnvironment = {
  AUDIOSEN_STAGING_DEPLOYMENT: process.env.AUDIOSEN_STAGING_DEPLOYMENT,
  CATALOG_STAGING_PREVIEW_ENABLED: process.env.CATALOG_STAGING_PREVIEW_ENABLED,
};

const requiredOrganicPaths = [
  "/",
  "/hearing-aids-dehradun",
  "/hearing-test-dehradun",
  "/hearing-aid-repair-dehradun",
  "/hearing-aid-fitting-dehradun",
  "/hearing-aid-prices-dehradun",
  "/hearing-aids-india",
  "/home-hearing-care",
  "/speech-language-services",
] as const;

const requiredNoindexPaths = [
  "/care-plans",
  "/hearing-aid-repair",
  "/home-hearing-care-dehradun",
] as const;

function restoreEnvironment(name: keyof typeof originalEnvironment): void {
  const value = originalEnvironment[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function sitemapDefinition(route: (typeof publicSeoRoutes)[number]) {
  return "sitemap" in route ? route.sitemap : undefined;
}

afterEach(() => {
  restoreEnvironment("AUDIOSEN_STAGING_DEPLOYMENT");
  restoreEnvironment("CATALOG_STAGING_PREVIEW_ENABLED");
});

describe("public SEO route registry", () => {
  test("defines each canonical path once and makes sitemap eligibility explicit", () => {
    const paths = publicSeoRoutes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);

    for (const path of requiredOrganicPaths) {
      const route = publicSeoRoutes.find((candidate) => candidate.path === path);
      expect(route, `${path} must be registered`).toBeDefined();
      expect(route?.indexableByDefault, `${path} must be indexable`).toBe(true);
      expect(
        route ? sitemapDefinition(route) : undefined,
        `${path} must be submitted in the sitemap`,
      ).toBeDefined();
    }

    for (const path of requiredNoindexPaths) {
      const route = publicSeoRoutes.find((candidate) => candidate.path === path);
      expect(route, `${path} must be registered`).toBeDefined();
      expect(route?.indexableByDefault, `${path} must be noindex by default`).toBe(false);
      expect(
        route ? sitemapDefinition(route) : undefined,
        `${path} must not have a static sitemap definition`,
      ).toBeUndefined();
    }

    for (const route of publicSeoRoutes) {
      if (route.indexableByDefault) {
        expect(
          sitemapDefinition(route),
          `${route.path} is indexable but missing sitemap data`,
        ).toBeDefined();
      } else {
        expect(
          sitemapDefinition(route),
          `${route.path} is noindex but has sitemap data`,
        ).toBeUndefined();
      }
    }
  });

  test("emits unique production URLs with real, non-future modification dates", () => {
    const urls = defaultSitemapRoutes.map((route) => route.url);
    expect(new Set(urls).size).toBe(urls.length);

    for (const route of defaultSitemapRoutes) {
      const url = new URL(route.url);
      expect(url.origin).toBe(SITE_ORIGIN);
      expect(url.search).toBe("");
      expect(url.hash).toBe("");
      expect(route.lastModified, `${route.url} must expose lastModified`).toBeTruthy();

      const timestamp = Date.parse(String(route.lastModified));
      expect(Number.isNaN(timestamp), `${route.url} lastModified must be parseable`).toBe(false);
      expect(timestamp, `${route.url} lastModified cannot be in the future`).toBeLessThanOrEqual(
        Date.now(),
      );
    }

    const expectedUrls = publicSeoRoutes
      .filter((route) => route.indexableByDefault && route.sitemap)
      .map((route) => (route.path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route.path}`));
    expect(urls).toEqual(expectedUrls);
  });
});

describe("crawler policy", () => {
  test("production blocks only private application surfaces", () => {
    delete process.env.AUDIOSEN_STAGING_DEPLOYMENT;
    delete process.env.CATALOG_STAGING_PREVIEW_ENABLED;

    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      sitemap: `${SITE_ORIGIN}/sitemap.xml`,
      host: SITE_ORIGIN,
    });
  });

  test.each([
    "AUDIOSEN_STAGING_DEPLOYMENT",
    "CATALOG_STAGING_PREVIEW_ENABLED",
  ] as const)("%s makes the whole deployment non-indexable", (flag) => {
    delete process.env.AUDIOSEN_STAGING_DEPLOYMENT;
    delete process.env.CATALOG_STAGING_PREVIEW_ENABLED;
    process.env[flag] = "true";

    const result = robots();
    expect(result.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(result).not.toHaveProperty("sitemap");
  });
});
