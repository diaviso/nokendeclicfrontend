"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Enregistre le service worker et propose la mise à jour quand une nouvelle
 * version est prête.
 *
 * L'activation n'est jamais forcée en silence : recharger sous les doigts de
 * quelqu'un en train de remplir un formulaire lui ferait perdre sa saisie.
 */
export function ServiceWorkerManager() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (cancelled) return;

        // Une version déjà en attente au chargement de la page.
        if (registration.waiting) setWaiting(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // `controller` non nul signifie qu'un SW contrôlait déjà la page :
            // il s'agit donc d'une mise à jour, pas d'une première installation.
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaiting(installing);
            }
          });
        });
      } catch {
        // Un échec d'enregistrement ne doit pas remonter à l'utilisateur :
        // l'application fonctionne sans service worker.
      }
    };

    void register();

    // Le nouveau SW a pris la main : on recharge pour servir la version à jour.
    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  if (!waiting) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-lg border bg-card p-3 shadow-lg lg:bottom-4 lg:left-auto lg:right-4 lg:mx-0"
    >
      <RefreshCw className="size-4 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 flex-1 text-sm">
        Une nouvelle version est disponible.
      </p>
      <Button
        size="sm"
        onClick={() => {
          waiting.postMessage("SKIP_WAITING");
          setWaiting(null);
        }}
      >
        Actualiser
      </Button>
    </div>
  );
}
