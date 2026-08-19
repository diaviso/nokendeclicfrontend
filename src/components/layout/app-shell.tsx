"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { Logo } from "./logo";
import { GardeCgu } from "@/components/legal/garde-cgu";
import { EcoutePush } from "@/components/notifications/ecoute-push";
import { useAuth } from "@/hooks/use-auth";
import { tokenStore } from "@/lib/api";
import type { Role } from "@/lib/types";

/**
 * Coquille de l'espace connecté.
 *
 * La garde est côté client : le backend renvoie les jetons dans le corps de
 * réponse (constat H1 de l'audit), il n'y a donc pas de cookie lisible par le
 * serveur. Ce n'est pas un contrôle de sécurité — chaque route de l'API est
 * protégée indépendamment — mais un aiguillage d'expérience utilisateur.
 */
export function AppShell({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: Role;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const hasToken = typeof window !== "undefined" && Boolean(tokenStore.access);
  const denied = Boolean(user && requiredRole && user.role !== requiredRole);

  useEffect(() => {
    if (denied) {
      router.replace("/dashboard");
      return;
    }
    if (hasToken && (isLoading || user)) return;

    // La destination demandée est transmise à la connexion : sans elle, un
    // visiteur arrivant sur un lien partagé se retrouverait sur le tableau de
    // bord après s'être connecté, sans savoir où était passée la page.
    //
    // L'adresse est lue sur `window` et non via `useSearchParams` : ce hook
    // impose une frontière Suspense et ferait échouer le prérendu statique de
    // toutes les pages de l'espace connecté, qui traversent cette coquille.
    const destination = window.location.pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(destination)}`);
  }, [hasToken, isLoading, user, denied, router]);

  if (isLoading || !user || denied) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Barre latérale fixe à partir de lg */}
      {/* Toute la coquille disparaît à l'impression : sur une page destinée
          au papier — un CV, un rapport — la navigation ne serait qu'un bandeau
          parasite en tête de première page. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block print:hidden">
        <div className="flex h-14 items-center border-b px-4">
          <Logo href="/dashboard" />
        </div>
        <ScrollArea className="h-[calc(100dvh-3.5rem)]">
          <SidebarNav />
        </ScrollArea>
      </aside>

      <div className="lg:pl-64 print:pl-0">
        <div className="print:hidden">
          <Topbar />
        </div>
        {/* pb-20 laisse la place à la navigation basse mobile */}
        <main className="px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pb-10 print:p-0">
          {children}
        </main>
      </div>

      <div className="print:hidden">
        <MobileNav />
      </div>
      <GardeCgu />
      <EcoutePush />
    </div>
  );
}
