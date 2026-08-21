"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fileUrl } from "@/lib/api";
import { fullName } from "@/lib/format";
import { ROLE_BADGE, roleLabel } from "@/lib/enums";
import { cn } from "@/lib/utils";
import type { ProfilGroupe } from "@/lib/types";

export function initialesDe(personne: {
  firstName?: string | null;
  lastName?: string | null;
  username: string;
}) {
  return `${personne.firstName?.[0] ?? personne.username[0] ?? "?"}${
    personne.lastName?.[0] ?? ""
  }`.toUpperCase();
}

/**
 * Liste de personnes à cocher, avec recherche.
 *
 * La recherche est indispensable dès que la plateforme compte quelques
 * centaines de comptes : faire défiler pour trouver quelqu'un est vite
 * impraticable.
 */
export function SelecteurPersonnes({
  personnes,
  selection,
  onChange,
  chargement,
  videMessage = "Personne à proposer.",
  hauteur = "max-h-64",
}: {
  personnes: ProfilGroupe[];
  selection: number[];
  onChange: (ids: number[]) => void;
  chargement?: boolean;
  videMessage?: string;
  hauteur?: string;
}) {
  const [recherche, setRecherche] = useState("");

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return personnes;
    return personnes.filter((personne) =>
      `${fullName(personne)} ${personne.username}`
        .toLowerCase()
        .includes(terme),
    );
  }, [personnes, recherche]);

  const basculer = (id: number) =>
    onChange(
      selection.includes(id)
        ? selection.filter((autre) => autre !== id)
        : [...selection, id],
    );

  if (chargement) {
    return (
      <div className="grid place-items-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une personne…"
          aria-label="Rechercher une personne"
          className="pl-9"
        />
      </div>

      {personnes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {videMessage}
        </p>
      ) : filtrees.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucun résultat pour « {recherche} ».
        </p>
      ) : (
        <ScrollArea className={hauteur}>
          <ul className="space-y-1 pr-2">
            {filtrees.map((personne) => {
              const choisie = selection.includes(personne.id);
              return (
                <li key={personne.id}>
                  <button
                    type="button"
                    onClick={() => basculer(personne.id)}
                    aria-pressed={choisie}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors",
                      choisie ? "bg-primary/10" : "hover:bg-accent",
                    )}
                  >
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage src={fileUrl(personne.pictureUrl)} alt="" />
                      <AvatarFallback className="text-[11px]">
                        {initialesDe(personne)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {fullName(personne)}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("h-5 shrink-0 px-1.5 text-[10px]", ROLE_BADGE[personne.role])}
                    >
                      {roleLabel(personne.role)}
                    </Badge>
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-md border",
                        choisie
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input",
                      )}
                      aria-hidden
                    >
                      {choisie ? <Check className="size-3.5" /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}

      {selection.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {selection.length} personne{selection.length > 1 ? "s" : ""}{" "}
          sélectionnée{selection.length > 1 ? "s" : ""}.
        </p>
      ) : null}
    </div>
  );
}
