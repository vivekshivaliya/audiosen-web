"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { BOOK_SERVICE_POPUP_EVENT } from "@/lib/book-service-popup";
import { navLinks } from "@/lib/content";

const offerTapeItems = [
  "Ask about current hearing-aid savings",
  "A model-specific written quote confirms eligibility",
  "Stock, fitting, warranty, validity, and exclusions apply",
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  function openBookServicePopup() {
    window.dispatchEvent(new Event(BOOK_SERVICE_POPUP_EVENT));
    setOpen(false);
  }

  return (
    <header className="site-header-sonic sticky top-0 z-50">
      <div className="offer-marquee" role="region" aria-label="Hearing-aid savings information">
        <div className="offer-marquee-track">
          {offerTapeItems.map((item) => (
            <Link key={item} href="/offers/50-percent-off" className="offer-marquee-item">
              {item}
            </Link>
          ))}
        </div>
      </div>

      <div className="sonic-nav-shell mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8">
        <BrandLockup />

        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="sonic-menu-button inline-flex min-h-11 min-w-11 items-center justify-center px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <nav className="sonic-desktop-nav hidden items-center gap-4 lg:flex">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-700 transition hover:text-slate-900 xl:text-[12px]"
            >
              {item.label}
            </Link>
          ))}
          <button type="button" className="premium-button-primary" onClick={openBookServicePopup}>
            Book Service
          </button>
        </nav>
      </div>

      {open ? (
        <nav id="mobile-navigation" className="sonic-mobile-nav px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className="premium-button-primary mt-1 text-sm"
              onClick={openBookServicePopup}
            >
              Book Service
            </button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
