import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * État vide.
 *
 * Il ne se contente pas de constater l'absence : la pastille est colorée, des
 * anneaux concentriques l'entourent, et le texte propose une suite. Un cadre
 * gris avec « Aucun élément » donne l'impression d'une impasse, alors que
 * l'écran est presque toujours au début d'un parcours, pas à sa fin.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  couleur = "var(--primary)",
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  couleur?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: couleur }}
      />

      {Icon ? (
        <span className="relative mx-auto grid size-16 place-items-center">
          {/* Anneaux : ils élargissent la pastille sans l'alourdir. */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ background: `color-mix(in oklch, ${couleur} 8%, transparent)` }}
          />
          <span
            aria-hidden
            className="absolute inset-2 rounded-full"
            style={{ background: `color-mix(in oklch, ${couleur} 14%, transparent)` }}
          />
          <Icon className="relative size-7" style={{ color: couleur }} aria-hidden />
        </span>
      ) : null}

      <div className="relative mt-5 space-y-2">
        <p className="text-lg font-bold">{title}</p>
        {description ? (
          <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="relative mt-6">{action}</div> : null}
    </div>
  );
}
