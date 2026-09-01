import type { MetadataRoute } from "next";
import { brandIdentity } from "@/lib/content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brandIdentity.organizationName,
    short_name: brandIdentity.shortName,
    description: "Hearing and communication care guidance from Audiosen.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#05285a",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
