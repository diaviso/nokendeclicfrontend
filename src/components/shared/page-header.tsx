import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * En-tête de page de l'espace membre.
 *
 * Chaque écran s'ouvre sur le même motif : une pastille colorée, un surtitre,
 * un titre large. La teinte change d'une page à l'autre — c'est ce qui donne à
 * chacune une identité reconnaissable sans multiplier les mises en page.
 *
 * Le voile coloré est posé derrière le texte plutôt que dessus : il habille le
 * haut de page sans jamais toucher au contraste de lecture.
 */
export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
  surtitre,
  couleur = "var(--primary)",
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
  /** Petite ligne en capitales au-dessus du titre. */
  surtitre?: string;
  /** Teinte de la pastille et du halo. */
  couleur?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative mb-7", className)}>
      {/* Halo d'ambiance, discret et non interactif. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-28 -z-10 size-72 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: couleur }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon ? (
            <span
              className="hidden size-12 shrink-0 place-items-center rounded-2xl sm:grid"
              style={{
                background: `color-mix(in oklch, ${couleur} 13%, transparent)`,
                color: couleur,
              }}
            >
              <Icon className="size-6" aria-hidden />
            </span>
          ) : null}

          <div className="min-w-0">
            {surtitre ? (
              <p
                className="text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ color: couleur }}
              >
                {surtitre}
              </p>
            ) : null}
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 text-base text-muted-foreground">
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
    </div>
  );
}
