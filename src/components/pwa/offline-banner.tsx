"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

/**
 * Bandeau permanent tant que le navigateur se déclare hors ligne.
 *
 * Sans ce signal, une action qui échoue faute de réseau se présente comme une
 * erreur applicative — l'utilisateur croit à un bug plutôt qu'à une coupure.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-foreground px-3 py-1.5 text-xs font-medium text-background"
    >
      <WifiOff className="size-3.5" aria-hidden />
      Mode hors ligne — les modifications ne seront pas enregistrées
    </div>
  );
}
