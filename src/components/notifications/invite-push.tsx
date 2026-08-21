"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, BellRing, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallation } from "@/hooks/use-installation";
import { useNotificationsPush } from "@/hooks/use-notifications-push";
import { jouerCarillon } from "@/lib/son-notification";
import { cn } from "@/lib/utils";

/**
 * L'invitation a été écartée : on ne la repropose pas.
 *
 * Stockée sur l'appareil, comme l'abonnement lui-même — refuser sur son
 * téléphone ne doit pas décider pour l'ordinateur.
 */
const CLE = "noken.invitePushEcartee";

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

function useEcartee() {
  return useSyncExternalStore(
    abonner,
    () => (ecartee() ? "1" : "0"),
    () => "1",
  ) === "1";
}

/**
 * Invitation à activer les notifications, posée sur le tableau de bord.
 *
 * Le réglage existait déjà, au bas de la page « Profil » : personne ne l'a
 * trouvé, et un seul appareil sur cinq cents était abonné. Une notification que
 * l'on doit aller chercher n'existe pas — l'invitation vient donc au-devant,
 * une fois, là où le regard passe.
 */
export function InvitePush() {
  const { etat, activer } = useNotificationsPush();
  const { installee, ios } = useInstallation();
  const cachee = useEcartee();

  // Sur iPhone non installé, l'invitation à l'installation dit déjà l'essentiel
  // et vient d'abord : empiler les deux cartes brouillerait l'ordre des gestes.
  if (ios && !installee) return null;

  // Rien à proposer si le navigateur ne sait pas, si c'est déjà actif, ou si la
  // personne a refusé — dans ce dernier cas seul le navigateur peut revenir en
  // arrière, et le dire ici serait un reproche sans issue.
  if (cachee || etat !== "a-activer") return null;

  return (
    <section
      className="entree relative mb-6 overflow-hidden rounded-2xl border bg-card"
      style={{ "--i": 1 } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          background:
            "radial-gradient(60% 120% at 15% 0%, var(--chart-4), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl"
            style={{
              background: "color-mix(in oklch, var(--chart-4) 14%, transparent)",
              color: "var(--chart-4)",
            }}
          >
            <BellRing className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold">
              Soyez prévenu des nouvelles offres
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Une alerte dès qu&apos;une opportunité correspond à votre profil,
              et à chaque réponse à vos messages. Réglable à tout moment.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            className="rounded-xl"
            onClick={async () => {
              const ok = await activer();
              if (ok) {
                jouerCarillon();
                toast.success("Notifications activées sur cet appareil");
              }
            }}
          >
            <Bell className="size-4" />
            Activer
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
  );
}

/**
 * Ligne d'activation, en pied du panneau de la cloche.
 *
 * C'est là qu'on regarde quand on se demande pourquoi rien n'arrive : autant
 * que la réponse s'y trouve.
 */
export function LignePush({ className }: { className?: string }) {
  const { etat, activer } = useNotificationsPush();
  const { installee, ios } = useInstallation();

  // Safari ne sait pousser que depuis une application installée. Ne rien
  // afficher laissait l'utilisateur d'iPhone chercher un réglage introuvable :
  // mieux vaut nommer la condition.
  if (etat === "indisponible") {
    if (!ios || installee) return null;
    return (
      <p
        className={cn(
          "px-3 py-2.5 text-xs leading-relaxed text-muted-foreground",
          className,
        )}
      >
        Sur iPhone, les notifications demandent d&apos;ajouter Noken à
        l&apos;écran d&apos;accueil : touchez Partager, puis « Sur l&apos;écran
        d&apos;accueil ».
      </p>
    );
  }

  if (etat === "activee") {
    return (
      <Link
        href="/profil"
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent",
          className,
        )}
      >
        <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
        Notifications actives sur cet appareil — les régler
      </Link>
    );
  }

  if (etat === "refusee") {
    return (
      <p
        className={cn(
          "px-3 py-2.5 text-xs leading-relaxed text-muted-foreground",
          className,
        )}
      >
        Les notifications sont bloquées pour ce site. Elles se rétablissent
        depuis les réglages du navigateur, à la ligne « Notifications ».
      </p>
    );
  }

  return (
    <button
      onClick={async () => {
        const ok = await activer();
        if (ok) {
          jouerCarillon();
          toast.success("Notifications activées sur cet appareil");
        }
      }}
      disabled={etat === "en-cours"}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-primary transition-colors hover:bg-accent",
        className,
      )}
    >
      {etat === "en-cours" ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Bell className="size-3.5 shrink-0" aria-hidden />
      )}
      Activer les notifications sur cet appareil
    </button>
  );
}
