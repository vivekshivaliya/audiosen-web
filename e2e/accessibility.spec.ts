import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const accessibilityRoutes = [
  "/",
  "/contact",
  "/book-consultation",
  "/hearing-aids-india",
  "/privacy-policy",
] as const;

for (const path of accessibilityRoutes) {
  test(`${path} has no WCAG A/AA axe violations`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("main:visible").first()).toBeVisible();
    await expect(page.locator("h1:visible").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const summary = results.violations
      .map(
        (violation) =>
          `${violation.id} (${violation.impact || "unknown"}): ${violation.nodes
            .map((node) => node.target.join(" "))
            .join(", ")}`,
      )
      .join("\n");

    expect(results.violations, summary).toEqual([]);
  });
}
