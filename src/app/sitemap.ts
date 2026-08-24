import type { MetadataRoute } from "next";
import { serverFetch } from "@/lib/api/client";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/** Le plan de site est reconstruit au plus une fois par heure. */
export const revalidate = 3600;

const BASE = SITE_URL.replace(/\/+$/, "");

/** Chemin absolu d'une page traduite, langue par défaut sans préfixe. */
function url(chemin: string, locale: string): string {
  const nettoye = chemin === "/" ? "" : chemin;
  const prefixe = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${BASE}${prefixe}${nettoye}` || `${BASE}/`;
}

/**
 * Renvoie une entrée par langue, chacune déclarant ses traductions.
 *
 * Sans ces liens, les deux versions se présentent comme deux pages
 * concurrentes sur le même contenu, et les moteurs n'en retiennent souvent
 * qu'une.
 */
function entrees(
  chemin: string,
  options: {
    lastModified?: Date;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  } = {},
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, url(chemin, locale)]),
  );

  return routing.locales.map((locale) => ({
    url: url(chemin, locale),
    ...options,
    alternates: {
      languages: { ...languages, "x-default": url(chemin, routing.defaultLocale) },
    },
  }));
}

type OffreListee = { id: number; updatedAt?: string; datePublication?: string };

/**
 * Offres publiées, toutes pages confondues.
 *
 * La pagination est suivie plutôt que devinée par une grande limite : le
 * catalogue grandit, et un plan de site tronqué en silence laisserait des
 * annonces hors des moteurs sans que rien ne le signale.
 */
async function toutesLesOffres(): Promise<OffreListee[]> {
  const offres: OffreListee[] = [];
  const TAILLE = 100;
  const PAGES_MAX = 50;

  for (let page = 1; page <= PAGES_MAX; page += 1) {
    const lot = await serverFetch<{
      data: OffreListee[];
      hasMore?: boolean;
      totalPages?: number;
    }>(`/api/offres?page=${page}&limit=${TAILLE}`, { revalidate });

    offres.push(...(lot.data ?? []));

    const encore = lot.hasMore ?? page < (lot.totalPages ?? 1);
    if (!encore || (lot.data?.length ?? 0) === 0) break;
  }

  return offres;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const maintenant = new Date();

  const pages: MetadataRoute.Sitemap = [
    ...entrees("/", {
      lastModified: maintenant,
      changeFrequency: "daily",
      priority: 1,
    }),
    ...entrees("/offres", {
      lastModified: maintenant,
      changeFrequency: "daily",
      priority: 0.9,
    }),
    ...entrees("/installer", {
      changeFrequency: "monthly",
      priority: 0.6,
    }),
    ...entrees("/cgu", { changeFrequency: "yearly", priority: 0.3 }),
    ...entrees("/politique-confidentialite", {
      changeFrequency: "yearly",
      priority: 0.3,
    }),
  ];

  // Une API indisponible ne doit pas faire échouer le plan de site : mieux
  // vaut le servir amputé de ses annonces que renvoyer une erreur, qui ferait
  // disparaître aussi les pages fixes des moteurs.
  let offres: OffreListee[] = [];
  try {
    offres = await toutesLesOffres();
  } catch {
    offres = [];
  }

  for (const offre of offres) {
    const modifiee = offre.updatedAt ?? offre.datePublication;
    pages.push(
      ...entrees(`/offres/${offre.id}`, {
        lastModified: modifiee ? new Date(modifiee) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    );
  }

  return pages;
}
