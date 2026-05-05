import Link from "next/link";
import { footerContact } from "@/lib/content";

export function SiteFooter() {
  const phoneHref = `tel:${footerContact.phone.replace(/\s+/g, "")}`;
  const whatsappHref = `https://wa.me/${footerContact.phone.replace(/\D/g, "")}`;

  return (
    <footer className="mt-20 border-t border-slate-800 bg-[#061126] text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-700/70 bg-[#0b1b38] px-5 py-4">
          <div>
            <p className="font-display text-2xl text-white">Better hearing starts with a clear plan.</p>
            <p className="mt-1 text-sm text-slate-300">Consultation, fitting, repair, and long-term support.</p>
          </div>
          <a href={phoneHref} className="premium-button-primary text-sm">
            Call {footerContact.phone}
          </a>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="font-display text-2xl text-white">{footerContact.company}</p>
            <p>{footerContact.copyright}</p>
            <p>Hearing solutions, hearing care products, and aftercare services</p>
            <p>{footerContact.location}</p>
            <p>
              <a href={phoneHref} className="font-semibold text-slate-200 hover:text-white">
                Call: {footerContact.phone}
              </a>
            </p>
            <p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-200 hover:text-white"
              >
                WhatsApp: {footerContact.phone}
              </a>
            </p>
            <p className="text-slate-200">{footerContact.gmail}</p>
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
              <Link href="/#services" className="hover:text-white">
                Hearing Solutions & Services
              </Link>
              <Link href="/hearing-test" className="hover:text-white">
                Online Hearing Test
              </Link>
              <Link href="/#contact" className="hover:text-white">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
