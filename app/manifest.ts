import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Audiosen Hearing Care Solutions",
    short_name: "Audiosen",
    description: "Hearing aids and hearing-care guidance across India.",
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
