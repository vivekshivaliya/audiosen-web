import type { NextConfig } from "next";
import path from "node:path";

function contentSecurityPolicy() {
  const isDev = process.env.NODE_ENV !== "production";
  const analyticsScripts = "https://www.googletagmanager.com";
  const analyticsConnect =
    "https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googleadservices.com https://googleads.g.doubleclick.net";

  const scriptSrc = isDev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://checkout.razorpay.com ${analyticsScripts};`
    : `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com ${analyticsScripts};`;
  const connectSrc = isDev
    ? `connect-src 'self' ws: wss: https: https://api.razorpay.com ${analyticsConnect};`
    : `connect-src 'self' https://api.razorpay.com ${analyticsConnect};`;

  return [
    "default-src 'self';",
    "img-src 'self' data: https:;",
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com;",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
    "font-src 'self' https://fonts.gstatic.com data:;",
    scriptSrc,
    connectSrc,
    "frame-ancestors 'none';",
    "base-uri 'self';",
    "form-action 'self';",
  ].join(" ");
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
