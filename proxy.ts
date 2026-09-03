import { NextResponse, type NextRequest } from "next/server";
import { getApprovedCatalogSnapshot } from "@/lib/catalog/approved-snapshot";
import {
  isCatalogPublicationEnabled,
  isCatalogStagingPreviewEnabled,
  isStagedCatalogSurface,
} from "@/lib/catalog/launch";
import { isInvalidStagedCatalogPath } from "@/lib/catalog/route-manifest";
import type { CatalogSnapshot } from "@/lib/catalog/types";

function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes));
}

function normalizeMediaRequestPath(value: string | null): string {
  if (!value) return "";
  let normalized = value.replaceAll("\\", "/");
  // Decode nested separators so repeated percent-encoding cannot evade a
  // prefix check. Deeply encoded or malformed paths have no legitimate media
  // use here and fail closed through the sentinel below.
  for (let pass = 0; pass < 8; pass += 1) {
    try {
      const decoded = decodeURIComponent(normalized);
      if (decoded === normalized) break;
      normalized = decoded.replaceAll("\\", "/");
    } catch {
      return "/images/products/__invalid-encoded-path__";
    }
  }
  if (/%(?:25|2f|5c)/i.test(normalized)) {
    return "/images/products/__over-encoded-path__";
  }
  return normalized.toLowerCase();
}

function isApprovedCatalogPath(pathname: string, snapshot: CatalogSnapshot): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (
    normalized === "/hearing-aids" ||
    normalized === "/compare-hearing-aids" ||
    normalized === "/find-my-hearing-aid" ||
    normalized === "/hearing-aid-trial"
  ) {
    return true;
  }
  const segments = normalized.split("/").filter(Boolean);
  if (segments[0] !== "hearing-aids" || segments.length < 2 || segments.length > 3) {
    return false;
  }
  const brand = snapshot.brands.find((item) => item.slug === segments[1]);
  if (!brand) return false;
  if (segments.length === 2) return true;
  return snapshot.models.some(
    (model) => model.brandSlug === brand.slug && model.slug === segments[2],
  );
}

function createContentSecurityPolicy(nonce: string, secureTransport: boolean): string {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const turnstileOrigin = turnstileEnabled ? " https://challenges.cloudflare.com" : "";
  const analyticsEnabled = /^G-[A-Z0-9]+$/i.test(
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() ?? "",
  );
  const analyticsScriptOrigin = analyticsEnabled ? " https://www.googletagmanager.com" : "";
  const analyticsConnectOrigins = analyticsEnabled
    ? " https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com"
    : "";
  const developmentScripts = isDevelopment ? " 'unsafe-eval' blob:" : "";
  const developmentConnections = isDevelopment ? " ws: wss: http: https:" : "";
  const upgradeInsecureRequests =
    isDevelopment || !secureTransport ? "" : "upgrade-insecure-requests;";

  return [
    "default-src 'self';",
    // HTML responses below opt out of intermediary transformations, so retain
    // the nonce-based strict policy for Next.js application scripts.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${analyticsScriptOrigin}${turnstileOrigin}${developmentScripts};`,
    `style-src 'self' 'nonce-${nonce}';`,
    // Next/Image emits positioning attributes during server rendering. Keep
    // those attributes separate from the nonce-protected stylesheet policy.
    "style-src-attr 'unsafe-inline';",
    "font-src 'self' data:;",
    "img-src 'self' data: blob:;",
    "media-src 'self' blob:;",
    `connect-src 'self'${analyticsConnectOrigins}${turnstileOrigin}${developmentConnections};`,
    `frame-src 'self'${turnstileOrigin};`,
    "worker-src 'self' blob:;",
    "object-src 'none';",
    "base-uri 'self';",
    "form-action 'self';",
    "frame-ancestors 'none';",
    upgradeInsecureRequests,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0];
  const stagingDeployment = process.env.AUDIOSEN_STAGING_DEPLOYMENT === "true";
  const configuredStagingHost = process.env.AUDIOSEN_STAGING_HOST
    ?.trim()
    .toLowerCase();
  const allowedStagingHost = Boolean(
    stagingDeployment &&
      configuredStagingHost &&
      host === configuredStagingHost &&
      host.endsWith(".azurewebsites.net"),
  );

  if (
    host === "www.audiosen.com" ||
    (host?.endsWith(".azurewebsites.net") && !allowedStagingHost)
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = "audiosen.com";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const nonce = createNonce();
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim()
    .toLowerCase();
  const secureTransport =
    request.nextUrl.protocol === "https:" || forwardedProtocol === "https";
  const contentSecurityPolicy = createContentSecurityPolicy(nonce, secureTransport);
  const stagingPreviewEnabled =
    process.env.CATALOG_STAGING_PREVIEW_ENABLED === "true";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  // Legacy product files, manufacturer logos, and an unverified service
  // composite remain in the repository only as editorial review inputs. Their
  // usage rights are not approved, so a guessed URL must not bypass the gate.
  const optimizedImageSource =
    request.nextUrl.pathname === "/_next/image"
      ? request.nextUrl.searchParams.get("url")
      : null;
  const normalizedPath = normalizeMediaRequestPath(request.nextUrl.pathname);
  const normalizedOptimizedSource = normalizeMediaRequestPath(optimizedImageSource);
  const isUnapprovedCatalogMedia =
    normalizedPath.startsWith("/images/products/") ||
    normalizedPath.startsWith("/brands/") ||
    normalizedPath === "/images/services/hearing-aid-trial.jpg" ||
    Boolean(
      normalizedOptimizedSource.includes("/images/products/") ||
        normalizedOptimizedSource.includes("/brands/") ||
        normalizedOptimizedSource.includes("/images/services/hearing-aid-trial.jpg"),
    );

  // Return media denials directly. Rewriting a static-asset request to an App
  // Router page can cause Next to replace the middleware status with 200,
  // particularly for router-prefetch requests.
  if (isUnapprovedCatalogMedia) {
    return new NextResponse(null, {
      status: 404,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Security-Policy": contentSecurityPolicy,
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const catalogPath = isStagedCatalogSurface(request.nextUrl.pathname);
  let blockCatalogPath = false;
  if (catalogPath) {
    if (isCatalogPublicationEnabled()) {
      const approvedSnapshot = await getApprovedCatalogSnapshot();
      blockCatalogPath =
        approvedSnapshot === null ||
        !isApprovedCatalogPath(request.nextUrl.pathname, approvedSnapshot);
    } else if (isCatalogStagingPreviewEnabled()) {
      blockCatalogPath = isInvalidStagedCatalogPath(request.nextUrl.pathname);
    } else {
      blockCatalogPath = true;
    }
  }

  if (blockCatalogPath) {
    const notFoundUrl = request.nextUrl.clone();
    notFoundUrl.pathname = "/catalog-route-not-found";
    notFoundUrl.search = "";
    const response = NextResponse.rewrite(notFoundUrl, {
      status: 404,
      request: { headers: requestHeaders },
    });
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  if (request.headers.get("accept")?.includes("text/html")) {
    // Prevent edge optimizers such as Cloudflare Rocket Loader from rewriting
    // Next.js module scripts. Rewriting them can leave App Router's loading UI
    // on screen permanently when a nonce-based CSP is active.
    response.headers.set("Cache-Control", "no-transform");
  }
  if (stagingPreviewEnabled || stagingDeployment) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|favicon-v2.ico|favicon-32.png|favicon-48.png|apple-touch-icon.png|manifest.webmanifest).*)",
    },
  ],
};
