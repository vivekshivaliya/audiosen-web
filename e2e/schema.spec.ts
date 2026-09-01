import { JSDOM } from "jsdom";
import { expect, test, type APIRequestContext } from "@playwright/test";

const canonicalOrganizationId = "https://audiosen.com/#organization";
const legacyLocalBusinessId = "https://audiosen.com/#approved-local-business";
const productionOrigin = "https://audiosen.com";

const approvedBusinessIdentity = {
  name: "Audiosen",
  descriptor: "Audiosen Advance Hearing Care Solutions",
  telephone: "+918923092563",
  email: "support@audiosen.com",
  address: {
    streetAddress: "7, 11, Ram Vihar St, near ONGC Hospital",
    addressLocality: "Dehradun",
    addressRegion: "Uttarakhand",
    postalCode: "248001",
    addressCountry: "IN",
  },
} as const;

const schemaRoutes = [
  "/",
  "/contact",
  "/book-consultation",
  "/hearing-aids-dehradun",
  "/hearing-aids-india",
  "/home-hearing-care",
  "/services",
  "/speech-language-services",
  "/speech-language-services/speech-therapy",
  "/blog",
] as const;

const requiredSitemapUrls = [
  "https://audiosen.com/hearing-aids-dehradun",
  "https://audiosen.com/hearing-test-dehradun",
  "https://audiosen.com/hearing-aid-repair-dehradun",
  "https://audiosen.com/hearing-aid-fitting-dehradun",
  "https://audiosen.com/hearing-aid-prices-dehradun",
  "https://audiosen.com/hearing-aid-prices-india",
  "https://audiosen.com/home-hearing-care",
] as const;

const defaultNoindexRoutes = [
  "/care-plans",
  "/compare-hearing-aids",
  "/find-my-hearing-aid",
  "/hearing-aid-rental",
  "/hearing-aid-repair",
  "/hearing-aid-trial",
  "/hearing-aids",
  "/offers",
  "/offers/50-percent-off",
  "/review",
] as const;

const prioritySearchRoutes = [
  {
    path: "/hearing-aids-dehradun",
    titleTerms: [/hearing aid/i, /dehradun/i],
    descriptionTerms: [/hearing aid/i, /dehradun/i],
  },
  {
    path: "/hearing-test-dehradun",
    titleTerms: [/hearing test/i, /dehradun/i],
    descriptionTerms: [/hearing/i, /dehradun/i],
  },
  {
    path: "/hearing-aid-repair-dehradun",
    titleTerms: [/hearing aid repair/i, /dehradun/i],
    descriptionTerms: [/repair/i, /dehradun/i],
  },
  {
    path: "/hearing-aid-fitting-dehradun",
    titleTerms: [/hearing aid fitting/i, /dehradun/i],
    descriptionTerms: [/fitting/i, /dehradun/i],
  },
  {
    path: "/hearing-aids-india",
    titleTerms: [/hearing aid/i, /india/i],
    descriptionTerms: [/hearing aid/i, /india/i],
  },
  {
    path: "/home-hearing-care",
    titleTerms: [/home hearing care/i],
    descriptionTerms: [/home/i, /hearing/i],
  },
  {
    path: "/speech-language-services",
    titleTerms: [/speech/i],
    descriptionTerms: [/speech|communication/i, /enquir|support/i],
  },
] as const;

type JsonRecord = Record<string, unknown>;

type SitemapEntry = {
  location: string;
  lastModified: string;
};

function schemaTypes(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  return [];
}

function collectJsonObjects(value: unknown, result: JsonRecord[] = []): JsonRecord[] {
  if (Array.isArray(value)) {
    value.forEach((child) => collectJsonObjects(child, result));
    return result;
  }
  if (!value || typeof value !== "object") return result;

  const record = value as JsonRecord;
  result.push(record);
  Object.values(record).forEach((child) => collectJsonObjects(child, result));
  return result;
}

function visitJson(value: unknown, visitor: (key: string, child: unknown) => void): void {
  if (Array.isArray(value)) {
    value.forEach((child) => visitJson(child, visitor));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    visitor(key, child);
    visitJson(child, visitor);
  }
}

function directiveValues(body: string, directive: string): string[] {
  const prefix = `${directive.toLowerCase()}:`;
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith(prefix))
    .map((line) => line.slice(line.indexOf(":") + 1).trim());
}

function singleMetaContent(document: Document, selector: string, context: string): string {
  const elements = Array.from(document.querySelectorAll<HTMLMetaElement>(selector));
  expect(elements, `${context} must expose exactly one ${selector}`).toHaveLength(1);
  const content = elements[0]?.content.trim() ?? "";
  expect(content, `${context} ${selector} must not be empty`).not.toBe("");
  return content;
}

async function readSitemap(request: APIRequestContext): Promise<SitemapEntry[]> {
  const response = await request.get("/sitemap.xml", { failOnStatusCode: false });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/(?:application|text)\/xml/i);

  const xml = await response.text();
  const dom = new JSDOM(xml, { contentType: "application/xml" });
  const entries = Array.from(dom.window.document.querySelectorAll("url")).map((entry) => ({
    location: entry.querySelector("loc")?.textContent?.trim() ?? "",
    lastModified: entry.querySelector("lastmod")?.textContent?.trim() ?? "",
  }));
  dom.window.close();
  return entries;
}

for (const path of schemaRoutes) {
  test(`${path} exposes parseable, contact-safe JSON-LD`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, `${path} should expose structured data`).toBeGreaterThan(0);

    for (const block of blocks) {
      const document = JSON.parse(block) as unknown;
      const roots = Array.isArray(document) ? document : [document];
      expect(
        roots.some(
          (root) =>
            root !== null &&
            typeof root === "object" &&
            (root as Record<string, unknown>)["@context"] === "https://schema.org",
        ),
        `${path} JSON-LD must declare https://schema.org`,
      ).toBe(true);

      visitJson(document, (key, child) => {
        if (key === "telephone" && typeof child === "string") {
          expect(child.replace(/\D/g, "")).toBe("918923092563");
        }
        if (key === "email" && typeof child === "string") {
          expect(child.toLowerCase()).toBe("support@audiosen.com");
        }
        if (typeof child === "string") {
          expect(child.toLowerCase()).not.toContain("localhost");
        }
      });
    }
  });
}

test("structured data exposes one canonical LocalBusiness identity to every Service", async ({
  page,
}) => {
  const localBusinessIds: string[] = [];
  const homepageLocalBusinessIds: string[] = [];
  let serviceCount = 0;

  for (const path of ["/", "/contact", "/hearing-aids-dehradun", "/home-hearing-care"] as const) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${path} returned an error response`).toBeLessThan(400);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    for (const block of blocks) {
      const objects = collectJsonObjects(JSON.parse(block) as unknown);
      for (const object of objects) {
        const types = schemaTypes(object["@type"]);
        if (types.includes("LocalBusiness")) {
          expect(typeof object["@id"], `${path} LocalBusiness must have an @id`).toBe("string");
          const id = object["@id"] as string;
          localBusinessIds.push(id);
          if (path === "/") homepageLocalBusinessIds.push(id);
        }

        if (types.includes("Service")) {
          serviceCount += 1;
          expect(
            object.provider,
            `${path} Service must reference the canonical LocalBusiness`,
          ).toMatchObject({ "@id": canonicalOrganizationId });
        }
      }
    }
  }

  expect(
    localBusinessIds.length,
    "a discoverable LocalBusiness entity is required",
  ).toBeGreaterThan(0);
  expect(new Set(localBusinessIds)).toEqual(new Set([canonicalOrganizationId]));
  expect(localBusinessIds).not.toContain(legacyLocalBusinessId);
  expect(homepageLocalBusinessIds).toEqual([canonicalOrganizationId]);
  expect(serviceCount, "the checked routes should expose Service entities").toBeGreaterThan(0);
});

test("local SEO routes use one canonical home-care URL", async ({ page, request, baseURL }) => {
  const redirect = await request.get("/home-hearing-care-dehradun", {
    failOnStatusCode: false,
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(308);
  const location = redirect.headers().location;
  expect(location, "permanent redirect must provide a Location header").toBeTruthy();
  const redirectTarget = new URL(location as string, baseURL ?? "https://audiosen.com");
  expect(redirectTarget.pathname).toBe("/home-hearing-care");
  expect(redirectTarget.search).toBe("");

  const response = await page.goto("/home-hearing-care", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  const canonicalLinks = await page.locator('link[rel="canonical"]').evaluateAll((links) =>
    links.map((link) => (link as HTMLLinkElement).href),
  );
  expect(canonicalLinks).toEqual(["https://audiosen.com/home-hearing-care"]);
});

test("speech search metadata and schema describe enquiry coordination", async ({ page }) => {
  for (const path of [
    "/speech-language-services",
    "/speech-language-services/speech-therapy",
  ] as const) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    expect(await page.title()).toMatch(/Enquir|Support/i);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toMatch(/enquir|support/i);
    expect(description).toMatch(/availability (?:is|are) confirmed/i);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const services = blocks.flatMap((block) =>
      collectJsonObjects(JSON.parse(block) as unknown).filter((object) =>
        schemaTypes(object["@type"]).includes("Service"),
      ),
    );
    expect(services.length, `${path} should expose enquiry Service schema`).toBeGreaterThan(0);
    for (const service of services) {
      expect(service.provider).toMatchObject({ "@id": canonicalOrganizationId });
      expect(`${service.name ?? ""} ${service.serviceType ?? ""}`).toMatch(/enquir/i);
    }
  }
});

test("Dehradun fitting page exposes complete canonical and social metadata", async ({ page }) => {
  const response = await page.goto("/hearing-aid-fitting-dehradun", {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBe(200);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://audiosen.com/hearing-aid-fitting-dehradun",
  );
  for (const selector of [
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:image"]',
    'meta[name="twitter:card"]',
    'meta[name="twitter:title"]',
    'meta[name="twitter:description"]',
    'meta[name="twitter:image"]',
  ] as const) {
    await expect(page.locator(selector), `${selector} should be populated`).toHaveAttribute(
      "content",
      /\S/,
    );
  }
});

test("sitemap lists each required SEO route once with a valid lastmod", async ({ request }) => {
  const response = await request.get("/sitemap.xml", { failOnStatusCode: false });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/(?:application|text)\/xml/i);

  const xml = await response.text();
  const dom = new JSDOM(xml, { contentType: "application/xml" });
  const entries = Array.from(dom.window.document.querySelectorAll("url")).map((entry) => ({
    location: entry.querySelector("loc")?.textContent?.trim() ?? "",
    lastModified: entry.querySelector("lastmod")?.textContent?.trim() ?? "",
  }));
  dom.window.close();

  const locations = entries.map((entry) => entry.location);
  expect(locations.length, "sitemap should not contain duplicate canonical URLs").toBe(
    new Set(locations).size,
  );
  expect(locations).not.toContain("https://audiosen.com/home-hearing-care-dehradun");

  for (const requiredUrl of requiredSitemapUrls) {
    const entry = entries.find((candidate) => candidate.location === requiredUrl);
    expect(entry, `${requiredUrl} is missing from the sitemap`).toBeDefined();
    expect(entry?.lastModified, `${requiredUrl} must expose lastmod`).toMatch(
      /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/,
    );
    const timestamp = Date.parse(entry?.lastModified ?? "");
    expect(Number.isNaN(timestamp), `${requiredUrl} lastmod must be parseable`).toBe(false);
    expect(timestamp, `${requiredUrl} lastmod cannot be in the future`).toBeLessThanOrEqual(
      Date.now(),
    );
  }
});

test("production pages remain indexable and robots.txt advertises the sitemap", async ({
  page,
  request,
}) => {
  for (const path of ["/", "/hearing-aids-dehradun", "/home-hearing-care"] as const) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${path} returned an error response`).toBeLessThan(400);
    expect(
      response?.headers()["x-robots-tag"] ?? "",
      `${path} response must remain indexable`,
    ).not.toMatch(/\b(?:noindex|nofollow)\b/i);

    const metaDirectives = await page
      .locator('meta[name="robots"], meta[name="googlebot"]')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute("content") ?? ""));
    expect(
      metaDirectives.length,
      `${path} should expose explicit robots metadata`,
    ).toBeGreaterThan(0);
    for (const directive of metaDirectives) {
      expect(directive, `${path} metadata must remain indexable`).not.toMatch(
        /\b(?:noindex|nofollow)\b/i,
      );
    }
  }

  const robotsResponse = await request.get("/robots.txt", { failOnStatusCode: false });
  expect(robotsResponse.status()).toBe(200);
  expect(robotsResponse.headers()["content-type"]).toContain("text/plain");
  const robotsBody = await robotsResponse.text();
  expect(robotsBody).toMatch(/^Allow:\s*\/$/im);
  expect(robotsBody).not.toMatch(/^Disallow:\s*\/\s*$/im);
  expect(robotsBody).toMatch(/^Sitemap:\s*https:\/\/audiosen\.com\/sitemap\.xml$/im);
});

test("each rendered document publishes one approved LocalBusiness identity without NAP drift", async ({
  page,
}) => {
  for (const path of schemaRoutes) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${path} returned an error response`).toBeLessThan(400);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const documents = blocks.map((block) => JSON.parse(block) as unknown);
    const objects = documents.flatMap((document) => collectJsonObjects(document));
    const localBusinesses = objects.filter((object) =>
      schemaTypes(object["@type"]).includes("LocalBusiness"),
    );

    expect(localBusinesses, `${path} must publish one LocalBusiness entity`).toHaveLength(1);
    expect(localBusinesses[0]).toMatchObject({
      "@id": canonicalOrganizationId,
      name: approvedBusinessIdentity.name,
      alternateName: approvedBusinessIdentity.descriptor,
      url: `${productionOrigin}/`,
      telephone: approvedBusinessIdentity.telephone,
      email: approvedBusinessIdentity.email,
      address: {
        "@type": "PostalAddress",
        ...approvedBusinessIdentity.address,
      },
    });
    expect(localBusinesses[0]).not.toHaveProperty("openingHours");
    expect(localBusinesses[0]).not.toHaveProperty("openingHoursSpecification");
    expect(localBusinesses[0]).not.toHaveProperty("aggregateRating");
    expect(localBusinesses[0]).not.toHaveProperty("review");

    for (const object of objects) {
      if (typeof object.telephone === "string") {
        expect(object.telephone.replace(/\D/g, ""), `${path} contains a phone-number drift`).toBe(
          approvedBusinessIdentity.telephone.replace(/\D/g, ""),
        );
      }
      if (typeof object.email === "string") {
        expect(object.email.toLowerCase(), `${path} contains an email drift`).toBe(
          approvedBusinessIdentity.email,
        );
      }
      if (schemaTypes(object["@type"]).includes("PostalAddress")) {
        expect(object, `${path} contains an address drift`).toMatchObject(
          approvedBusinessIdentity.address,
        );
      }
      if (schemaTypes(object["@type"]).includes("Service")) {
        expect(object.provider, `${path} Service must use the canonical provider`).toMatchObject({
          "@id": canonicalOrganizationId,
        });
      }
    }

    expect(JSON.stringify(documents)).not.toContain(legacyLocalBusinessId);
  }
});

test("every sitemap URL is a direct, self-canonical, indexable page with unique metadata", async ({
  request,
}) => {
  test.setTimeout(180_000);
  const entries = await readSitemap(request);
  expect(entries.length, "sitemap must contain public SEO routes").toBeGreaterThan(0);

  const locations = entries.map((entry) => entry.location);
  expect(new Set(locations).size, "sitemap locations must be unique").toBe(locations.length);

  for (const entry of entries) {
    const location = new URL(entry.location);
    expect(location.origin, `${entry.location} must use the production origin`).toBe(productionOrigin);
    expect(location.username, `${entry.location} must not include credentials`).toBe("");
    expect(location.password, `${entry.location} must not include credentials`).toBe("");
    expect(location.search, `${entry.location} must not include a query`).toBe("");
    expect(location.hash, `${entry.location} must not include a fragment`).toBe("");
    expect(entry.lastModified, `${entry.location} must expose a genuine lastmod`).toMatch(
      /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/,
    );
    const timestamp = Date.parse(entry.lastModified);
    expect(Number.isNaN(timestamp), `${entry.location} lastmod must be parseable`).toBe(false);
    expect(timestamp, `${entry.location} lastmod cannot be in the future`).toBeLessThanOrEqual(
      Date.now(),
    );
  }

  type PageMetadataRecord = {
    location: string;
    title: string;
    description: string;
    openGraphUrl: string;
  };
  const records: PageMetadataRecord[] = [];
  const failures: string[] = [];
  const batchSize = 6;

  for (let index = 0; index < entries.length; index += batchSize) {
    const batch = entries.slice(index, index + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (entry): Promise<PageMetadataRecord | null> => {
        const url = new URL(entry.location);
        const response = await request.get(`${url.pathname}${url.search}`, {
          failOnStatusCode: false,
          maxRedirects: 0,
          headers: { "user-agent": "Googlebot" },
        });
        const status = response.status();
        if (status !== 200) {
          failures.push(`${entry.location} returned ${status} instead of a direct 200`);
          await response.dispose();
          return null;
        }
        if (!(response.headers()["content-type"] ?? "").includes("text/html")) {
          failures.push(`${entry.location} did not return HTML`);
          await response.dispose();
          return null;
        }
        if (/\b(?:noindex|nofollow)\b/i.test(response.headers()["x-robots-tag"] ?? "")) {
          failures.push(`${entry.location} has a blocking X-Robots-Tag`);
        }

        const html = await response.text();
        const dom = new JSDOM(html, { url: entry.location });
        const document = dom.window.document;
        const context = entry.location;

        const canonicalLinks = Array.from(
          document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'),
        );
        expect(canonicalLinks, `${context} must expose exactly one canonical`).toHaveLength(1);
        expect(new URL(canonicalLinks[0]?.href ?? "", entry.location).toString()).toBe(
          entry.location,
        );

        const robotDirectives = Array.from(
          document.querySelectorAll<HTMLMetaElement>(
            'meta[name="robots"], meta[name="googlebot"]',
          ),
        ).map((meta) => meta.content);
        expect(robotDirectives.length, `${context} must expose robots metadata`).toBeGreaterThan(0);
        for (const directive of robotDirectives) {
          expect(directive, `${context} must be indexable and followed`).not.toMatch(
            /\b(?:noindex|nofollow)\b/i,
          );
        }

        const titleElements = Array.from(document.querySelectorAll("title"));
        expect(titleElements, `${context} must expose exactly one title`).toHaveLength(1);
        const title = titleElements[0]?.textContent?.trim() ?? "";
        expect(title, `${context} title must not be empty`).not.toBe("");
        const description = singleMetaContent(
          document,
          'meta[name="description"]',
          context,
        );
        singleMetaContent(document, 'meta[property="og:title"]', context);
        singleMetaContent(document, 'meta[property="og:description"]', context);
        const openGraphUrl = singleMetaContent(
          document,
          'meta[property="og:url"]',
          context,
        );
        expect(new URL(openGraphUrl, entry.location).toString()).toBe(entry.location);

        dom.window.close();
        return { location: entry.location, title, description, openGraphUrl };
      }),
    );
    records.push(
      ...batchResults.filter((record): record is PageMetadataRecord => record !== null),
    );
  }

  expect(failures, failures.join("\n")).toEqual([]);
  expect(records).toHaveLength(entries.length);
  for (const field of ["title", "description", "openGraphUrl"] as const) {
    const values = records.map((record) => record[field].trim().toLowerCase());
    const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
    expect(
      duplicates,
      `sitemap pages must have unique ${field} values: ${duplicates.join(", ")}`,
    ).toEqual([]);
  }
});

test("unapproved and form-only routes stay out of the sitemap but remain crawlable for noindex", async ({
  request,
}) => {
  test.setTimeout(90_000);
  const sitemapLocations = new Set((await readSitemap(request)).map((entry) => entry.location));

  for (const path of defaultNoindexRoutes) {
    expect(
      sitemapLocations.has(`${productionOrigin}${path}`),
      `${path} must not be submitted for indexing`,
    ).toBe(false);

    const response = await request.get(path, {
      failOnStatusCode: false,
      maxRedirects: 0,
      headers: { "user-agent": "Googlebot" },
    });
    expect(response.status(), `${path} must remain available without a redirect`).toBe(200);
    const html = await response.text();
    const dom = new JSDOM(html, { url: `${productionOrigin}${path}` });
    const directives = Array.from(
      dom.window.document.querySelectorAll<HTMLMetaElement>(
        'meta[name="robots"], meta[name="googlebot"]',
      ),
    ).map((meta) => meta.content);
    expect(directives.length, `${path} must expose an explicit noindex`).toBeGreaterThan(0);
    for (const directive of directives) {
      expect(directive, `${path} must remain noindex`).toMatch(/\bnoindex\b/i);
    }
    dom.window.close();
  }
});

test("production robots rules protect only private surfaces and leave noindex pages crawlable", async ({
  request,
}) => {
  const response = await request.get("/robots.txt", { failOnStatusCode: false });
  expect(response.status()).toBe(200);
  const body = await response.text();

  expect(directiveValues(body, "User-Agent")).toEqual(["*"]);
  expect(directiveValues(body, "Allow")).toEqual(["/"]);
  const disallowedPrefixes = directiveValues(body, "Disallow").sort();
  expect(disallowedPrefixes).toEqual(["/admin", "/api"]);
  for (const privatePath of ["/admin", "/admin/sign-in", "/api", "/api/health"] as const) {
    expect(
      disallowedPrefixes.some((prefix) => privatePath.startsWith(prefix)),
      `${privatePath} must match a private robots prefix`,
    ).toBe(true);
  }
  expect(directiveValues(body, "Sitemap")).toEqual([`${productionOrigin}/sitemap.xml`]);
  expect(directiveValues(body, "Host")).toEqual([productionOrigin]);
  expect(body).not.toMatch(/^Disallow:\s*\/(?:care-plans|hearing-aid-repair|offers|review)/im);
});

for (const { path, titleTerms, descriptionTerms } of prioritySearchRoutes) {
  test(`${path} metadata matches its approved organic-search intent`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    const title = await page.title();
    const description =
      (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    for (const term of titleTerms) expect(title).toMatch(term);
    for (const term of descriptionTerms) expect(description).toMatch(term);

    const canonical = `${productionOrigin}${path}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
    for (const selector of [
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ] as const) {
      await expect(page.locator(selector), `${path} ${selector} must be populated`).toHaveAttribute(
        "content",
        /\S/,
      );
    }
  });
}
