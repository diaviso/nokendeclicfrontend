"use client";

import { useState } from "react";
import {
  Check,
  Download,
  Share,
  Smartphone,
  WifiOff,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstallation } from "@/hooks/use-installation";

/* Les libellés vivent dans le catalogue de traductions ; seule l'icône et la
   clé du texte restent ici. */
const ATOUTS = [
  { icone: Smartphone, cle: "ecran" },
  { icone: WifiOff, cle: "horsLigne" },
  { icone: Zap, cle: "rapide" },
] as const;

const ETAPES_IOS = [
  { icone: Share, cle: "iosEtape1" },
  { icone: Download, cle: "iosEtape2" },
  { icone: Check, cle: "iosEtape3" },
] as const;

const ETAPES_AUTRES = [
  { icone: Share, cle: "autreEtape1" },
  { icone: Download, cle: "autreEtape2" },
  { icone: Check, cle: "autreEtape3" },
] as const;

/**
 * Invitation à installer l'application, sur la page d'accueil.
 *
 * La section reste affichée même quand le navigateur ne propose pas
 * d'installation automatique : sur iOS, `beforeinstallprompt` n'existe pas, et
 * sur un ordinateur l'invite dépend de critères d'engagement propres au
 * navigateur. La masquer dans ces cas la rendrait invisible pour une bonne part
 * des visiteurs — on bascule donc sur la marche à suivre manuelle plutôt que de
 * disparaître.
 *
 * Seule exception : l'application déjà installée, où la proposition n'a plus
 * d'objet.
 */
export function SectionInstallation() {
  const t = useTranslations("installation");
  const { invitePrete, installee, ios, installer } = useInstallation();
  const [aideOuverte, setAideOuverte] = useState(false);
  const [installEnCours, setInstallEnCours] = useState(false);

  if (installee) return null;

  async function auClic() {
    if (invitePrete) {
      setInstallEnCours(true);
      await installer();
      setInstallEnCours(false);
      return;
    }
    // Pas d'invite disponible : on explique comment faire à la main.
    setAideOuverte(true);
  }

  const etapes = ios ? ETAPES_IOS : ETAPES_AUTRES;

  return (
    <section className="border-b bg-muted/25 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
          {/* Halo de marque : il donne du relief sans nuire au contraste. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full opacity-[0.10] blur-3xl"
            style={{ background: "var(--primary)" }}
          />

          <div className="relative grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur">
                <Smartphone className="size-4 text-primary" aria-hidden />
                {t("badge")}
              </span>

              <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                {t("titre")}
              </h2>

              <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {t("texte")}
              </p>

              <ul className="mt-7 space-y-3.5">
                {ATOUTS.map((atout) => {
                  const Icone = atout.icone;
                  return (
                    <li key={atout.cle} className="flex items-start gap-3.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icone className="size-4.5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">
                          {t(`${atout.cle}Titre`)}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {t(`${atout.cle}Texte`)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="shine relative overflow-hidden rounded-xl text-base"
                  disabled={installEnCours}
                  onClick={auClic}
                >
                  <Download className="size-5" />
                  {installEnCours
                    ? t("enCours")
                    : invitePrete
                      ? t("installer")
                      : t("commentInstaller")}
                </Button>

                {invitePrete ? (
                  <button
                    type="button"
                    onClick={() => setAideOuverte(true)}
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {t("manuelle")}
                  </button>
                ) : null}
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                Gratuit · aucun téléchargement depuis un magasin · fonctionne sur
                Android et iPhone
              </p>
            </div>

            {/* Aperçu : un téléphone stylisé, dessiné en CSS. Aucune image à
                télécharger pour illustrer une section qui vante la légèreté. */}
            <div className="relative mx-auto hidden w-full max-w-[248px] lg:block">
              <div className="relative aspect-[9/19] rounded-[2.2rem] border-8 border-foreground/85 bg-background shadow-2xl">
                <span
                  aria-hidden
                  className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-foreground/85"
                />
                <div className="flex h-full flex-col gap-2.5 overflow-hidden rounded-[1.6rem] p-3 pt-7">
                  <div className="flex items-center gap-2">
                    <span className="size-7 shrink-0 rounded-lg bg-primary" />
                    <span className="h-2.5 w-24 rounded-full bg-foreground/15" />
                  </div>
                  <div className="mt-1 h-16 rounded-xl bg-primary/12" />
                  {[0, 1, 2].map((rang) => (
                    <div key={rang} className="rounded-xl border p-2.5">
                      <span className="block h-2 w-3/4 rounded-full bg-foreground/15" />
                      <span className="mt-1.5 block h-2 w-1/2 rounded-full bg-foreground/10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marche à suivre manuelle, adaptée à la plateforme. */}
      <Dialog open={aideOuverte} onOpenChange={setAideOuverte}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("aideTitre")}</DialogTitle>
            <DialogDescription>
              {ios
                ? t("aideIos")
                : t("aideAutre")}
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3.5">
            {etapes.map((etape, rang) => {
              const Icone = etape.icone;
              return (
                <li key={etape.cle} className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icone className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 pt-1 text-sm leading-relaxed">
                    <strong className="font-semibold">
                      {t("etape", { n: rang + 1 })}{" "}
                    </strong>
                    {t(etape.cle)}
                  </span>
                </li>
              );
            })}
          </ol>
        </DialogContent>
      </Dialog>
    </section>
  );
}
