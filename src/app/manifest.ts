import type { MetadataRoute } from "next";

/* Colours mirror --color-world-night and --color-world-paper in styles/theme.css. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hugo Tron",
    short_name: "Hugo Tron",
    description:
      "Lebensmittelimport und Großhandel aus Hamburg: Reis, Nüsse, Gewürze, Safran, Tee und Hülsenfrüchte.",
    start_url: "/de",
    display: "browser",
    background_color: "#d9cdb7",
    theme_color: "#0a1320",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
