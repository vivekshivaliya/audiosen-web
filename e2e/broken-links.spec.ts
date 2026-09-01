import { JSDOM } from "jsdom";
import { expect, test, type APIRequestContext } from "@playwright/test";

const MAX_PAGES = 400;
const BATCH_SIZE = 8;

type CrawlEntry = { url: string; source: string };
type CrawlResult = { links: string[]; failure?: string };

function normalizedSameOriginUrl(value: string, base: string, origin: string): string | null {
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return null;
  }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.origin !== origin) {
    return null;
  }
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/admin" ||
    url.pathname.startsWith("/admin/")
  ) {
    return null;
  }
  url.hash = "";
  url.search = "";
  return url.toString();
}

async function crawlOne(
  request: APIRequestContext,
  entry: CrawlEntry,
  origin: string,
): Promise<CrawlResult> {
  try {
    const response = await request.get(entry.url, {
      failOnStatusCode: false,
      maxRedirects: 5,
      timeout: 15_000,
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    const status = response.status();
    const finalUrl = response.url();
    if (status >= 400) {
      await response.dispose();
      return { links: [], failure: `${status} ${entry.url} (linked from ${entry.source})` };
    }
    if (new URL(finalUrl).origin !== origin) {
      await response.dispose();
      return {
        links: [],
        failure: `same-origin URL redirected externally: ${entry.url} -> ${finalUrl}`,
      };
    }
    if (!(response.headers()["content-type"] || "").includes("text/html")) {
      await response.dispose();
      return { links: [] };
    }

    const html = await response.text();
    await response.dispose();
    const document = new JSDOM(html, { url: finalUrl }).window.document;
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .map((anchor) => normalizedSameOriginUrl(anchor.getAttribute("href") || "", finalUrl, origin))
      .filter((url): url is string => Boolean(url));
    return { links };
  } catch (error) {
    const errorType = error instanceof Error ? error.name : "UnknownError";
    return { links: [], failure: `${errorType} ${entry.url} (linked from ${entry.source})` };
  }
}

test("same-origin public links resolve without HTTP errors", async ({ request, baseURL }) => {
  test.setTimeout(180_000);
  if (!baseURL) throw new Error("Playwright baseURL is required for the link crawler.");
  const origin = new URL(baseURL).origin;
  const startUrl = new URL("/", origin).toString();
  const queued = new Set([startUrl]);
  const visited = new Set<string>();
  const failures: string[] = [];
  const queue: CrawlEntry[] = [{ url: startUrl, source: "crawl root" }];

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const batch: CrawlEntry[] = [];
    while (queue.length > 0 && batch.length < BATCH_SIZE && visited.size + batch.length < MAX_PAGES) {
      const entry = queue.shift();
      if (!entry || visited.has(entry.url)) continue;
      batch.push(entry);
    }
    if (batch.length === 0) break;
    batch.forEach((entry) => visited.add(entry.url));

    const results = await Promise.all(
      batch.map(async (entry) => ({ entry, result: await crawlOne(request, entry, origin) })),
    );
    for (const { entry, result } of results) {
      if (result.failure) failures.push(result.failure);
      for (const url of result.links) {
        if (queued.has(url)) continue;
        queued.add(url);
        queue.push({ url, source: entry.url });
      }
    }
  }

  if (queue.length > 0) {
    failures.push(`crawl exceeded the ${MAX_PAGES}-page safety limit`);
  }
  expect(visited.size, "crawler should discover a representative public route set").toBeGreaterThan(20);
  expect(failures, failures.join("\n")).toEqual([]);
});
