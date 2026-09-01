"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { BOOK_SERVICE_POPUP_EVENT } from "@/lib/book-service-popup";

const allNavGroups = [
  {
    label: "Hearing aids",
    links: [
      { label: "Browse hearing aids", href: "/hearing-aids" },
      { label: "Compare hearing aids", href: "/compare-hearing-aids" },
      { label: "Find my hearing aid", href: "/find-my-hearing-aid" },
      { label: "Hearing aid types", href: "/hearing-aid-types" },
      { label: "Trial information", href: "/hearing-aid-trial" },
    ],
  },
  {
    label: "Hearing care",
    links: [
      { label: "All hearing services", href: "/services" },
      { label: "Online hearing test", href: "/hearing-test" },
      { label: "Share an audiogram", href: "/audiogram-guidance" },
      { label: "Repair enquiry", href: "/hearing-aid-repair" },
      { label: "Home hearing care", href: "/home-hearing-care" },
      { label: "Fitting & aftercare", href: "/hearing-aid-fitting-aftercare" },
    ],
  },
  {
    label: "Speech & resources",
    links: [
      { label: "Speech & language services", href: "/speech-language-services" },
      { label: "Hearing aids across India", href: "/hearing-aids-india" },
      { label: "Blog", href: "/blog" },
      { label: "Search", href: "/search" },
    ],
  },
] as const;

const stagedCatalogHrefs = new Set([
  "/hearing-aids",
  "/compare-hearing-aids",
  "/find-my-hearing-aid",
  "/hearing-aid-trial",
]);

export function SiteHeader({
  catalogSurfaceEnabled,
  offerSurfaceEnabled,
  trialSurfaceEnabled,
}: {
  catalogSurfaceEnabled: boolean;
  offerSurfaceEnabled: boolean;
  trialSurfaceEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navGroups = allNavGroups.map((group) => ({
    ...group,
    links: catalogSurfaceEnabled
      ? group.links.filter(
          (link) => link.href !== "/hearing-aid-trial" || trialSurfaceEnabled,
        )
      : group.links.filter((link) => !stagedCatalogHrefs.has(link.href)),
  }));
  const directLinks = [
    { label: "Home", href: "/" },
    { label: "Care Plans", href: "/care-plans" },
    ...(offerSurfaceEnabled ? [{ label: "Offers", href: "/offers" }] : []),
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  function openBookServicePopup() {
    window.dispatchEvent(new Event(BOOK_SERVICE_POPUP_EVENT));
    setOpen(false);
  }

  return (
    <header className="site-header-sonic sticky top-0 z-50">
      <div className="sonic-nav-shell mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8">
        <BrandLockup />

        <button
          ref={menuButtonRef}
          type="button"
          aria-label={open ? "Close navigation menu" : "Menu navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="sonic-menu-button inline-flex min-h-11 min-w-11 items-center justify-center px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] xl:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <nav aria-label="Primary navigation" className="sonic-desktop-nav hidden items-center gap-3 xl:flex">
          {navGroups.map((group) => (
            <details key={group.label} className="group relative">
              <summary className="cursor-pointer list-none rounded-lg px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-700 transition hover:bg-white/70 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
                {group.label} <span aria-hidden="true">⌄</span>
              </summary>
              <div className="absolute left-1/2 z-20 mt-2 grid w-64 -translate-x-1/2 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                {group.links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          ))}
          {directLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-700 transition hover:bg-white/70 hover:text-slate-900"
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
        <nav id="mobile-navigation" aria-label="Menu navigation" className="sonic-mobile-nav max-h-[calc(100vh-5rem)] overflow-y-auto px-4 py-4 xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {navGroups.map((group) => (
              <section key={group.label} aria-labelledby={`mobile-nav-${group.label.replaceAll(" ", "-")}`} className="rounded-2xl border border-slate-200 bg-white/70 p-2">
                <h2 id={`mobile-nav-${group.label.replaceAll(" ", "-")}`} className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-800">
                  {group.label}
                </h2>
                <div className="grid gap-1">
                  {group.links.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-900"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
            <section aria-labelledby="mobile-nav-company" className="rounded-2xl border border-slate-200 bg-white/70 p-2">
              <h2 id="mobile-nav-company" className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-800">
                Company
              </h2>
              <div className="grid gap-1">
                {directLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-900"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
            <button
              type="button"
              className="premium-button-primary self-end text-sm sm:col-span-2 lg:col-span-3"
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
