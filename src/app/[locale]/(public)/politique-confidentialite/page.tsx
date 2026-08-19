import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DocumentLegal } from "@/components/legal/document-legal";
import { Link } from "@/i18n/navigation";
import { alternatesPour } from "@/i18n/metadonnees";
import {
  articlesPolitique,
  politiqueMiseAJour,
  POLITIQUE_VERSION,
} from "@/lib/politique";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("politiqueTitre"),
    alternates: alternatesPour("/politique-confidentialite", locale),
  };
}

export default async function PolitiqueConfidentialitePage() {
  const locale = await getLocale();
  const t = await getTranslations("politique");
  const c = await getTranslations("cgu");

  return (
    <DocumentLegal
      titre={t("titre")}
      version={t("version", { version: POLITIQUE_VERSION })}
      sousTitre={t("misAJour", { date: politiqueMiseAJour(locale) })}
      avisTraduction={locale !== "fr" ? t("traductionAvis") : undefined}
      articles={articlesPolitique(locale)}
      libelles={{ accueil: c("accueil"), sommaire: c("sommaire") }}
      pied={
        <>
          {t("piedDebut")}{" "}
          <Link
            href="/feedback"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("piedLien")}
          </Link>{" "}
          {t("piedMilieu")}{" "}
          <Link
            href="/cgu"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("piedLienCgu")}
          </Link>
          {t("piedFin")}
        </>
      }
    />
  );
}
