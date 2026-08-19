"use client";

import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

/**
 * Pièces communes aux écrans de la console : barre d'outils, filtres
 * segmentés, pastilles d'état, pagination.
 *
 * Elles sont regroupées ici plutôt qu'éclatées en cinq fichiers : chacune tient
 * en quelques lignes, aucune n'a de sens hors de la console, et les voir
 * ensemble est ce qui garde leurs proportions cohérentes.
 */

/** Bandeau de recherche et de filtres, posé au-dessus d'un tableau. */
export function ConsoleToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Champ de recherche avec témoin de requête en cours. */
export function ConsoleSearch({
  valeur,
  onChange,
  placeholder,
  label,
  enCours,
  className,
}: {
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder: string;
  label: string;
  enCours?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={valeur}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 rounded-xl border-transparent bg-muted/60 pl-9 shadow-none focus-visible:border-input focus-visible:bg-background"
      />
      {enCours ? (
        <Loader2
          className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export interface OptionFiltre<V extends string> {
  valeur: V;
  libelle: string;
  /** Compteur affiché en pastille. */
  compte?: number;
  /** Point de couleur, quand l'option correspond à un état codé. */
  teinte?: string;
}

/**
 * Filtre segmenté.
 *
 * Préféré à une liste déroulante tant que les options tiennent sur une ligne :
 * on voit d'un coup ce qui existe et combien il y en a, là où un `select` cache
 * les choix et leur volume derrière un clic.
 */
export function ConsoleFiltre<V extends string>({
  options,
  valeur,
  onChange,
  label,
  className,
}: {
  options: OptionFiltre<V>[];
  valeur: V;
  onChange: (valeur: V) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "no-scrollbar flex shrink-0 gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const actif = option.valeur === valeur;

        return (
          <button
            key={option.valeur || "tous"}
            type="button"
            aria-pressed={actif}
            onClick={() => onChange(option.valeur)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-all duration-200",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              actif
                ? "bg-card font-semibold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.teinte ? (
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full transition-opacity",
                  actif ? "opacity-100" : "opacity-60",
                )}
                style={{ background: option.teinte }}
              />
            ) : null}
            {option.libelle}
            {option.compte !== undefined ? (
              <span
                className={cn(
                  "rounded-md px-1.5 text-[11px] font-bold tabular-nums transition-colors",
                  actif
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground/70",
                )}
              >
                {formatNumber(option.compte)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Pastille d'état.
 *
 * Un point coloré double le mot : la couleur seule ne suffit pas — elle est
 * invisible à qui distingue mal le rouge du vert — et le mot seul se perd dans
 * une colonne de vingt lignes grises.
 */
export function ConsolePastille({
  libelle,
  teinte,
  discret,
  className,
}: {
  libelle: string;
  teinte?: string;
  /** Rendu atténué, pour les états neutres ou terminés. */
  discret?: boolean;
  className?: string;
}) {
  if (discret || !teinte) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-muted-foreground/50"
        />
        {libelle}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        className,
      )}
      style={{
        background: `color-mix(in oklch, ${teinte} 13%, transparent)`,
        color: teinte,
      }}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ background: teinte }}
      />
      {libelle}
    </span>
  );
}

/** Pagination compacte, affichée seulement au-delà d'une page. */
export function ConsolePagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-center gap-2"
    >
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg"
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
      >
        Précédent
      </Button>
      <span className="px-2 text-sm tabular-nums text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> sur{" "}
        {total}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg"
        disabled={page >= total}
        onClick={() => onChange(page + 1)}
      >
        Suivant
      </Button>
    </nav>
  );
}
