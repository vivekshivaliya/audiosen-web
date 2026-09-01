import { expect, test, type Page } from "@playwright/test";

const criticalRoutes = [
  "/",
  "/contact",
  "/book-consultation",
  "/hearing-aids-india",
  "/hearing-aid-repair",
] as const;

async function expectResponsiveDocument(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response, `${path} did not return a document response`).not.toBeNull();
  expect(response?.status(), `${path} returned an error response`).toBeLessThan(400);
  await expect(page.locator("main:visible").first()).toBeVisible();
  await expect(page.locator("h1:visible").first()).toBeVisible({ timeout: 20_000 });

  const horizontalScroll = await page.evaluate(() => {
    const originalX = window.scrollX;
    window.scrollTo(document.documentElement.scrollWidth, window.scrollY);
    const reachableX = window.scrollX;
    window.scrollTo(originalX, window.scrollY);
    return reachableX;
  });
  expect(horizontalScroll, `${path} allows horizontal viewport scrolling`).toBeLessThanOrEqual(1);
}

test("critical public routes render at the configured browser and viewport", async ({ page }) => {
  for (const path of criticalRoutes) {
    await test.step(path, () => expectResponsiveDocument(page, path));
  }
});

test("public contact actions use the approved phone number", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('a[href="tel:+918923092563"]').first()).toBeAttached();
  await expect(page.locator('a[href*="wa.me/918923092563"]').first()).toBeAttached();
});

test("nonce-bearing gated responses execute under their response CSP", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-390", "One browser is enough for CSP nonce wiring.");
  const cspErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /content security policy|refused to (?:load|execute)/i.test(message.text())
    ) {
      cspErrors.push(message.text());
    }
  });

  const response = await page.goto("/hearing-aids", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("h1:visible").first()).toBeVisible();

  const policy = response?.headers()["content-security-policy"] || "";
  expect(policy).not.toContain("googletagmanager.com");
  expect(policy).not.toContain("google-analytics.com");
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()) {
    expect(policy).toContain("challenges.cloudflare.com");
  } else {
    expect(policy).not.toContain("challenges.cloudflare.com");
  }
  const responseNonce = policy.match(/'nonce-([^']+)'/)?.[1];
  expect(responseNonce, "response CSP must contain a nonce").toBeTruthy();
  const documentNonces = await page.locator("script[nonce]").evaluateAll((scripts) =>
    scripts.map((script) => (script as HTMLScriptElement).nonce).filter(Boolean),
  );
  expect(documentNonces.length, "document must contain nonce-bearing scripts").toBeGreaterThan(0);
  expect(new Set(documentNonces)).toEqual(new Set([responseNonce]));
  expect(cspErrors, cspErrors.join("\n")).toEqual([]);
});

test("prefetch headers cannot bypass catalog media publication gates", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-390", "One request covers the proxy invariant.");
  const response = await request.get("/images/products/phonak/audeo-sphere-infinio.png", {
    failOnStatusCode: false,
    headers: {
      Purpose: "prefetch",
      "next-router-prefetch": "1",
    },
  });

  expect(response.status()).toBe(404);
  expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");

  const brandResponse = await request.get("/brands/phonak.svg", { failOnStatusCode: false });
  expect(brandResponse.status()).toBe(404);
  expect(brandResponse.headers()["x-robots-tag"]).toBe("noindex, nofollow");

  for (const encodedPath of [
    "/images%2Fproducts%2Fphonak%2Faudeo-sphere-infinio.png",
    "/images/%70roducts/phonak/audeo-sphere-infinio.png",
    "/images%25252Fproducts%25252Fphonak%25252Faudeo-sphere-infinio.png",
    "/brands%2Fphonak.svg",
    "/_next/image?url=%252Fimages%252Fproducts%252Fphonak%252Faudeo-sphere-infinio.png&w=640&q=75",
  ]) {
    const encodedResponse = await request.get(encodedPath, { failOnStatusCode: false });
    expect(encodedResponse.status(), encodedPath).toBe(404);
    expect(encodedResponse.headers()["x-robots-tag"], encodedPath).toBe("noindex, nofollow");
  }
});
