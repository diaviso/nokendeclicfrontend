"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInstallation } from "@/hooks/use-installation";

/**
 * Refus mémorisé sur l'appareil.
 *
 * Comme l'installation elle-même : refuser sur son téléphone ne dit rien de ce
 * qu'on veut sur sa tablette.
 */
const CLE = "noken.inviteInstallEcartee";

const abonnes = new Set<() => void>();

function ecartee() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CLE) === "1";
}

function ecarter() {
  window.localStorage.setItem(CLE, "1");
  abonnes.forEach((rappel) => rappel());
}

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

const ETAPES_IOS = [
  { icone: Share, texte: "Touchez l'icône Partager, en bas de Safari." },
  { icone: Download, texte: "Choisissez « Sur l'écran d'accueil »." },
  { icone: Check, texte: "Confirmez avec « Ajouter »." },
];

const ETAPES_AUTRES = [
  { icone: Share, texte: "Ouvrez le menu de votre navigateur." },
  {
    icone: Download,
    texte: "Choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil ».",
  },
  { icone: Check, texte: "Confirmez : l'icône apparaît aussitôt." },
];

/**
 * Invitation à installer, posée dans l'application.
 *
 * La page d'accueil en propose déjà une, mais elle ne s'adresse qu'au visiteur
 * de passage : quelqu'un qui s'est inscrit et va droit à son tableau de bord ne
 * la voit jamais. Or sur iPhone l'installation conditionne les notifications —
 * sans elle, Safari ne sait tout simplement pas les recevoir.
 */
export function InviteInstallation() {
  const { invitePrete, installee, ios, installer } = useInstallation();
  const [aideOuverte, setAideOuverte] = useState(false);
  const cachee =
    useSyncExternalStore(
      abonner,
      () => (ecartee() ? "1" : "0"),
      () => "1",
    ) === "1";

  // Rien à proposer si c'est déjà fait. Ailleurs qu'sur iOS, on attend que le
  // navigateur signale l'installation possible : l'inviter alors qu'il la
  // refusera enverrait vers une marche à suivre sans effet.
  if (installee || cachee || (!invitePrete && !ios)) return null;

  const etapes = ios ? ETAPES_IOS : ETAPES_AUTRES;

  return (
    <>
      <section
        className="entree relative mb-6 overflow-hidden rounded-2xl border bg-card"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background:
              "radial-gradient(60% 120% at 15% 0%, var(--primary), transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold">
                Installez Noken sur votre écran d&apos;accueil
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Ouverture directe, consultation hors connexion
                {ios ? (
                  <>
                    {" "}
                    — et c&apos;est la condition pour recevoir les
                    notifications sur iPhone.
                  </>
                ) : (
                  <> et notifications même navigateur fermé.</>
                )}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              className="rounded-xl"
              onClick={async () => {
                if (invitePrete) {
                  await installer();
                  return;
                }
                setAideOuverte(true);
              }}
            >
              <Download className="size-4" />
              {invitePrete ? "Installer" : "Comment faire"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={ecarter}
              aria-label="Ne plus proposer"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={aideOuverte} onOpenChange={setAideOuverte}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Installer en quelques gestes</DialogTitle>
            <DialogDescription>
              {ios
                ? "Sur iPhone et iPad, l'installation se fait depuis le menu de partage de Safari."
                : "Depuis le menu de votre navigateur, sur téléphone comme sur ordinateur."}
            </DialogDescription>
          </DialogHeader>

          <ol className="space-y-3">
            {etapes.map((etape, rang) => {
              const Icone = etape.icone;
              return (
                <li key={rang} className="flex min-w-0 items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
                    <Icone className="size-4 text-muted-foreground" aria-hidden />
                  </span>
                  <p className="min-w-0 pt-1.5 text-sm">
                    <span className="font-semibold">Étape {rang + 1}.</span>{" "}
                    {etape.texte}
                  </p>
                </li>
              );
            })}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
