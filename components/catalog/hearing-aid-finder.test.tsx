// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HearingAidFinder } from "@/components/catalog/hearing-aid-finder";
import type { CatalogSnapshot } from "@/lib/catalog/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const snapshot: CatalogSnapshot = {
  mode: "published",
  brands: [
    {
      slug: "phonak",
      name: "Phonak",
      summary: "Approved test brand",
      logoPath: "/brands/phonak.svg",
      publication: { status: "owner-approved", note: "Approved for this test" },
      source: {
        kind: "manufacturer",
        label: "Manufacturer source",
        url: "https://manufacturer.example/phonak",
        checkedAt: "2026-08-22",
      },
      mediaRights: {
        rightsStatus: "pending",
        publicUseApproved: false,
        rightsNote: "Withheld in this test",
      },
    },
  ],
  models: [
    {
      key: "phonak~verified-model",
      slug: "verified-model",
      brandSlug: "phonak",
      name: "Verified Model",
      style: "ric",
      summary: "A source-verified test model.",
      isFeatured: false,
      features: {
        rechargeable: "yes",
        bluetoothStreaming: "yes",
        auracast: "unknown",
        appControl: "unknown",
        crosSupport: "unknown",
        pediatricPath: "no",
        powerFormat: "unknown",
        customFit: "unknown",
      },
      publication: { status: "owner-approved", note: "Approved for this test" },
      verification: {
        status: "owner-source-confirmed",
        note: "Confirmed for this test",
        checkedAt: "2026-08-22",
      },
      source: {
        kind: "manufacturer",
        label: "Manufacturer model source",
        url: "https://manufacturer.example/verified-model",
        checkedAt: "2026-08-22",
      },
      media: {
        assetPath: "/withheld.webp",
        alt: "Withheld test model",
        rightsStatus: "pending",
        publicUseApproved: false,
        rightsNote: "Withheld in this test",
      },
    },
  ],
};

function fillRequiredFinderAnswers(age: "adult" | "child") {
  fireEvent.change(screen.getByLabelText("Who is this enquiry for?"), {
    target: { value: age },
  });
  fireEvent.change(screen.getByLabelText("Do they currently use a hearing aid?"), {
    target: { value: "no" },
  });
  fireEvent.change(screen.getByLabelText("City (optional at this step)"), {
    target: { value: "Sensitive Test City" },
  });
  fireEvent.change(screen.getByLabelText("Brand"), { target: { value: "phonak" } });
  fireEvent.change(screen.getByLabelText("Charging preference"), {
    target: { value: "rechargeable" },
  });
  fireEvent.change(screen.getByLabelText("Streaming preference"), {
    target: { value: "important" },
  });
  fireEvent.change(screen.getByLabelText("Main listening routine"), {
    target: { value: "conversation-groups" },
  });
  fireEvent.change(screen.getByLabelText("Visibility and handling preference"), {
    target: { value: "discreet" },
  });
  fireEvent.change(screen.getByLabelText("Budget band (preference only)"), {
    target: { value: "50000-100000" },
  });
  fireEvent.change(screen.getByLabelText("Would a home visit be preferred?"), {
    target: { value: "yes" },
  });
}

beforeEach(() => {
  window.history.replaceState({}, "", "/find-my-hearing-aid");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: true }),
  });
  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("hearing-aid finder privacy", () => {
  it("keeps adult answers out of the URL while preserving verified scoring", () => {
    const { container } = render(<HearingAidFinder snapshot={snapshot} />);
    const preferenceForm = container.querySelector('form[action="/find-my-hearing-aid"]');
    expect(preferenceForm?.querySelectorAll("[name]")).toHaveLength(0);
    fillRequiredFinderAnswers("adult");
    fireEvent.click(screen.getByRole("button", { name: "Complete the preference path" }));

    expect(screen.getByText("Rank 1")).toBeInTheDocument();
    expect(screen.getByText(/3 verified preference matches/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe("/find-my-hearing-aid");
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("#finder-results");
    expect(window.location.href).not.toContain("Sensitive");
    expect(window.location.href).not.toContain("budget");
    expect(window.location.href).not.toContain("home_visit");
  });

  it("removes legacy query state and preserves the pediatric no-ranking path", async () => {
    window.history.replaceState(
      {},
      "",
      "/find-my-hearing-aid?age=child&city=Sensitive+Test+City&budget=over-200000",
    );
    render(<HearingAidFinder snapshot={snapshot} />);
    await waitFor(() => expect(window.location.search).toBe(""));

    fillRequiredFinderAnswers("child");
    fireEvent.click(screen.getByRole("button", { name: "Complete the preference path" }));

    expect(
      screen.getByRole("heading", { name: "Use an age-appropriate clinical pathway" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Rank 1")).not.toBeInTheDocument();
    expect(
      screen.getByText(/I am the patient's parent or legal guardian/i),
    ).toBeInTheDocument();
    expect(window.location.search).toBe("");
    expect(window.location.href).not.toContain("Sensitive");
  });
});
