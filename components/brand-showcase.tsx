"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { brands } from "@/lib/content";

type Brand = (typeof brands)[number];

export function BrandShowcase({ items }: { items: Brand[] }) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.slug ?? "phonak");

  const activeBrand = useMemo(
    () => items.find((brand) => brand.slug === activeSlug) ?? items[0],
    [activeSlug, items],
  );

  if (!activeBrand) {
    return null;
  }

  return (
    <section id="brands" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="mb-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-semibold tracking-wide text-sky-800">
          Premium Hearing Aid Brands
        </p>
        <h2 className="font-display text-4xl text-slate-900 sm:text-5xl">
          Choose a Brand. Explore Its Latest Devices.
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-slate-600">
          Tap a brand to view only its hearing aids, real product images, core benefits, and fitting
          details for consultation.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {items.map((brand) => {
          const selected = brand.slug === activeBrand.slug;

          return (
            <button
              key={brand.slug}
              type="button"
              onClick={() => setActiveSlug(brand.slug)}
              className={`group min-h-36 rounded-[1.5rem] border p-5 text-left transition duration-300 ${
                selected
                  ? "border-sky-700 bg-slate-950 text-white shadow-[0_22px_48px_-28px_rgba(8,68,119,0.7)]"
                  : "border-slate-200 bg-white text-slate-900 shadow-[0_18px_42px_-34px_rgba(8,68,119,0.45)] hover:-translate-y-1 hover:border-sky-200"
              }`}
              aria-pressed={selected}
            >
              <span
                className={`inline-flex h-11 w-28 items-center justify-center rounded-full px-4 ${
                  selected ? "bg-white" : "bg-sky-50"
                }`}
              >
                <Image
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  width={112}
                  height={40}
                  className="max-h-7 w-auto object-contain"
                />
              </span>
              <span className="mt-4 block text-2xl font-black">{brand.name}</span>
              <span
                className={`mt-2 block text-sm leading-relaxed ${
                  selected ? "text-slate-200" : "text-slate-600"
                }`}
              >
                {brand.summary}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_26px_64px_-42px_rgba(8,68,119,0.65)]">
        <div className="grid gap-6 bg-[#f3f8fc] px-6 py-8 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
              {activeBrand.name}
            </p>
            <h3 className="mt-2 font-display text-4xl text-slate-900 sm:text-5xl">
              {activeBrand.summary}
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 lg:text-right">
            {activeBrand.position}
          </p>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
          {activeBrand.devices.map((device) => (
            <article
              key={device.title}
              className="group flex h-full flex-col overflow-hidden rounded-[1.45rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_-28px_rgba(8,68,119,0.6)]"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-sky-50">
                <Image
                  src={device.image}
                  alt={device.imageAlt}
                  fill
                  sizes="(min-width: 1280px) 360px, (min-width: 768px) 45vw, 90vw"
                  className="object-contain p-5 transition duration-300 group-hover:scale-[1.035]"
                />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-xl font-bold leading-snug text-slate-900">{device.title}</h4>
                  <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-700">
                    {device.badge}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">{device.description}</p>

                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {device.details.map((detail) => (
                    <li key={detail} className="rounded-xl bg-slate-50 px-3 py-2">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
