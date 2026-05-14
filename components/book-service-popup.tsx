"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContactForm } from "@/components/contact-form";
import { BOOK_SERVICE_POPUP_EVENT } from "@/lib/book-service-popup";

const BOOK_SERVICE_POPUP_SEEN_KEY = "audiosen_book_service_popup_seen_v1";

export function BookServicePopup() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const closePopup = useCallback(() => {
    try {
      window.sessionStorage.setItem(BOOK_SERVICE_POPUP_SEEN_KEY, "true");
    } catch {
      // Session storage can be unavailable in some privacy modes.
    }

    setOpen(false);
  }, []);

  useEffect(() => {
    const openFromEvent = () => setOpen(true);

    window.addEventListener(BOOK_SERVICE_POPUP_EVENT, openFromEvent);

    return () => {
      window.removeEventListener(BOOK_SERVICE_POPUP_EVENT, openFromEvent);
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    let hasSeenPopup = false;
    try {
      hasSeenPopup = window.sessionStorage.getItem(BOOK_SERVICE_POPUP_SEEN_KEY) === "true";
    } catch {
      hasSeenPopup = false;
    }

    if (hasSeenPopup) return;

    const timer = window.setTimeout(() => setOpen(true), 550);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopup();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => dialogRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePopup, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-5 sm:px-6">
      <button
        type="button"
        aria-label="Close book service popup"
        className="absolute inset-0 bg-slate-950/58 backdrop-blur-sm"
        onClick={closePopup}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-service-popup-title"
        tabIndex={-1}
        className="relative flex max-h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_90px_-44px_rgba(4,28,58,0.88)] outline-none"
        style={{ width: "min(64rem, calc(100vw - 2rem))" }}
      >
        <button
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
            <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
              Share your concern and our team will help with hearing tests, hearing aid guidance,
              fitting, repair, or service support.
            </p>

            <div className="mt-7 grid gap-3 text-sm font-semibold text-slate-100">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                Dehradun clinic support
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                All India service guidance
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                Reply within 24 hours
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
