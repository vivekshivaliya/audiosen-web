import Link from "next/link";
import { ApprovedBusinessProfileCopy } from "@/components/approved-business-location";
import { footerContact } from "@/lib/content";

export function SiteFooter({
  catalogSurfaceEnabled,
  offerSurfaceEnabled,
}: {
  catalogSurfaceEnabled: boolean;
  offerSurfaceEnabled: boolean;
}) {
  return (
    <footer className="sonic-footer mt-20 text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <div className="sonic-footer-cta mb-8 flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="font-display text-2xl text-white">Better hearing starts with a clear plan.</p>
            <p className="mt-1 text-sm text-slate-300">Consultation, fitting, repair, and long-term support.</p>
          </div>
          <a
            href={footerContact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="premium-button-primary text-sm"
          >
            WhatsApp Audiosen
          </a>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="font-display text-2xl text-white">{footerContact.company}</p>
            <p>{footerContact.copyright}</p>
            <p>Hearing and communication care guidance for every age</p>
            <p>{footerContact.location}</p>
            <ApprovedBusinessProfileCopy inverse compact />
            <p>
              <a href={footerContact.callHref} className="font-semibold text-slate-200 hover:text-white">
                Call: {footerContact.callDisplay}
              </a>
            </p>
            <p>
              <a
                href={footerContact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-200 hover:text-white"
              >
                WhatsApp: {footerContact.whatsappDisplay}
              </a>
            </p>
            <p>
              <a href={`mailto:${footerContact.gmail}`} className="font-semibold text-slate-200 hover:text-white">
                {footerContact.gmail}
              </a>
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Company</p>
            <div className="grid gap-2">
              <Link href="/about" className="hover:text-white">
                About Us
              </Link>
              <Link href="/careers" className="hover:text-white">
                Careers
              </Link>
              <Link href="/blog" className="hover:text-white">
                Blog
              </Link>
              <Link href="/accessibility" className="hover:text-white">
                Accessibility
              </Link>
              <Link href="/editorial-policy" className="hover:text-white">
                Editorial Policy
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Explore</p>
            <div className="grid gap-2">
              <Link href={catalogSurfaceEnabled ? "/hearing-aids" : "/hearing-aids-india"} className="hover:text-white">
                Hearing Aids
              </Link>
              {catalogSurfaceEnabled ? (
                <>
                  <Link href="/compare-hearing-aids" className="hover:text-white">
                    Compare Hearing Aids
                  </Link>
                  <Link href="/find-my-hearing-aid" className="hover:text-white">
                    Hearing Aid Finder
                  </Link>
                </>
              ) : null}
              <Link href="/services" className="hover:text-white">
                Hearing Services
              </Link>
              <Link href="/speech-language-services" className="hover:text-white">
                Speech & Language Services
              </Link>
              {offerSurfaceEnabled ? (
                <Link href="/offers" className="hover:text-white">
                  Approved Offers
                </Link>
              ) : null}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Legal</p>
            <div className="grid gap-2">
              <Link href="/legal" className="hover:text-white">
                Legal
              </Link>
              <Link href="/privacy-policy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-white">
                Terms of Service
              </Link>
              <Link href="/refund-cancellation" className="hover:text-white">
                Refund & Cancellation
              </Link>
              <Link href="/sitemap" className="hover:text-white">
                Sitemap
              </Link>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Quick Links</p>
            <div className="grid gap-2">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <Link href="/hearing-aid-fitting-aftercare" className="hover:text-white">
                Fitting & Aftercare
              </Link>
              <Link href="/hearing-aid-repair" className="hover:text-white">
                Repair Enquiry
              </Link>
              <Link href="/home-hearing-care" className="hover:text-white">
                Home Hearing Care
              </Link>
              <Link href="/book-consultation" className="hover:text-white">
                Book Consultation
              </Link>
              <Link href="/search" className="hover:text-white">
                Search
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
