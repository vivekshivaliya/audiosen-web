"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ServiceItem } from "@/lib/types";

type ServicesExplorerProps = {
  services: ServiceItem[];
};

export function ServicesExplorer({ services }: ServicesExplorerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const previewServices = services.slice(0, 3);

  return (
    <div className="premium-shell mt-8 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="premium-eyebrow">
            Service Explorer
          </p>
          <h3 className="mt-3 font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
            Click to explore all {services.length} hearing care services
          </h3>
          <p className="premium-prose mt-2 max-w-3xl text-sm sm:text-base">
            From hearing tests to fitting, repair, and long-term aftercare, see every service in one
            place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls="service-list"
          className="premium-button-primary group gap-3"
        >
          {isOpen ? "Hide Services" : "Our Hearing Care Services"}
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-base transition duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            ^
          </span>
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {previewServices.map((service) => (
          <div
            key={service.title}
            className="premium-card-soft p-4 text-sm font-medium text-slate-700"
          >
            {service.title}
          </div>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id="service-list"
            key="service-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service, index) => (
                <motion.article
                  key={service.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="surface-card h-full p-6"
                >
                  <h4 className="text-xl font-semibold text-slate-900">{service.title}</h4>
                  <p className="premium-prose mt-3 text-sm">{service.description}</p>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
                    {service.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
