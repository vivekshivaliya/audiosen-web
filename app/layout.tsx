import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import Script from "next/script";
import { AnalyticsClickTracker } from "@/components/analytics-click-tracker";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { localBusinessJsonLd, siteMeta } from "@/lib/content";
import "./globals.css";

const googleAnalyticsId = "G-Q6H49XWK0S";
const googleAdsId = "AW-18110980849";

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
    images: [{ url: siteMeta.ogImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMeta.title,
    description: siteMeta.description,
    images: [siteMeta.ogImage],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "512x512", type: "image/x-icon" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} min-h-screen font-sans text-slate-900 antialiased`}>
        <AnalyticsClickTracker />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAnalyticsId}');
            gtag('config', '${googleAdsId}');
          `}
        </Script>
        <div className="relative isolate overflow-hidden">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
          />
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(9,92,153,0.2),transparent_70%)] blur-2xl" />
          <div className="pointer-events-none absolute right-[-12rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(14,138,143,0.16),transparent_72%)] blur-3xl" />
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
