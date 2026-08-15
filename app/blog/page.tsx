import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { blogPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Hearing Care Articles | Audiosen Blog",
  description:
    "Read practical Audiosen guides about hearing tests, hearing-aid decisions, noise protection, family communication, and modern device features.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Hearing Care Articles | Audiosen Blog",
    description:
      "Practical hearing-care guidance for patients and families from Audiosen in Dehradun.",
    url: "https://audiosen.com/blog",
    type: "website",
    locale: "en_IN",
  },
};

export default function BlogPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Reveal>
        <section className="premium-shell relative overflow-hidden p-7 sm:p-10">
          <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-sky-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-teal-200/35 blur-3xl" />
          <p className="premium-eyebrow">Audiosen Hearing Blog</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Practical hearing guidance for patients and families
          </h1>
          <p className="premium-prose mt-5 max-w-3xl text-base sm:text-lg">
            Understand common hearing concerns, prepare for an assessment, compare device
            features, and support safer listening. These articles are educational and do not
            replace individual clinical or medical advice.
          </p>
        </section>
      </Reveal>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {blogPosts.map((post, index) => (
          <Reveal key={post.slug} delay={Math.min(index * 0.03, 0.12)}>
            <article className="premium-shell h-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.imageAlt}
                width={1200}
                height={700}
                className="h-56 w-full border-b border-slate-200 object-cover"
              />
              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
                  <span>{post.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="mt-3 font-display text-3xl font-semibold text-slate-900">
                  <Link href={`/blog/${post.slug}`} className="transition hover:text-sky-800">
                    {post.title}
                  </Link>
                </h2>
                <p className="premium-prose mt-3 text-sm sm:text-base">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`} className="premium-button-secondary mt-5">
                  Read article
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
    </main>
  );
}
