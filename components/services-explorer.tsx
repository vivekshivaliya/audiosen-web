import type { ServiceItem } from "@/lib/types";

type ServicesExplorerProps = {
  services: ServiceItem[];
};

export function ServicesExplorer({ services }: ServicesExplorerProps) {
  const previewServices = services.slice(0, 3);

  return (
    <div className="premium-shell mt-8 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="premium-eyebrow">Service Explorer</p>
          <h3 className="mt-2 font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
            Explore all {services.length} hearing care services
          </h3>
          <p className="premium-prose mt-2 max-w-3xl text-sm sm:text-base">
            From hearing tests to fitting, repair, and long-term aftercare, see every service in one
            place.
          </p>
        </div>
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

      <details className="group mt-6">
        <summary className="premium-button-primary inline-flex cursor-pointer list-none gap-3 [&::-webkit-details-marker]:hidden">
          View Every Hearing Care Service
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-base transition duration-200 group-open:rotate-180">
            ↓
          </span>
        </summary>

        <div id="service-list" className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article key={service.title} className="surface-card h-full p-6">
              <h4 className="text-xl font-semibold text-slate-900">{service.title}</h4>
              <p className="premium-prose mt-3 text-sm">{service.description}</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
                {service.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </details>
    </div>
  );
}
