import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL.replace(/\/+$/, "");

/**
 * Ce que les moteurs ont le droit de parcourir.
 *
 * Les espaces privés sont écartés non par souci de confidentialité — ils sont
 * déjà protégés par l'authentification — mais parce qu'un robot n'y récolterait
 * que des écrans de connexion, au détriment du temps qu'il consacre aux pages
 * réellement publiques.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/profil",
        "/messagerie",
        "/assistant",
        "/favoris",
        "/cv",
        "/recherche",
        "/partenaire",
        "/reset-password",
        "/api/",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
