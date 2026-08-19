import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// Indique au greffon où lire la configuration de langue.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // `F:\noken` contient un package-lock.json orphelin hors dépôt Git ; sans
  // cette borne, Turbopack remonte jusqu'à lui pour inférer la racine.
  turbopack: {
    root: path.resolve(__dirname),
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nokendeclicbackend-production.up.railway.app",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        // Stockage Cloudflare R2. Le sous-domaine porte l'identifiant du bucket
        // et diffère entre environnements : le motif évite de le figer ici.
        // Un domaine personnalisé devra être ajouté explicitement.
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Le service worker ne doit jamais être servi depuis le cache HTTP,
        // sinon une mise à jour peut rester invisible plusieurs heures.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
