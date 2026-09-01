"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContactForm } from "@/components/contact-form";
import { trackEvent } from "@/lib/analytics";
import { BOOK_SERVICE_POPUP_EVENT } from "@/lib/book-service-popup";

const BOOK_SERVICE_POPUP_SEEN_KEY = "audiosen_book_service_popup_seen_v1";
const POPUP_DELAY_MS = 5_000;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function BookServicePopup() {
  const pathname = usePathname();
  const modalRootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [turnstileConfigured, setTurnstileConfigured] = useState<boolean | null>(null);

  const rememberPopupSeen = useCallback(() => {
    try {
      window.sessionStorage.setItem(BOOK_SERVICE_POPUP_SEEN_KEY, "true");
    } catch {
      // Session storage can be unavailable in some privacy modes.
    }
  }, []);

  const openPopup = useCallback(() => {
    rememberPopupSeen();
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && !dialogRef.current?.contains(activeElement)) {
      previousFocusRef.current = activeElement;
    }
    setOpen(true);
  }, [rememberPopupSeen]);

  const closePopup = useCallback(() => {
    rememberPopupSeen();

    trackEvent("popup_close", {
      popup_name: "book_service",
      page_path: typeof window !== "undefined" ? window.location.pathname : "unknown",
    });
    setOpen(false);
  }, [rememberPopupSeen]);

  useEffect(() => {
    const openFromEvent = () => openPopup();

    window.addEventListener(BOOK_SERVICE_POPUP_EVENT, openFromEvent);

    return () => {
      window.removeEventListener(BOOK_SERVICE_POPUP_EVENT, openFromEvent);
    };
  }, [openPopup]);

  useEffect(() => {
    let active = true;

    void fetch("/api/public-config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Public configuration unavailable");
        const payload = (await response.json()) as { turnstileSiteKey?: unknown };
        return typeof payload.turnstileSiteKey === "string" && payload.turnstileSiteKey.trim().length > 0;
      })
      .then((configured) => {
        if (active) setTurnstileConfigured(configured);
      })
      .catch(() => {
        if (active) setTurnstileConfigured(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const isPublicCustomerRoute = !pathname.startsWith("/admin") && !pathname.startsWith("/thank-you");
    if (!isPublicCustomerRoute || turnstileConfigured !== true) return;

    let hasSeenPopup = false;
    try {
      hasSeenPopup = window.sessionStorage.getItem(BOOK_SERVICE_POPUP_SEEN_KEY) === "true";
    } catch {
      hasSeenPopup = false;
    }

    if (hasSeenPopup) return;

    const timer = window.setTimeout(openPopup, POPUP_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [openPopup, pathname, turnstileConfigured]);

  useEffect(() => {
    if (!open) return;

    trackEvent("popup_open", {
      popup_name: "book_service",
      page_path: window.location.pathname,
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const modalRoot = modalRootRef.current;
    const backgroundState = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement &&
          element !== modalRoot &&
          !element.contains(modalRoot),
      )
      .map((element) => ({
        element,
        inert: element.inert,
        ariaHidden: element.getAttribute("aria-hidden"),
      }));

    for (const { element } of backgroundState) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePopup();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.hasAttribute("hidden") &&
          element.getClientRects().length > 0,
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstElement || !dialog.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);

      for (const { element, inert, ariaHidden } of backgroundState) {
        element.inert = inert;
        if (ariaHidden === null) {
          element.removeAttribute("aria-hidden");
        } else {
          element.setAttribute("aria-hidden", ariaHidden);
        }
      }

      const previousFocus = previousFocusRef.current;
      previousFocusRef.current = null;
      window.requestAnimationFrame(() => {
        if (previousFocus?.isConnected) previousFocus.focus();
      });
    };
  }, [closePopup, open]);

  if (!open) return null;

  return (
    <div
      ref={modalRootRef}
      id="book-service-modal-root"
      className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-5 sm:px-6"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close book service popup"
        className="absolute inset-0 bg-slate-950/58 backdrop-blur-sm"
        onClick={closePopup}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-service-popup-title"
        aria-describedby="book-service-popup-description"
        tabIndex={-1}
        className="relative flex max-h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_90px_-44px_rgba(4,28,58,0.88)] outline-none"
        style={{ width: "min(64rem, calc(100vw - 2rem))" }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close book service popup"
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          onClick={closePopup}
        >
          X
        </button>

        <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-[#071c33] px-6 py-8 text-white sm:px-8 lg:px-10 lg:py-10">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white">
              <Image
                src="/audiosen-logo-mark.png"
                alt="Audiosen logo mark"
                fill
                sizes="64px"
                className="object-cover object-top"
                priority
              />
            </div>

            <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-200">
              Book Service
            </p>
            <h2
              id="book-service-popup-title"
              className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl"
            >
              Start your hearing care request.
            </h2>
            <p id="book-service-popup-description" className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
              Share your concern and our team will help with hearing tests, hearing aid guidance,
              fitting, repair, or service support.
            </p>

            <div className="mt-7 grid gap-3 text-sm font-semibold text-slate-100">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                Enquiries accepted from across India
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                In-person scope confirmed before booking
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                No payment is taken through this form
              </div>
            </div>
          </div>

          <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <ContactForm surface="plain" />
          </div>
        </div>
      </div>
    </div>
  );
}
