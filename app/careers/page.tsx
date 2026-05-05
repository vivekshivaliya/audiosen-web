import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Careers | Audiosen Hearing Care",
  description:
    "Explore hearing care career opportunities at Audiosen, including audiologist, technician, and patient support roles.",
  alternates: {
    canonical: "/careers",
  },
};

export default function CareersPage() {
  return <InfoPage content={infoPages.careers} />;
}
