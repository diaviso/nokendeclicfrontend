"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Frontière d'erreur applicative.
 *
 * L'ancien front n'en avait aucune : une exception de rendu produisait un écran
 * blanc, sans message ni moyen de repartir — c'est exactement ce qui s'était
 * produit lors de l'ajout du type PROGRAMME.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur de rendu :", error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-lg border bg-muted/40">
          <AlertTriangle className="size-6 text-destructive" aria-hidden />
        </span>

        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          Quelque chose s&apos;est mal passé
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          L&apos;affichage de cette page a échoué. Vous pouvez réessayer sans
          perdre votre session.
        </p>

        {error.digest ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Référence : <code className="rounded bg-muted px-1">{error.digest}</code>
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={reset}>
            <RefreshCw className="size-4" />
            Réessayer
          </Button>
          <Button variant="outline" className="flex-1" render={<Link href="/dashboard" />}>
            <Home className="size-4" />
            Tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
}
