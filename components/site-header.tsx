"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { navLinks } from "@/lib/content";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <BrandLockup />

        <button
          type="button"
          aria-label="Toggle navigation"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-300 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <nav className="hidden items-center gap-4 lg:flex">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-700 transition hover:text-slate-900 xl:text-[12px]"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/#contact" className="premium-button-primary">
            Book Service
          </Link>
        </nav>
      </div>

      {open ? (
        <nav className="border-t border-slate-200 bg-white/95 px-4 py-4 lg:hidden">
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
            <Link
              href="/#contact"
              className="premium-button-primary mt-1 text-sm"
              onClick={() => setOpen(false)}
            >
              Book Service
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
