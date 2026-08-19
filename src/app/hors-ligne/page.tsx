"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function OfflinePage() {
  const router = useRouter();
  const online = useOnlineStatus();

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm text-center">
        <Logo className="mx-auto mb-8 w-fit" />

        <span className="mx-auto grid size-14 place-items-center rounded-lg border bg-muted/40">
          <WifiOff className="size-6 text-muted-foreground" aria-hidden />
        </span>

        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          Pas de connexion
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n&apos;est pas disponible hors ligne. Les pages déjà
          consultées restent accessibles.
        </p>

        {online ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            La connexion est revenue.
          </p>
        ) : null}

        <Button className="mt-6 w-full" onClick={() => router.refresh()}>
          <RefreshCw className="size-4" />
          Réessayer
        </Button>
      </div>
    </div>
  );
}
