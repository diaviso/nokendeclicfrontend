"use client";

import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { NAV_SECTIONS, navItemActif } from "@/lib/navigation";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface MesurePage {
  label: string;
  valeur: number | string;
  /** Teinte de la tuile ; à défaut, la mesure reste neutre. */
  teinte?: string;
}

const TOUS_LES_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

/**
 * En-tête de page de l'espace membre — le même motif que la console.
 *
 * Un bandeau lavé de la teinte de la rubrique (celle du menu latéral, ce qui
 * relie le menu à la page qu'il ouvre), une pastille en dégradé, un titre
 * large et, en option, les mesures de la page en petites tuiles colorées.
 *
 * Le lavis est posé derrière le texte : il habille le haut de page sans
 * jamais toucher au contraste de lecture.
 */
export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
  surtitre,
  couleur,
  mesures,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
  /** Petite ligne en capitales au-dessus du titre. */
  surtitre?: string;
  /** Teinte hors rubrique connue ; celle du menu prime, pour la cohérence. */
  couleur?: string;
  /** Chiffres clés de la page, en tuiles sous le bandeau. */
  mesures?: MesurePage[];
  className?: string;
}) {
  const pathname = usePathname();
  const teinte =
    navItemActif(pathname, TOUS_LES_ITEMS)?.teinte ?? couleur ?? "var(--primary)";

  return (
    <header
      className={cn(
        "entree relative mb-6 overflow-hidden rounded-3xl border bg-card shadow-sm",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(115deg, color-mix(in oklch, ${teinte} 16%, transparent) 0%, color-mix(in oklch, ${teinte} 5%, transparent) 45%, transparent 75%)`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full opacity-20 blur-3xl"
        style={{ background: teinte }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-50 md:block"
        style={{
          backgroundImage: `radial-gradient(color-mix(in oklch, ${teinte} 30%, transparent) 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
          maskImage: "linear-gradient(90deg, transparent, black 70%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 70%)",
        }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-5 sm:p-6">
        <div className="flex min-w-[min(100%,22rem)] flex-1 items-start gap-4">
          {Icon ? (
            <span
              className="grid size-13 shrink-0 place-items-center rounded-2xl text-white transition-transform duration-300 hover:-rotate-6 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${teinte}, color-mix(in oklch, ${teinte} 65%, black))`,
                boxShadow: `0 10px 24px -8px color-mix(in oklch, ${teinte} 75%, transparent)`,
              }}
            >
              <Icon className="size-6" aria-hidden />
            </span>
          ) : null}

          <div className="min-w-0">
            {surtitre ? (
              <p
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
                style={{ color: teinte }}
              >
                {surtitre}
              </p>
            ) : null}
            <h1
              className={cn(
                "text-2xl font-extrabold tracking-tight sm:text-[1.7rem]",
                surtitre && "mt-0.5",
              )}
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {mesures?.length ? (
        <dl className="relative flex flex-wrap gap-px border-t bg-border/60">
          {mesures.map((mesure) => {
            const teinteMesure = mesure.teinte ?? "var(--muted-foreground)";
            return (
              <div
                key={mesure.label}
                className="flex min-w-0 grow basis-[calc(50%-1px)] items-center gap-3 bg-card/90 px-5 py-3.5 backdrop-blur sm:basis-[calc(33.333%-1px)] lg:basis-0"
              >
                <span
                  aria-hidden
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ background: teinteMesure }}
                />
                <div className="min-w-0">
                  <dd
                    className="text-xl font-extrabold leading-none tabular-nums"
                    style={mesure.teinte ? { color: teinteMesure } : undefined}
                  >
                    {typeof mesure.valeur === "number"
                      ? formatNumber(mesure.valeur)
                      : mesure.valeur}
                  </dd>
                  <dt className="mt-1 truncate text-xs text-muted-foreground">
                    {mesure.label}
                  </dt>
                </div>
              </div>
            );
          })}
        </dl>
      ) : null}
    </header>
  );
}
