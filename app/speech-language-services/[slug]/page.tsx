import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/service-detail";
import { getSpeechService, speechServices } from "@/lib/service-catalog";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return speechServices.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getSpeechService(slug);
  if (!service) return {};
  const canonical = `/speech-language-services/${service.slug}`;
  const title = `${service.title} Enquiry | Audiosen`;
  const description = `${service.shortDescription} Provider, appointment and service availability are confirmed before booking.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `https://audiosen.com${canonical}`,
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: "/images/editorial/family-hearing-conversation-v2.webp",
          alt: `${service.title} communication-support pathway`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/editorial/family-hearing-conversation-v2.webp"],
    },
  };
}

export default async function SpeechServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = getSpeechService(slug);
  if (!service) notFound();
  return (
    <ServiceDetail
      service={service}
      parentLabel="Speech & Language Services"
      parentHref="/speech-language-services"
      schemaMode="enquiry"
    />
  );
}
