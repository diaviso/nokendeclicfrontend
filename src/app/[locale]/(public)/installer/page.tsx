import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EcranInstallation } from "@/components/installation/ecran-installation";
import { alternatesPour } from "@/i18n/metadonnees";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("installerTitre"),
    alternates: alternatesPour("/installer", locale),
  };
}

/**
 * Page d'installation — destination du QR code imprimé.
 *
 * Servie depuis l'origine canonique, et non depuis un sous-domaine dédié :
 * session, permission de notification et abonnement push sont cloisonnés par
 * origine. Installer depuis une autre adresse donnerait une seconde
 * application, avec son propre compte et ses propres notifications.
 */
export default async function InstallerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EcranInstallation />;
}
