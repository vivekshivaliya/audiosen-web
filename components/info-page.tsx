import Image from "next/image";
import { Reveal } from "@/components/reveal";
import type { InfoPageContent } from "@/lib/types";

export function InfoPage({ content }: { content: InfoPageContent }) {
  const heroImage = content.image ?? "/images/contact-ear-check-hq.jpg";
  const heroAlt = content.imageAlt ?? `${content.title} visual`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Reveal>
        <section className="premium-shell p-8 sm:p-12">
          <Image
            src={heroImage}
            alt={heroAlt}
            width={1400}
            height={560}
            className="h-auto w-full rounded-2xl border border-slate-200 object-cover"
          />

          <h1 className="mt-7 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {content.title}
          </h1>

          <div className="premium-prose mt-6 space-y-4 text-base">
            {content.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {content.bullets?.length ? (
            <ul className="premium-prose mt-6 list-disc space-y-2 pl-5 text-base">
              {content.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      </Reveal>
    </main>
  );
}
