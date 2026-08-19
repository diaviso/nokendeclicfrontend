import type { MetadataRoute } from "next";

/**
 * Manifeste PWA servi par la route native de Next (`/manifest.webmanifest`).
 * Évite d'avoir à maintenir un fichier statique en double dans `public/`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Noken Declic — Emploi, formations et bourses",
    short_name: "Noken",
    description:
      "Offres d'emploi, formations, bourses et volontariat au Sénégal, avec un focus sur la Casamance.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0090FF",
    lang: "fr",
    dir: "ltr",
    categories: ["business", "education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Rechercher une offre",
        short_name: "Offres",
        url: "/offres",
      },
      {
        name: "Assistant IA",
        short_name: "Assistant",
        url: "/assistant",
      },
      {
        name: "Mon CV",
        short_name: "CV",
        url: "/cv",
      },
    ],
  };
}
