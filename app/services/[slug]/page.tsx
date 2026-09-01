import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/service-detail";
import { getHearingService, hearingServices } from "@/lib/service-catalog";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return hearingServices.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getHearingService(slug);
  if (!service) return {};
  const canonical = service.canonicalPath ?? `/services/${service.slug}`;
  return {
    title: `${service.title} | Audiosen`,
    description: service.shortDescription,
    alternates: { canonical },
    openGraph: {
      title: `${service.title} | Audiosen`,
      description: service.shortDescription,
      url: `https://audiosen.com${canonical}`,
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: "/images/editorial/hearing-test-consultation-v2.webp",
          alt: `${service.title} hearing-care pathway`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.title} | Audiosen`,
      description: service.shortDescription,
      images: ["/images/editorial/hearing-test-consultation-v2.webp"],
    },
  };
}

export default async function HearingServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = getHearingService(slug);
  if (!service) notFound();
  return <ServiceDetail service={service} parentLabel="Hearing Care Services" parentHref="/services" />;
}
