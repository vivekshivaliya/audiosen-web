import type { Metadata } from "next";
import {
  absoluteSeoUrl,
  isIndexableByDefault,
  type SeoCanonicalPath,
} from "@/lib/seo-routes";

const defaultImage = "/og-image-v2.webp";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: SeoCanonicalPath;
  image?: string;
  imageAlt?: string;
  robots?: Metadata["robots"];
};

/**
 * Builds a complete, route-specific metadata set for public content pages.
 * Keeping Open Graph and Twitter values here prevents a child route from
 * accidentally falling back to (or shallowly replacing) the home-page card.
 */
export function createPageMetadata({
  title,
  description,
  path,
  image = defaultImage,
  imageAlt = `${title} on Audiosen`,
  robots,
}: PageMetadataOptions): Metadata {
  const defaultRobots = isIndexableByDefault(path)
    ? undefined
    : { index: false, follow: true };
  const resolvedRobots = robots ?? defaultRobots;

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(resolvedRobots ? { robots: resolvedRobots } : {}),
    openGraph: {
      title,
      description,
      url: absoluteSeoUrl(path),
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
