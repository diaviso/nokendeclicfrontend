"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorMessage, favoritesApi } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Bascule de favori.
 *
 * L'état affiché est optimiste : le cœur réagit à l'instant du clic, sans
 * attendre la réponse du serveur. Sur une connexion lente, un cœur qui ne bouge
 * qu'après l'aller-retour donne l'impression que le clic n'a pas été pris.
 * L'état local est rétabli si l'appel échoue.
 */
export function FavoriteButton({
  offreId,
  isFavorite,
  className,
}: {
  offreId: number;
  isFavorite: boolean;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [optimiste, setOptimiste] = useState<boolean | null>(null);
  const [pulse, setPulse] = useState(false);

  const actif = optimiste ?? isFavorite;

  const mutation = useMutation({
    mutationFn: (prochain: boolean) =>
      prochain ? favoritesApi.add(offreId) : favoritesApi.remove(offreId),
    onSuccess: (_donnees, prochain) => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(prochain ? "Ajouté aux favoris" : "Retiré des favoris");
    },
    onError: (error) => {
      setOptimiste(null);
      toast.error("Action impossible", { description: errorMessage(error) });
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={mutation.isPending}
      aria-pressed={actif}
      aria-label={actif ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const prochain = !actif;
        setOptimiste(prochain);
        if (prochain) {
          setPulse(true);
          window.setTimeout(() => setPulse(false), 450);
        }
        mutation.mutate(prochain);
      }}
      className={cn("relative size-9 rounded-full", className)}
    >
      {/* Onde émise au moment où l'offre est mise en favori. */}
      {pulse ? (
        <span
          aria-hidden
          className="anim-pulse-ring absolute inset-1 rounded-full border-2 border-primary"
          style={{ animationIterationCount: 1 } as React.CSSProperties}
        />
      ) : null}

      <Heart
        className={cn(
          "size-4.5 transition-all duration-300",
          actif
            ? "scale-110 fill-primary text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      />
    </Button>
  );
}
