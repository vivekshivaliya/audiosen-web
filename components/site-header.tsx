"use client";

import Link from "next/link";
import { useState } from "react";
import { navLinks } from "@/lib/content";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900"
        >
          <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-r from-sky-700 to-teal-500" />
          Audiosen.
        </Link>

        <button
          type="button"
          aria-label="Toggle navigation"
          className="inline-flex min-w-11 items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            className="rounded-full border border-sky-700 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-700 hover:text-white"
          >
            Book Service
          </Link>
        </nav>
      </div>

      {open ? (
        <nav className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              className="rounded-xl bg-sky-700 px-3 py-2 text-center text-sm font-semibold text-white"
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
