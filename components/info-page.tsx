import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import type { InfoPageContent } from "@/lib/types";

const policyLinks = [
  { href: "/legal", label: "Legal" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms-of-service", label: "Terms" },
  { href: "/refund-cancellation", label: "Refunds" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/sitemap", label: "Sitemap" },
];

const sitemapLinkMap: Record<string, string> = {
  Home: "/",
  "Hearing Aids Across India": "/hearing-aids-india",
  "About Us": "/about",
  Careers: "/careers",
  Blog: "/blog",
  Accessibility: "/accessibility",
  "Hearing Aids in Dehradun": "/hearing-aids-dehradun",
  "Hearing Test in Dehradun": "/hearing-test-dehradun",
  "Hearing Aid Prices in Dehradun": "/hearing-aid-prices-dehradun",
  "Hearing Aid Repair in Dehradun": "/hearing-aid-repair-dehradun",
  "Home Hearing Care in Dehradun": "/home-hearing-care-dehradun",
  "Online Hearing Test": "/hearing-test",
  Services: "/#services",
  "Hearing Aid Brands": "/#brands",
  "Our Experts": "/about",
  "Contact & Location": "/#contact",
  Legal: "/legal",
  "Privacy Policy": "/privacy-policy",
  "Terms of Service": "/terms-of-service",
  "Refund & Cancellation": "/refund-cancellation",
};

export function InfoPage({ content }: { content: InfoPageContent }) {
  const heroImage = content.image ?? "/images/contact-ear-check-hq.jpg";
  const heroAlt = content.imageAlt ?? `${content.title} visual`;

  return (
    <main className="sonic-info-page mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <Reveal>
        <section className="premium-shell sonic-info-shell">
          <div className="sonic-info-hero">
            <div className="sonic-info-copy">
              <p className="premium-eyebrow">Audiosen · clear information</p>
              <h1 className="font-display">{content.title}</h1>
              <p className="sonic-info-lede">Designed to be readable, transparent, and easy to act on.</p>
            </div>
            <div className="sonic-info-visual">
              <Image src={heroImage} alt={heroAlt} width={1600} height={900} priority />
              <span>Audiosen Hearing Care Solutions</span>
            </div>
          </div>

          <div className="sonic-info-body">
            <article>
              <div className="premium-prose space-y-4 text-base sm:text-lg">
                {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>

              {content.bullets?.length ? (
                <ul className="sonic-info-list">
                  {content.bullets.map((bullet) => {
                    const href = content.title === "Sitemap" ? sitemapLinkMap[bullet] : undefined;

                    return (
                      <li key={bullet}>
                        {href ? <Link href={href} className="font-semibold text-sky-800 hover:underline">{bullet}</Link> : bullet}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </article>

            <aside className="sonic-info-aside">
              <p>Explore Audiosen</p>
              <nav aria-label="Related information pages">
                {policyLinks.map((item) => (
                  <Link key={item.href} href={item.href}>{item.label}<span aria-hidden="true">↗</span></Link>
                ))}
              </nav>
              <Link href="/#contact" className="premium-button-primary">Ask a question</Link>
            </aside>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
