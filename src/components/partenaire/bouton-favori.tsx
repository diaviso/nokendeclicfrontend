"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { errorMessage, partenaireApi } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Liste des candidats déjà mis de côté.
 *
 * Un seul appel sert toute une page de résultats : chaque carte lit la même
 * entrée de cache au lieu d'interroger le serveur pour son propre compte.
 */
export function useIdentifiantsFavoris() {
  return useQuery({
    queryKey: ["partenaire", "favoris", "identifiants"],
    queryFn: partenaireApi.identifiantsFavoris,
    staleTime: 60 * 1000,
  });
}

function useRafraichir() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["partenaire", "favoris", "identifiants"],
      }),
      queryClient.invalidateQueries({ queryKey: ["partenaire", "favoris"] }),
    ]);
}

/**
 * Met un candidat de côté, ou l'en retire.
 *
 * Deux présentations pour un même geste : une pastille discrète au coin des
 * cartes de résultat, un bouton explicite sur la fiche. Le libellé dit l'état
 * courant plutôt que l'action à venir — « Mis de côté » se lit d'un coup d'œil
 * sur une liste, là où « Retirer » obligerait à raisonner à l'envers.
 */
export function BoutonFavori({
  candidatId,
  nom,
  estFavori,
  variante = "carte",
  className,
}: {
  candidatId: number;
  /** Sert aux libellés d'accessibilité et aux messages de confirmation. */
  nom: string;
  estFavori: boolean;
  variante?: "carte" | "complet";
  className?: string;
}) {
  const rafraichir = useRafraichir();

  const basculer = useMutation({
    mutationFn: () =>
      estFavori
        ? partenaireApi.retirerFavori(candidatId)
        : partenaireApi.ajouterFavori(candidatId),
    onSuccess: async () => {
      await rafraichir();
      toast.success(estFavori ? "Retiré de vos favoris" : "Profil mis de côté", {
        description: estFavori
          ? undefined
          : `${nom} vous attend dans « Candidats retenus ».`,
      });
    },
    onError: (error) =>
      toast.error("Action impossible", { description: errorMessage(error) }),
  });

  const Icone = basculer.isPending
    ? Loader2
    : estFavori
      ? BookmarkCheck
      : Bookmark;

  if (variante === "carte") {
    return (
      <button
        type="button"
        aria-pressed={estFavori}
        aria-label={
          estFavori ? `Retirer ${nom} de mes favoris` : `Mettre ${nom} de côté`
        }
        title={estFavori ? "Retirer de mes favoris" : "Mettre de côté"}
        disabled={basculer.isPending}
        onClick={() => basculer.mutate()}
        className={cn(
          "grid size-9 place-items-center rounded-xl border bg-background/80 backdrop-blur transition-all duration-200",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          estFavori
            ? "border-primary/40 text-primary"
            : "text-muted-foreground hover:border-primary/40 hover:text-primary",
          className,
        )}
      >
        <Icone
          className={cn("size-4", basculer.isPending && "animate-spin")}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={estFavori ? "secondary" : "outline"}
      aria-pressed={estFavori}
      className={cn("shrink-0 rounded-xl", className)}
      disabled={basculer.isPending}
      onClick={() => basculer.mutate()}
    >
      <Icone
        className={cn("size-4", basculer.isPending && "animate-spin")}
        aria-hidden
      />
      {estFavori ? "Mis de côté" : "Mettre de côté"}
    </Button>
  );
}

/**
 * Annotation privée attachée à un candidat retenu.
 *
 * L'écriture passe par le même point d'entrée que la mise en favori : côté
 * serveur c'est un `upsert`, si bien qu'annoter un profil pas encore retenu le
 * retient au passage. C'est le comportement attendu — on n'annote que ce qu'on
 * garde.
 */
export function BoutonNote({
  candidatId,
  nom,
  note,
  className,
}: {
  candidatId: number;
  nom: string;
  note?: string | null;
  className?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState(note ?? "");
  const rafraichir = useRafraichir();

  const enregistrer = useMutation({
    mutationFn: () => partenaireApi.ajouterFavori(candidatId, texte.trim()),
    onSuccess: async () => {
      await rafraichir();
      setOuvert(false);
      toast.success("Note enregistrée");
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", {
        description: errorMessage(error),
      }),
  });

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("rounded-lg text-muted-foreground", className)}
        onClick={() => {
          // Repart de la valeur enregistrée : rouvrir après avoir abandonné une
          // saisie ne doit pas ressusciter le brouillon.
          setTexte(note ?? "");
          setOuvert(true);
        }}
      >
        <PenLine className="size-4" aria-hidden />
        {note ? "Modifier ma note" : "Ajouter une note"}
      </Button>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Note sur {nom}</DialogTitle>
            <DialogDescription>
              Visible de vous seul. Ni le candidat ni les autres partenaires n&apos;y
              ont accès.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(evenement) => {
              evenement.preventDefault();
              enregistrer.mutate();
            }}
            className="space-y-4"
          >
            <Textarea
              autoFocus
              rows={4}
              maxLength={500}
              value={texte}
              onChange={(evenement) => setTexte(evenement.target.value)}
              placeholder="Bon profil pour le poste de mars, à rappeler après les entretiens."
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setOuvert(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={enregistrer.isPending}
              >
                {enregistrer.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
