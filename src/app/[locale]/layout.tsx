import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { FournisseurIntl, FUSEAU } from "@/components/i18n/fournisseur-intl";
import { LangueDocument } from "@/components/i18n/langue-document";
import { alternatesPour, localeOpenGraph } from "@/i18n/metadonnees";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";

/**
 * Racine des pages traduites.
 *
 * Le segment `[locale]` accepte n'importe quelle valeur : sans cette
 * vérification, `/klingon/offres` rendrait la page en français au lieu de
 * renvoyer une 404, et Google indexerait autant d'adresses que de fautes de
 * frappe.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Métadonnées communes aux pages traduites.
 *
 * Le titre et la description remplacent ceux, écrits en français, du gabarit
 * racine : une page anglaise annoncée en français dans les résultats de
 * recherche perdrait l'essentiel du bénéfice de la traduction.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: {
      default: t("accueilTitre"),
      template: "%s · Noken",
    },
    description: t("accueilDescription"),
    alternates: alternatesPour("/", locale),
    openGraph: {
      locale: localeOpenGraph(locale),
      title: t("accueilTitre"),
      description: t("accueilDescription"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Permet le rendu statique des pages traduites : sans cet appel, la moindre
  // lecture de traduction bascule la page en rendu dynamique.
  setRequestLocale(locale);

  // Le gabarit racine fournit déjà le français, à tout le site. Il ne connaît
  // pas la langue de la page — la lire l'aurait rendu dynamique — : les pages
  // dans une autre langue posent donc ici leur propre fournisseur, qui prime
  // sur le sien pour les composants client qu'elles contiennent.
  if (locale === routing.defaultLocale) return children;

  const messages = await getMessages({ locale });

  return (
    <FournisseurIntl locale={locale} messages={messages} timeZone={FUSEAU}>
      <LangueDocument locale={locale} />
      {children}
    </FournisseurIntl>
  );
}
