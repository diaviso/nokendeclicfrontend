import { cn } from "@/lib/utils";

/**
 * Ossature de chargement.
 *
 * Un balayage lumineux traverse le bloc plutôt qu'un simple clignotement
 * d'opacité : le mouvement va dans le sens de la lecture et se lit comme « ça
 * arrive », là où une pulsation se lit comme « ça attend ».
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("shimmer rounded-lg bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
