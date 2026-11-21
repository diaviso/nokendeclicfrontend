import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { getMessages, getTranslations } from "next-intl/server";
import { FournisseurIntl, FUSEAU } from "@/components/i18n/fournisseur-intl";
import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Deux familles, deux rôles.
 *
 * Inter porte le texte courant et l'interface : c'est une police dessinée pour
 * être lue à petite taille sur écran. Plus Jakarta Sans porte les titres — ses
 * contreformes plus ouvertes et ses terminaisons franches donnent du caractère
 * aux grandes tailles, là où Inter reste neutre.
 *
 * Les deux sont variables : une seule requête chacune, quelle que soit la
 * graisse utilisée.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Pas de `template` ici : les pages traduites en déclarent un, et le gabarit
  // racine l'appliquait par-dessus — le titre de l'accueil sortait avec deux
  // fois « · Noken ». Ce titre ne sert qu'aux routes non traduites.
  title: "Noken — Emploi, formations et bourses au Sénégal",
  description:
    "Trouvez des offres d'emploi, formations, bourses et programmes de volontariat au Sénégal, avec un focus sur la Casamance.",
  applicationName: "Noken",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Noken",
    statusBarStyle: "default",
    // Sans écran de démarrage, l'application installée sur iPhone s'ouvrait
    // sur un écran blanc nu le temps du chargement. iOS exige une image par
    // taille d'écran, désignée par une requête média exacte.
    startupImage: (
      [
        [440, 956, 3], [430, 932, 3], [428, 926, 3], [414, 896, 3],
        [402, 874, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3],
        [414, 736, 3], [414, 896, 2], [375, 667, 2],
      ] as const
    ).map(([largeur, hauteur, densite]) => ({
      url: `/demarrage/apple-${largeur * densite}x${hauteur * densite}.png`,
      media: `(device-width: ${largeur}px) and (device-height: ${hauteur}px) and (-webkit-device-pixel-ratio: ${densite}) and (orientation: portrait)`,
    })),
  },
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: "Noken",
    title: "Noken — Emploi, formations et bourses au Sénégal",
    description:
      "Trouvez des offres d'emploi, formations, bourses et programmes de volontariat au Sénégal.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noken",
    description:
      "Emploi, formations, bourses et volontariat au Sénégal.",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Le zoom reste autorisé : le bloquer casse l'accessibilité pour les
  // personnes malvoyantes.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // La langue est fixée ici, et non lue dans la requête.
  //
  // Ce gabarit est au-dessus du segment `[locale]` : il ne connaît pas la
  // langue de la page. La lire dans les en-têtes (`getLocale()`) rendait
  // dynamique la totalité du site, espace membre et console compris — chaque
  // visite relançait un rendu serveur, jusqu'à épuiser le quota de calcul
  // Vercel. Le français, langue par défaut, convient aux pages non traduites ;
  // les pages anglaises posent leur propre fournisseur dans `[locale]/layout`.
  //
  // Les appels ci-dessous passent la langue explicitement : sans elle,
  // next-intl la chercherait dans les en-têtes.
  const locale = routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "commun" });
  // Les traductions sont fournies à toute l'application, et non aux seules
  // pages traduites : des composants partagés — le bouton de partage, les
  // commentaires — vivent des deux côtés de la frontière.
  const messages = await getMessages({ locale });

  return (
    // Les variables de police sont déclarées sur <html> et non sur <body> :
    // la règle `html { font-family: var(--font-sans) }` de globals.css est
    // évaluée sur cet élément. Portées par <body>, elles y seraient indéfinies,
    // la déclaration deviendrait invalide et tout le site basculerait sur la
    // police par défaut du navigateur.
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${jakarta.variable}`}
    >
      <body className="antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-md focus:ring-2 focus:ring-ring"
        >
          {t("allerAuContenu")}
        </a>
        <FournisseurIntl locale={locale} messages={messages} timeZone={FUSEAU}>
          <Providers>{children}</Providers>
        </FournisseurIntl>
      </body>
    </html>
  );
}
