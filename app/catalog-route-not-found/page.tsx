import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found-view";

export const metadata: Metadata = {
  title: "Page Not Found | Audiosen",
  robots: { index: false, follow: false },
};

export default function CatalogRouteNotFoundPage() {
  return <NotFoundView />;
}
