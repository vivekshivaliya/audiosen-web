import Link from "next/link";
import type { PublicService } from "@/lib/service-catalog";

export function ServiceCard({
  service,
  basePath,
  index,
}: {
  service: PublicService;
  basePath: "/services" | "/speech-language-services";
  index: number;
}) {
  const href = service.canonicalPath ?? `${basePath}/${service.slug}`;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-teal-900/10 bg-white/90 p-6 shadow-[0_24px_60px_-42px_rgba(5,56,68,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_70px_-40px_rgba(5,56,68,0.65)] motion-reduce:transform-none">
      <div className="mb-6 flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-900 text-sm font-extrabold text-white">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
          Learn &amp; book
        </span>
      </div>
      <h3 className="text-2xl font-semibold text-slate-950">{service.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
        {service.shortDescription}
      </p>
      <Link
        href={href}
        className="mt-6 inline-flex min-h-11 items-center font-bold text-teal-800 underline decoration-teal-300 underline-offset-4 transition group-hover:decoration-teal-700"
      >
        Explore {service.title}
        <span aria-hidden="true" className="ml-2">
          →
        </span>
      </Link>
    </article>
  );
}
