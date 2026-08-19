import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

/**
 * En-tête d'une page de la console.
 *
 * Plus resserré que celui de l'espace membre : en administration, l'écran sert
 * à travailler des listes, et chaque ligne gagnée en haut est une ligne de
 * données visible sans défiler. La teinte de la rubrique porte l'identité — la
 * même que celle de l'onglet qui a mené ici.
 *
 * Les mesures sont posées dans l'en-tête plutôt que dans des tuiles séparées :
 * ce sont des repères de lecture (« combien y en a-t-il ? »), pas des
 * indicateurs à surveiller, et elles n'ont pas à occuper une bande entière.
 */
export interface MesureConsole {
  label: string;
  valeur: number | string;
  /** Teinte du point ; à défaut, la mesure reste neutre. */
  teinte?: string;
}

export function ConsoleHeader({
  title,
  description,
  icon: Icon,
  teinte = "var(--chart-1)",
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
  return (
    <header
      className={cn(
        "relative mb-5 overflow-hidden rounded-2xl border bg-card",
        className,
      )}
    >
      {/* Bande de teinte : elle identifie la rubrique sans colorer le fond,
          qui doit rester neutre pour que les statuts se détachent. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${teinte}, color-mix(in oklch, ${teinte} 25%, transparent))`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: teinte }}
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon ? (
            <span
              className="grid size-11 shrink-0 place-items-center rounded-xl"
              style={{
                background: `color-mix(in oklch, ${teinte} 12%, transparent)`,
                color: teinte,
                // Le filet est posé en ombre interne plutôt qu'en `ring` : la
                // teinte est calculée à l'exécution, et Tailwind ne peut pas
                // générer une classe d'anneau à partir d'une valeur inconnue
                // à la compilation.
                boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${teinte} 22%, transparent)`,
              }}
            >
              <Icon className="size-5.5" aria-hidden />
            </span>
          ) : null}

          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}

            {mesures?.length ? (
              <dl className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2">
                {mesures.map((mesure) => (
                  <div
                    key={mesure.label}
                    className="flex items-baseline gap-1.5"
                  >
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 translate-y-[-1px] rounded-full"
                      style={{
                        background: mesure.teinte ?? "var(--muted-foreground)",
                      }}
                    />
                    <dd className="text-sm font-bold tabular-nums">
                      {typeof mesure.valeur === "number"
                        ? formatNumber(mesure.valeur)
                        : mesure.valeur}
                    </dd>
                    <dt className="text-xs text-muted-foreground">
                      {mesure.label}
                    </dt>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
