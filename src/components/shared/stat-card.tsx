import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

/**
 * Tuile de statistique.
 *
 * La valeur porte le poids visuel : c'est ce que l'on vient lire. Le libellé la
 * précède en petit, l'icône est teintée pour distinguer les tuiles d'un coup
 * d'œil, et le halo n'apparaît qu'au survol des tuiles cliquables — un décor
 * permanent sur une tuile inerte laisserait croire qu'elle mène quelque part.
 *
 * Les chiffres sont en caractères tabulaires : les colonnes restent alignées
 * d'une tuile à l'autre, et la valeur ne tressaute pas quand elle change.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
  couleur = "var(--primary)",
  className,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  hint?: string;
  href?: string;
  /** Teinte de l'icône et du halo. */
  couleur?: string;
  className?: string;
}) {
  const contenu = (
    <>
      {href ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25"
          style={{ background: couleur }}
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-4xl font-bold leading-none tracking-tight tabular-nums">
            {typeof value === "number" ? formatNumber(value) : value}
          </p>
          {hint ? (
            <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
          ) : null}
        </div>

        {Icon ? (
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{
              background: `color-mix(in oklch, ${couleur} 14%, transparent)`,
              color: couleur,
            }}
          >
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
      </div>

      {/* Aucune mention « Ouvrir » : elle occuperait une ligne en permanence
          pour n'être lisible qu'au survol, et creuserait un vide sous la
          valeur. La bordure et le halo suffisent à signaler le lien. */}
    </>
  );

  const base = cn(
    "group relative overflow-hidden rounded-xl border bg-card p-5 transition-colors",
    href && "hover:border-primary/40",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        )}
      >
        {contenu}
      </Link>
    );
  }

  return <div className={base}>{contenu}</div>;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-9 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}
