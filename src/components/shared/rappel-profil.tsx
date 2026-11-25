"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { champsManquants, completionProfil, SEUIL_PROFIL } from "@/lib/profil";

const EVENEMENT = "noken:rappel-profil";

/**
 * Délai minimal entre deux rappels déclenchés par un clic : sans lui, ouvrir
 * une offre puis toucher « J'aime » ferait surgir la fenêtre deux fois de
 * suite, ce qui ne convainc plus, ça bloque.
 */
const PAUSE_ENTRE_CLICS_MS = 20_000;

/**
 * Demande faite avant que le compte soit chargé : en arrivant directement sur
 * une offre, la page demande le rappel avant que l'on sache qui est connecté.
 */
let demandeEnAttente = false;

/** Demande un rappel, par exemple à l'ouverture d'une offre. */
export function rappelerProfil() {
  demandeEnAttente = true;
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Déclenche un rappel à l'affichage de la page qui l'inclut. */
export function RappelALaVue() {
  useEffect(() => {
    rappelerProfil();
    // Quitter la page annule une demande restée sans suite : elle ne doit
    // pas resurgir ailleurs.
    return () => {
      demandeEnAttente = false;
    };
  }, []);
  return null;
}

/**
 * Relance les membres dont le profil est rempli à moins de 80 % : à chaque
 * offre ouverte, et à chaque bouton d'action touché dans une zone marquée
 * `data-rappel-profil`. L'action n'est pas bloquée : on veut un profil
 * complet, pas une candidature perdue.
 *
 * Monté une fois pour toute l'application. Le clic est écouté au niveau du
 * document plutôt que bouton par bouton : marquer une zone suffit, et un bouton
 * ajouté plus tard dans une offre est couvert sans y penser.
 */
export function RappelProfil() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const dernierRappel = useRef(0);

  const completion = completionProfil(user);
  const concerne =
    user?.role === "MEMBRE" &&
    completion < SEUIL_PROFIL &&
    !pathname.startsWith("/profil");

  useEffect(() => {
    if (!concerne) return;

    const ouvrir = () => {
      demandeEnAttente = false;
      dernierRappel.current = Date.now();
      setOuvert(true);
    };

    const surClic = (event: MouseEvent) => {
      const cible = event.target as Element | null;
      if (!cible?.closest?.("[data-rappel-profil]")) return;
      if (!cible.closest('button, [data-slot="button"], [role="button"]')) return;
      if (Date.now() - dernierRappel.current < PAUSE_ENTRE_CLICS_MS) return;
      ouvrir();
    };

    window.addEventListener(EVENEMENT, ouvrir);
    document.addEventListener("click", surClic, true);
    if (demandeEnAttente) ouvrir();
    return () => {
      window.removeEventListener(EVENEMENT, ouvrir);
      document.removeEventListener("click", surClic, true);
    };
  }, [concerne]);

  if (!concerne) return null;

  const manquants = champsManquants(user);

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 grid size-12 place-items-center rounded-2xl bg-primary/10">
            <UserCircle className="size-6 text-primary" aria-hidden />
          </span>
          <DialogTitle>
            Votre profil n&apos;est rempli qu&apos;à {completion} %
          </DialogTitle>
          <DialogDescription>
            Les recruteurs et l&apos;équipe Noken ne peuvent pas vous proposer
            d&apos;opportunités adaptées sans ces informations. Deux minutes
            suffisent.
          </DialogDescription>
        </DialogHeader>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={completion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Complétion du profil"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>

        {manquants.length ? (
          <div>
            <p className="mb-2 text-sm font-medium">À compléter :</p>
            <ul className="flex flex-wrap gap-1.5">
              {manquants.map((libelle) => (
                <li
                  key={libelle}
                  className="rounded-lg bg-muted px-2 py-1 text-xs font-medium"
                >
                  {libelle}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOuvert(false)}>
            Plus tard
          </Button>
          <Button
            render={<Link href="/profil" />}
            onClick={() => setOuvert(false)}
          >
            Compléter mon profil
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
