// @vitest-environment jsdom

import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProgramUnavailable } from "@/components/program-unavailable";

afterEach(cleanup);

describe("public unavailable-state accessibility", () => {
  it("exposes useful headings, actions, and no automated axe violations", async () => {
    const { container } = render(
      <ProgramUnavailable
        eyebrow="Availability check"
        title="This programme is not published yet"
        description="Contact Audiosen to ask about currently approved options."
        checks={["Written terms", "Approved services", "Current eligibility"]}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "This programme is not published yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ask for Current Options" })).toHaveAttribute(
      "href",
      "/book-consultation",
    );

    const results = await axe.run(container, {
      // jsdom cannot calculate rendered styles; browser-level axe tests cover contrast.
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
