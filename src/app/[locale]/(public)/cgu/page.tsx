import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DocumentLegal } from "@/components/legal/document-legal";
import { Link } from "@/i18n/navigation";
import { alternatesPour } from "@/i18n/metadonnees";
import { articlesCgu, entreeEnVigueur, CGU_VERSION } from "@/lib/cgu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("cguTitre"),
    alternates: alternatesPour("/cgu", locale),
  };
}

export default async function CguPage() {
  const locale = await getLocale();
  const t = await getTranslations("cgu");

  return (
    <DocumentLegal
      titre={t("titre")}
      version={t("version", { version: CGU_VERSION })}
      sousTitre={t("envigueur", { date: entreeEnVigueur(locale) })}
      avisTraduction={locale !== "fr" ? t("traductionAvis") : undefined}
      articles={articlesCgu(locale)}
      libelles={{ accueil: t("accueil"), sommaire: t("sommaire") }}
      pied={
        <>
          {t("piedDebut")}{" "}
          <Link
            href="/feedback"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("piedLien")}
          </Link>{" "}
          {t("piedFin")}
        </>
      }
    />
  );
}
