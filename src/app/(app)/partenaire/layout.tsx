"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/**
 * Garde de l'espace partenaire.
 *
 * Aiguillage d'expérience uniquement : chaque route concernée est protégée
 * côté serveur par `RolesGuard`. Masquer l'interface évite d'afficher des
 * écrans qui ne renverraient que des 403.
 *
 * L'espace reste dans la coquille membre — un partenaire garde son CV, ses
 * favoris et sa messagerie. Seule la console d'administration est un lieu à
 * part.
 */
export default function PartenaireLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const refuse = Boolean(user && user.role !== "PARTENAIRE");

  useEffect(() => {
    if (refuse) router.replace("/dashboard");
  }, [refuse, router]);

  if (isLoading || !user || refuse) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Vérification des droits…</span>
      </div>
    );
  }

  return <>{children}</>;
}
