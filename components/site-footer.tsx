import Link from "next/link";
import { footerContact } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-[#071128] text-slate-300">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-2 text-sm leading-relaxed">
          <p className="text-base font-bold text-white">{footerContact.company}</p>
          <p>{footerContact.copyright}</p>
          <p>Hearing solutions, hearing care products, and aftercare services</p>
          <p>{footerContact.location}</p>
          <p>{footerContact.phone}</p>
          <p>{footerContact.gmail}</p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-base font-bold text-white">Company</p>
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
            <Link href="/sitemap" className="hover:text-white">
              Sitemap
            </Link>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-base font-bold text-white">Quick Links</p>
          <div className="grid gap-2">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/#maintenance" className="hover:text-white">
              Hearing Solutions & Services
            </Link>
            <Link href="/#hearingtest" className="hover:text-white">
              Online Hearing Test
            </Link>
            <Link href="/#contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
