"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tokenStore } from "@/lib/api";
import { AUTH_QUERY_KEY } from "@/hooks/use-auth";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const handled = useRef(false);

  // L'absence de jeton se déduit de l'URL pendant le rendu : la stocker dans un
  // état alimenté par un effet ajouterait un rendu et ferait clignoter l'écran
  // de chargement avant le message d'erreur.
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const failed = !accessToken;

  useEffect(() => {
    if (handled.current || !accessToken) return;
    handled.current = true;

    tokenStore.set(accessToken, refreshToken ?? undefined);

    // Les jetons transitent dans l'URL (constat H1 de l'audit, non corrigé côté
    // backend). On les efface au moins de l'historique du navigateur : sans
    // cela ils restent visibles dans la barre d'adresse et dans l'historique.
    window.history.replaceState(null, "", "/auth/callback");

    void queryClient
      .invalidateQueries({ queryKey: AUTH_QUERY_KEY })
      .finally(() => router.replace("/dashboard"));
  }, [accessToken, refreshToken, queryClient, router]);

  if (failed) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="max-w-sm text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-lg border bg-muted/40">
            <ShieldAlert className="size-5 text-destructive" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            Connexion interrompue
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            La réponse du fournisseur d&apos;identité ne contenait pas de jeton
            valide. Réessayez depuis la page de connexion.
          </p>
          <Button className="mt-6 w-full" render={<Link href="/login" />}>
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="text-center">
        <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Finalisation de la connexion…
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
