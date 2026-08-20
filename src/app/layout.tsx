import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Providers } from "@/components/providers";
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
  // fois « · Noken Declic ». Ce titre ne sert qu'aux routes non traduites.
  title: "Noken Declic — Emploi, formations et bourses au Sénégal",
  description:
    "Trouvez des offres d'emploi, formations, bourses et programmes de volontariat au Sénégal, avec un focus sur la Casamance.",
  applicationName: "Noken Declic",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Noken Declic",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: "Noken Declic",
    title: "Noken Declic — Emploi, formations et bourses au Sénégal",
    description:
      "Trouvez des offres d'emploi, formations, bourses et programmes de volontariat au Sénégal.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noken Declic",
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
  // La langue est lue ici plutôt que reçue en paramètre : ce gabarit est au
  // dessus du segment `[locale]`, et il couvre aussi les pages non traduites,
  // qui retombent alors sur la langue par défaut.
  const locale = await getLocale();
  const t = await getTranslations("commun");
  // Les traductions sont fournies à toute l'application, et non aux seules
  // pages traduites : des composants partagés — le bouton de partage, les
  // commentaires — vivent des deux côtés de la frontière. Hors des routes
  // `[locale]`, la langue retombe sur le français, ce qui leur suffit.
  const messages = await getMessages();

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
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
