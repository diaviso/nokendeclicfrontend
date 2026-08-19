"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallation } from "@/hooks/use-installation";

const CLE_REFUS = "noken.installDismissedAt";
/** Un refus vaut trois mois de silence — reproposer sans cesse est intrusif. */
const REPOS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Invite d'installation flottante.
 *
 * Elle complète la section de la page d'accueil : celle-ci s'adresse au
 * visiteur qui découvre le service, cette bannière rattrape celui qui navigue
 * déjà depuis un moment sans l'avoir vue.
 *
 * L'événement du navigateur n'est plus capté ici mais dans `useInstallation` :
 * `beforeinstallprompt` n'est émis qu'une fois, et deux écouteurs concurrents
 * s'excluraient l'un l'autre.
 */
export function InstallPrompt() {
  const { invitePrete, installee, installer } = useInstallation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!invitePrete || installee) return;

    const refusLe = Number(window.localStorage.getItem(CLE_REFUS) ?? 0);
    if (refusLe && Date.now() - refusLe < REPOS_MS) return;

    // Laisser le temps de voir la page avant de proposer quoi que ce soit.
    const minuteur = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(minuteur);
  }, [invitePrete, installee]);

  function refuser() {
    window.localStorage.setItem(CLE_REFUS, String(Date.now()));
    setVisible(false);
  }

  if (!visible || !invitePrete || installee) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-sm rounded-lg border bg-card p-4 shadow-lg lg:bottom-4 lg:left-auto lg:right-4 lg:mx-0"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10">
          <Download className="size-4 text-primary" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Installer Noken Declic</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Accès direct depuis votre écran d&apos;accueil, et consultation même
            sans connexion.
          </p>
        </div>
        <button
          onClick={refuser}
          aria-label="Fermer"
          className="-mr-1 -mt-1 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={refuser}>
          Plus tard
        </Button>
        <Button
          size="sm"
          onClick={async () => {
            setVisible(false);
            const accepte = await installer();
            // Un refus vaut réponse : on n'insiste pas avant trois mois.
            if (!accepte) refuser();
          }}
        >
          Installer
        </Button>
      </div>
    </div>
  );
}
