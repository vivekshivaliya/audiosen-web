import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";
import { siteMeta } from "@/lib/content";

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

function formatArticleDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) return {};

  const url = `https://audiosen.com/blog/${post.slug}`;

  return {
    title: `${post.title} | Audiosen`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      locale: "en_IN",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: [{ url: post.image }],
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) notFound();

  const pageUrl = `https://audiosen.com/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: `https://audiosen.com${post.image}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: pageUrl,
    author: {
      "@type": post.author.schemaType,
      name: post.author.name,
      url: `https://audiosen.com${post.author.href}`,
    },
    ...(post.reviewer
      ? {
          editor: {
            "@type": "Person",
            name: post.reviewer.name,
            jobTitle: post.reviewer.professionalTitle,
            url: `https://audiosen.com${post.reviewer.profileHref}`,
          },
        }
      : {}),
    publisher: {
      "@type": "Organization",
      name: "Audiosen",
      logo: {
        "@type": "ImageObject",
        url: siteMeta.logo,
      },
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://audiosen.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://audiosen.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: pageUrl,
      },
    ],
  };

  return (
    <main className="sonic-article-page mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
        <Link href="/" className="hover:text-sky-800">Home</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/blog" className="hover:text-sky-800">Blog</Link>
        <span aria-hidden="true"> / </span>
        <span>{post.title}</span>
      </nav>

      <article className="premium-shell sonic-article-shell overflow-hidden">
        <Image
          src={post.image}
          alt={post.imageAlt}
          width={1400}
          height={800}
          priority
          className="max-h-[30rem] w-full border-b border-slate-200 object-cover"
        />

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
            <span>{post.category}</span>
            <span aria-hidden="true">·</span>
            <span>{post.readTime}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.publishedAt}>Published {formatArticleDate(post.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <time dateTime={post.updatedAt}>Updated {formatArticleDate(post.updatedAt)}</time>
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-slate-900 sm:text-6xl">
            {post.title}
          </h1>
          <p className="premium-prose mt-6 text-lg">{post.introduction}</p>

          <div className="mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-900">{post.author.role}:</span>{" "}
              <Link
                href={post.author.href}
                className="font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4"
              >
                {post.author.name}
              </Link>
            </p>
            {post.reviewer && post.reviewedAt ? (
              <p>
                <span className="font-semibold text-slate-900">Clinically reviewed by:</span>{" "}
                <Link
                  href={post.reviewer.profileHref}
                  className="font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4"
                >
                  {post.reviewer.name}
                </Link>{" "}
                on <time dateTime={post.reviewedAt}>{formatArticleDate(post.reviewedAt)}</time>
              </p>
            ) : (
              <p>
                <span className="font-semibold text-slate-900">Clinical review status:</span>{" "}
                No named clinical review is claimed until reviewer credentials and publication
                consent are verified.
              </p>
            )}
          </div>

          <div className="mt-10 space-y-10">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
                  {section.heading}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="premium-prose mt-4 text-base sm:text-lg">
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="premium-prose mt-4 list-disc space-y-2 pl-6 text-base sm:text-lg">
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
            {post.medicalDisclaimer}
          </div>

          <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-semibold text-slate-900">Sources and further reading</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {post.sources.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={post.relatedHref} className="premium-button-primary">
              {post.relatedLabel}
            </Link>
            <Link href="/blog" className="premium-button-secondary">
              View all articles
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
