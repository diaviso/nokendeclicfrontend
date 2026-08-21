"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  BellRing,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Share,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useInstallation } from "@/hooks/use-installation";
import {
  detecterNavigateurIntegre,
  lienChromeAndroid,
  NOMS,
  type Embarqueur,
} from "@/lib/navigateur-integre";

/** Cible du QR code et de la copie : l'origine canonique, jamais un alias. */
const ADRESSE = "https://www.noken.app/installer";

/**
 * L'agent utilisateur ne change pas en cours de vie : l'abonnement n'a rien à
 * signaler. Il est déclaré hors du composant pour garder une identité stable
 * d'un rendu à l'autre.
 */
const IMMUABLE = () => () => {};

/** Instantané serveur : on ne sait pas encore, et on ne devine pas. */
const INCONNU = () => null;

function estMobile(): boolean {
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    navigator.maxTouchPoints > 1
  );
}

/**
 * Page d'installation, destination du QR code.
 *
 * Elle existe parce qu'un QR doit tomber sur une réponse immédiate. La section
 * équivalente de la page d'accueil arrive après une dizaine d'autres : on la
 * dépasserait sans la voir.
 *
 * Quatre situations, une seule affichée : navigateur intégré (rien n'est
 * possible avant d'en sortir), application déjà installée, mobile, ordinateur.
 */
export function EcranInstallation() {
  const t = useTranslations("installer");
  const { invitePrete, installee, ios, installer } = useInstallation();

  const [copie, setCopie] = useState(false);
  const [enCours, setEnCours] = useState(false);

  // L'appareil et le navigateur se lisent hors de React : l'information
  // n'existe pas au rendu serveur, et la poser dans un effet provoquerait un
  // second rendu visible. Les instantanés renvoient des valeurs simples, donc
  // stables d'un appel à l'autre.
  const integre = useSyncExternalStore<Embarqueur | null>(
    IMMUABLE,
    detecterNavigateurIntegre,
    INCONNU,
  );
  const surMobile = useSyncExternalStore<boolean | null>(
    IMMUABLE,
    estMobile,
    INCONNU,
  );

  async function copier() {
    try {
      await navigator.clipboard.writeText(ADRESSE);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      // Presse-papiers refusé : l'adresse reste lisible et sélectionnable
      // juste au-dessus du bouton.
    }
  }

  const chrome = integre ? lienChromeAndroid(ADRESSE) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t("badge")}
      </span>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {installee ? t("dejaInstallee") : t("titre")}
      </h1>

      <p className="mt-3 text-pretty text-muted-foreground">
        {installee ? t("dejaTexte") : t("texte")}
      </p>

      <div className="mt-8">
        {installee ? (
          <Button
            size="lg"
            className="rounded-xl"
            render={<Link href="/dashboard" />}
          >
            {t("ouvrir")}
          </Button>
        ) : integre ? (
          <Encart icone={ExternalLink} titre={t("integreTitre")} accent>
            <p className="text-sm text-muted-foreground">
              {t("integreTexte", { application: NOMS[integre] })}
            </p>

            <p className="mt-3 break-all rounded-lg border bg-muted/50 px-3 py-2 font-mono text-xs">
              {ADRESSE}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {chrome ? (
                <Button className="rounded-xl" render={<a href={chrome} />}>
                  <ExternalLink className="size-4" />
                  {t("integreChrome")}
                </Button>
              ) : null}
              <Button variant="outline" className="rounded-xl" onClick={copier}>
                {copie ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copie ? t("copie") : t("copier")}
              </Button>
            </div>

            {!chrome ? (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t("integreMenu")}
              </p>
            ) : null}
          </Encart>
        ) : surMobile === false ? (
          <Encart icone={Smartphone} titre={t("bureauTitre")}>
            <p className="text-sm text-muted-foreground">{t("bureauTexte")}</p>

            {/* Fond blanc en toute circonstance : un QR se lit sombre sur
                clair, et le thème sombre le rendrait inutilisable. */}
            <div className="mt-4 w-fit rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <Image
                src="/qr-installation.svg"
                alt={t("qrAlt")}
                width={196}
                height={196}
                unoptimized
              />
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {t("bureauAdresse")}
            </p>
            <p className="mt-1 break-all font-mono text-sm">{ADRESSE}</p>
          </Encart>
        ) : invitePrete ? (
          <Button
            size="lg"
            className="rounded-xl"
            disabled={enCours}
            onClick={async () => {
              setEnCours(true);
              await installer();
              setEnCours(false);
            }}
          >
            {enCours ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {enCours ? t("installEnCours") : t("boutonInstaller")}
          </Button>
        ) : surMobile === null ? (
          // Le temps d'un tour : afficher la marche à suivre manuelle avant de
          // savoir sur quel appareil on se trouve la ferait remplacer aussitôt.
          <div className="h-11" aria-hidden />
        ) : (
          <Encart
            icone={ios ? Share : Download}
            titre={ios ? t("iosTitre") : t("autreTitre")}
          >
            <p className="text-sm text-muted-foreground">
              {ios ? t("iosIntro") : t("autreIntro")}
            </p>
            <ol className="mt-4 space-y-3">
              {[1, 2, 3].map((rang) => (
                <li key={rang} className="flex min-w-0 items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold tabular-nums text-primary">
                    {rang}
                  </span>
                  <span className="min-w-0 text-sm">
                    {ios
                      ? t(`iosEtape${rang}` as "iosEtape1")
                      : t(`autreEtape${rang}` as "autreEtape1")}
                  </span>
                </li>
              ))}
            </ol>
          </Encart>
        )}
      </div>

      {!installee ? (
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ATOUTS.map(({ icone: Icone, titre, texte }) => (
            <li key={titre} className="rounded-2xl border bg-card p-4">
              <Icone className="size-5 text-primary" aria-hidden />
              <h2 className="mt-2.5 text-sm font-bold">{t(titre)}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t(texte)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <section className="mt-8 rounded-2xl border border-dashed p-5">
        <h2 className="text-sm font-bold">{t("notifTitre")}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {t("notifTexte")}
        </p>
      </section>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("retour")}
      </Link>
    </div>
  );
}

const ATOUTS = [
  {
    icone: Smartphone,
    titre: "atoutEcranTitre",
    texte: "atoutEcranTexte",
  },
  {
    icone: WifiOff,
    titre: "atoutHorsLigneTitre",
    texte: "atoutHorsLigneTexte",
  },
  {
    icone: BellRing,
    titre: "atoutAlertesTitre",
    texte: "atoutAlertesTexte",
  },
] as const;

function Encart({
  icone: Icone,
  titre,
  accent,
  children,
}: {
  icone: React.ElementType;
  titre: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        accent
          ? "rounded-2xl border border-primary/30 bg-primary/5 p-5"
          : "rounded-2xl border bg-card p-5"
      }
    >
      <div className="flex items-center gap-2.5">
        <Icone className="size-5 shrink-0 text-primary" aria-hidden />
        <h2 className="text-base font-bold">{titre}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
