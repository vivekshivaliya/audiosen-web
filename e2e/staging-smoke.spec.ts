import { expect, test } from "@playwright/test";

test("health and critical public pages are ready without submitting enquiries", async ({
  page,
  request,
}) => {
  const health = await request.get("/api/health", { failOnStatusCode: false });
  expect(health.status()).toBe(200);
  expect(await health.json()).toMatchObject({
    ok: true,
    service: "audiosen-web",
    deployment: "staging",
  });
  expect(health.headers()["cache-control"]).toContain("no-store");
  expect(health.headers()["x-robots-tag"]).toMatch(/\bnoindex\b/i);
  expect(health.headers()["x-robots-tag"]).toMatch(/\bnofollow\b/i);

  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.name));

  for (const path of ["/", "/contact", "/book-consultation", "/hearing-aids-india"] as const) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${path} returned an error`).toBeLessThan(400);
    expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response?.headers()["x-frame-options"]).toBe("DENY");
    expect(
      response?.headers()["x-robots-tag"] ?? "",
      `${path} must remain noindex on staging`,
    ).toMatch(/\bnoindex\b/i);
    expect(
      response?.headers()["x-robots-tag"] ?? "",
      `${path} must remain nofollow on staging`,
    ).toMatch(/\bnofollow\b/i);
    await expect(page.locator("h1:visible").first()).toBeVisible();

    const metaDirectives = await page
      .locator('meta[name="robots"], meta[name="googlebot"]')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute("content") ?? ""));
    expect(metaDirectives.length, `${path} should expose robots metadata`).toBeGreaterThan(0);
    for (const directive of metaDirectives) {
      expect(directive, `${path} robots metadata must remain noindex`).toMatch(/\bnoindex\b/i);
      expect(directive, `${path} robots metadata must remain nofollow`).toMatch(/\bnofollow\b/i);
    }
  }

  const robotsResponse = await request.get("/robots.txt", { failOnStatusCode: false });
  expect(robotsResponse.status()).toBe(200);
  const robotsBody = await robotsResponse.text();
  expect(robotsBody).toMatch(/^Disallow:\s*\/\s*$/im);
  expect(robotsBody).not.toMatch(/^Allow:\s*\/$/im);
  expect(robotsBody).not.toMatch(/^Sitemap:/im);

  expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);
});
