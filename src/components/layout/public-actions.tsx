"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { fileUrl } from "@/lib/api";

/**
 * Actions de l'en-tête public.
 *
 * Les pages publiques sont rendues côté serveur, qui ignore tout de la session
 * — celle-ci vit dans le stockage local. Sans ce composant client, un membre
 * déjà connecté arrivant sur une page d'offre lisait « Se connecter » alors
 * qu'il venait de son espace : de quoi croire que sa session a sauté.
 *
 * Pendant la vérification du jeton, les deux boutons restent affichés : c'est
 * l'état le plus fréquent (un visiteur), et il évite un remplacement visible
 * juste après le chargement.
 */
export function PublicActions() {
  const { user, isLoading } = useAuth();

  if (user && !isLoading) {
    return (
      <>
        <Button
          size="sm"
          className="rounded-lg"
          render={<Link href="/dashboard" />}
        >
          <LayoutDashboard className="size-4" />
          <span className="hidden sm:inline">Mon espace</span>
        </Button>

        <Link
          href="/profil"
          aria-label="Mon profil"
          className="rounded-full transition-opacity hover:opacity-80"
        >
          <Avatar className="size-8">
            <AvatarImage src={fileUrl(user.pictureUrl)} alt="" />
            <AvatarFallback className="text-xs">
              {(user.firstName?.[0] ?? user.username[0] ?? "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="hidden sm:inline-flex"
        render={<Link href="/login" />}
      >
        Se connecter
      </Button>
      <Button size="sm" className="rounded-lg" render={<Link href="/login?mode=register" />}>
        Créer un compte
      </Button>
    </>
  );
}
