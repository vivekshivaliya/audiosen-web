// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookServicePopup } from "@/components/book-service-popup";

const pathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => pathname(),
}));

vi.mock("@/components/contact-form", () => ({
  ContactForm: () => <form aria-label="Hearing-care callback form" />,
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

describe("BookServicePopup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pathname.mockReturnValue("/");
    window.sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ turnstileSiteKey: "0x4AAAAA-test-key" }),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("opens once after five seconds only after Turnstile configuration is available", async () => {
    render(<BookServicePopup />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_999);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByRole("dialog", { name: /start your hearing care request/i })).toBeInTheDocument();
    expect(window.sessionStorage.getItem("audiosen_book_service_popup_seen_v1")).toBe("true");
  });

  it("does not automatically open on admin or thank-you pages", async () => {
    pathname.mockReturnValue("/admin/catalog");
    const { rerender } = render(<BookServicePopup />);
    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    pathname.mockReturnValue("/thank-you");
    rerender(<BookServicePopup />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
