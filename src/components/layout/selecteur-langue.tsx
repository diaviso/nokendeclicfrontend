"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation";
import { LANGUES, routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Sélecteur de langue.
 *
 * Chaque entrée est un lien vers la même page dans l'autre langue, et non un
 * bouton qui change un réglage : l'adresse anglaise est visible, copiable et
 * indexable, et le navigateur peut la traiter comme une page à part entière.
 *
 * `usePathname` de `@/i18n/navigation` renvoie le chemin sans le préfixe de
 * langue — c'est ce qui permet de rester sur la page courante en changeant de
 * langue plutôt que de retomber sur l'accueil.
 */
export function SelecteurLangue({ className }: { className?: string }) {
  const t = useTranslations("commun");
  const locale = useLocale() as Locale;
  const chemin = usePathname();
  // Les filtres de la liste d'offres vivent dans la requête : sans eux, changer
  // de langue depuis « /offres?typeOffre=FORMATION » ramènerait à la liste
  // complète, ce qui se lit comme une perte de la recherche en cours.
  const requete = useSearchParams().toString();
  const destination = requete ? `${chemin}?${requete}` : chemin;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1.5 rounded-lg px-2", className)}
            aria-label={t("changerDeLangue")}
          >
            <Languages className="size-4" aria-hidden />
            <span className="text-xs font-semibold">
              {LANGUES[locale].court}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-36">
        {routing.locales.map((autre) => (
          <DropdownMenuItem
            key={autre}
            render={
              <Link href={destination} locale={autre} hrefLang={autre} />
            }
            className={cn(autre === locale && "font-semibold")}
          >
            {LANGUES[autre].nom}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
