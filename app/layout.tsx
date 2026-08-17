import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { AnalyticsClickTracker } from "@/components/analytics-click-tracker";
import { BookServicePopup } from "@/components/book-service-popup";
import { MobileCtaBar } from "@/components/mobile-cta-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteMeta } from "@/lib/content";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "Audiosen",
  authors: [{ name: "Audiosen Hearing Care Solutions", url: "https://audiosen.com/about" }],
  creator: "Audiosen Hearing Care Solutions",
  publisher: "Audiosen Hearing Care Solutions",
  category: "health",
  manifest: "/manifest.webmanifest",
  title: siteMeta.title,
  description: siteMeta.description,
  keywords: siteMeta.keywords,
  metadataBase: new URL(siteMeta.canonicalUrl),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteMeta.title,
    description: siteMeta.description,
    url: siteMeta.canonicalUrl,
    siteName: "Audiosen",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/og-image-v2.webp",
        width: 1200,
        height: 630,
        alt: "Audiosen hearing aids and hearing care across India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMeta.title,
    description: siteMeta.description,
    images: ["/og-image-v2.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon-v2.ico", type: "image/x-icon" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/favicon-v2.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <body className={`${sans.variable} ${display.variable} min-h-screen pb-20 font-sans text-slate-900 antialiased lg:pb-0`}>
        <AnalyticsConsent />
        <AnalyticsClickTracker />
        <div className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(9,92,153,0.2),transparent_70%)] blur-2xl" />
          <div className="pointer-events-none absolute right-[-12rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(14,138,143,0.16),transparent_72%)] blur-3xl" />
          <SiteHeader />
          <BookServicePopup />
          {children}
          <SiteFooter />
        </div>
        <MobileCtaBar />
      </body>
    </html>
  );
}
