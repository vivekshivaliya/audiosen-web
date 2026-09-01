import { expect, test } from "@playwright/test";

test("consultation enquiry posts the canonical contract and follows a safe thank-you URL", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("audiosen_book_service_popup_seen_v1", "true");
    window.turnstile = {
      render: (_container, options) => {
        window.setTimeout(() => options.callback("test-turnstile-token"), 0);
        return "test-turnstile-widget";
      },
      reset: () => undefined,
      remove: () => undefined,
    };
  });
  await page.route("**/api/public-config", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ turnstileSiteKey: "test-turnstile-site-key" }),
    });
  });
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `window.turnstile = {
        render: function (_container, options) {
          window.setTimeout(function () { options.callback("test-turnstile-token"); }, 0);
          return "test-turnstile-widget";
        },
        reset: function () {},
        remove: function () {}
      };`,
    });
  });

  let resolveSubmission!: (value: { body: Record<string, unknown>; idempotencyKey: string }) => void;
  const submission = new Promise<{ body: Record<string, unknown>; idempotencyKey: string }>(
    (resolve) => {
      resolveSubmission = resolve;
    },
  );

  await page.route("**/api/enquiries", async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as Record<string, unknown>;
    resolveSubmission({
      body,
      idempotencyKey: request.headers()["idempotency-key"] || "",
    });
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      headers: { "Cache-Control": "no-store" },
      body: JSON.stringify({
        ok: true,
        reference: "AUD-20260822-ABCDEFGH",
        referenceId: "AUD-20260822-ABCDEFGH",
        redirectTo: "/thank-you",
        thankYouUrl: "/thank-you",
        deduplicated: false,
      }),
    });
  });

  await page.goto("/book-consultation", { waitUntil: "networkidle" });
  const enquiryForm = page
    .locator("main form")
    .filter({ has: page.getByRole("button", { name: "Send Consultation Request" }) })
    .first();
  await expect(enquiryForm).toBeVisible();

  await enquiryForm.getByLabel("Full name").fill("Accessibility Test Patient");
  await enquiryForm.getByLabel("Phone or WhatsApp").fill("8923092563");
  await enquiryForm
    .getByLabel("Email for confirmation", { exact: true })
    .fill("patient@example.com");
  await enquiryForm.getByLabel("City").fill("Dehradun");
  await enquiryForm.getByLabel("Patient age group").selectOption("adult");
  await enquiryForm
    .getByLabel("Additional details (optional)")
    .fill("Please call after 4 PM.");
  const consent = enquiryForm.getByRole("checkbox", {
    name: /I agree to the Privacy Policy/,
  });
  await consent.check({ force: true, timeout: 5_000 });
  await expect(consent).toBeChecked();
  // WebKit can complete the first DOM fill while React is still committing streamed hydration.
  // Reasserting the first controlled field also proves the hydrated form owns its final value.
  await enquiryForm.getByLabel("Full name").fill("Accessibility Test Patient");
  await expect(enquiryForm.getByLabel("Full name")).toHaveValue("Accessibility Test Patient");
  const invalidFields = await enquiryForm.evaluate((form) =>
    Array.from((form as HTMLFormElement).elements)
      .filter(
        (field): field is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement,
      )
      .filter((field) => field.willValidate && !field.checkValidity())
      .map((field) => field.id || field.name || field.type),
  );
  expect(invalidFields, "the browser should accept every required field").toEqual([]);
  const submitButton = enquiryForm.getByRole("button", {
    name: "Send Consultation Request",
  });
  await expect(submitButton).toBeEnabled({ timeout: 10_000 });
  // The fixed mobile CTA can overlap the submit button at narrow viewport heights.
  // Keyboard activation exercises the native submit path without relying on pointer coordinates.
  await submitButton.press("Enter");

  const posted = await submission;
  expect(posted.idempotencyKey).toMatch(/^[A-Za-z0-9._:-]{8,200}$/);
  expect(posted.body).toMatchObject({
    type: "appointment",
    name: "Accessibility Test Patient",
    phone: "8923092563",
    email: "patient@example.com",
    city: "Dehradun",
    ageGroup: "adult",
    service: "general-hearing-consultation",
    consent: true,
    sourcePath: "/book-consultation",
    context: {
      sourcePath: "/book-consultation",
      journey: "book_consultation",
    },
  });

  await page.waitForURL("**/thank-you");
  await expect(
    page.getByRole("heading", { level: 1, name: "Thank You for Choosing Audiosen" }),
  ).toBeVisible();
});
