"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CaseCgu } from "@/components/legal/case-cgu";
import { authApi, errorMessage } from "@/lib/api";
import { CGU_VERSION } from "@/lib/cgu";
import type { User } from "@/lib/types";
import { AUTH_QUERY_KEY, useAuth } from "@/hooks/use-auth";

/**
 * Garantie d'acceptation des conditions générales.
 *
 * Le formulaire d'inscription contient déjà la case, mais il ne couvre pas
 * tous les chemins : une inscription par Google depuis l'onglet « Connexion »
 * crée un compte sans passer par ce formulaire, et les comptes antérieurs à la
 * publication du texte n'ont jamais rien accepté. Cette boîte rattrape ces cas.
 *
 * Elle est volontairement bloquante — sans croix ni fermeture au clic à
 * l'extérieur. Un consentement que l'on peut écarter d'un geste n'en est pas
 * un ; la seule autre issue offerte est la déconnexion.
 */
export function GardeCgu() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [coche, setCoche] = useState(false);
  const [erreur, setErreur] = useState<string | undefined>();

  const accepter = useMutation({
    mutationFn: () => authApi.accepterCgu(),
    onSuccess: (resultat) => {
      // Le cache est mis à jour avec ce que le serveur vient de confirmer,
      // plutôt que relancé sur `/auth/me`. Une relecture réseau pourrait
      // échouer après un enregistrement pourtant réussi : la boîte resterait
      // affichée et l'utilisateur verrait une erreur alors que son accord est
      // consigné. Ici, la fermeture est immédiate et ne dépend de rien.
      queryClient.setQueryData<User>(AUTH_QUERY_KEY, (precedent) =>
        precedent
          ? {
              ...precedent,
              cguVersion: resultat.cguVersion,
              cguAccepteeLe: resultat.cguAccepteeLe,
            }
          : precedent,
      );
      toast.success("Merci — conditions acceptées");
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", {
        description: errorMessage(error),
      }),
  });

  // Rien à demander tant que l'utilisateur n'est pas chargé, ou si la version
  // qu'il a acceptée est celle en vigueur.
  if (!user) return null;
  if (user.cguVersion === CGU_VERSION) return null;

  const dejaAcceptePlusAncienne = Boolean(user.cguVersion);

  return (
    // `open` est piloté et `onOpenChange` ignore toute demande : la boîte ne
    // peut se fermer ni au clic extérieur, ni à Échap, ni par une croix. La
    // décision doit être prise — la seule autre issue est la déconnexion.
    <Dialog open onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <span className="mb-1 grid size-11 place-items-center rounded-2xl bg-primary/10">
            <ShieldCheck className="size-5.5 text-primary" aria-hidden />
          </span>
          <DialogTitle>
            {dejaAcceptePlusAncienne
              ? "Nos conditions ont évolué"
              : "Avant de continuer"}
          </DialogTitle>
          <DialogDescription>
            {dejaAcceptePlusAncienne
              ? "Une nouvelle version des conditions générales est entrée en vigueur. Merci d'en prendre connaissance pour poursuivre."
              : "Votre compte a été créé avant la publication de nos conditions générales. Merci de les accepter pour continuer à utiliser la plateforme."}
          </DialogDescription>
        </DialogHeader>

        <CaseCgu
          coche={coche}
          onChange={(valeur) => {
            setCoche(valeur);
            if (valeur) setErreur(undefined);
          }}
          erreur={erreur}
        />

        <div className="mt-2 flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => logout()}
          >
            Se déconnecter
          </Button>
          <Button
            className="rounded-xl"
            disabled={accepter.isPending}
            onClick={() => {
              if (!coche) {
                setErreur(
                  "Cochez la case pour confirmer votre acceptation.",
                );
                return;
              }
              accepter.mutate();
            }}
          >
            {accepter.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Accepter et continuer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
