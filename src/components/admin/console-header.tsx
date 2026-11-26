"use client";

import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { consoleItemActif } from "@/lib/console-nav";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

/**
 * En-tête d'une page de la console.
 *
 * Un bandeau lavé de la teinte de la rubrique — la même que dans la barre
 * latérale, ce qui relie le menu à la page qu'il ouvre — et, dessous, les
 * mesures de la page en petites tuiles colorées.
 */
export interface MesureConsole {
  label: string;
  valeur: number | string;
  /** Teinte de la tuile ; à défaut, la mesure reste neutre. */
  teinte?: string;
}

export function ConsoleHeader({
  title,
  description,
  icon: Icon,
  teinte: teinteDemandee,
  mesures,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  teinte?: string;
  mesures?: MesureConsole[];
  actions?: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  // La teinte de la rubrique prime : le menu et la page parlent la même
  // couleur. Hors rubrique connue, celle demandée par la page.
  const teinte =
    consoleItemActif(pathname)?.teinte ?? teinteDemandee ?? "var(--c-indigo)";

  return (
    <header
      className={cn(
        "entree relative mb-6 overflow-hidden rounded-3xl border bg-card shadow-sm",
        className,
      )}
    >
      {/* Lavis de couleur et motif : donnent l'identité de la rubrique. */}
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
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-[0.5] md:block"
        style={{
          backgroundImage: `radial-gradient(color-mix(in oklch, ${teinte} 30%, transparent) 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
          maskImage: "linear-gradient(90deg, transparent, black 70%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 70%)",
        }}
      />

      <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon ? (
            <span
              className="grid size-13 shrink-0 place-items-center rounded-2xl text-white"
              style={{
                background: `linear-gradient(135deg, ${teinte}, color-mix(in oklch, ${teinte} 65%, black))`,
                boxShadow: `0 10px 24px -8px color-mix(in oklch, ${teinte} 75%, transparent)`,
              }}
            >
              <Icon className="size-6" aria-hidden />
            </span>
          ) : null}

          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-[1.7rem]">
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
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>

      {mesures?.length ? (
        <dl className="relative flex flex-wrap gap-px border-t bg-border/60">
          {mesures.map((mesure) => {
            const couleur = mesure.teinte ?? "var(--muted-foreground)";
            return (
              <div
                key={mesure.label}
                className="flex min-w-0 grow basis-[calc(50%-1px)] items-center gap-3 bg-card/90 px-5 py-3.5 backdrop-blur sm:basis-[calc(33.333%-1px)] lg:basis-0"
              >
                <span
                  aria-hidden
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ background: couleur }}
                />
                <div className="min-w-0">
                  <dd
                    className="text-xl font-extrabold leading-none tabular-nums"
                    style={mesure.teinte ? { color: couleur } : undefined}
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
