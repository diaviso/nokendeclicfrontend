/**
 * Colonne de saisie.
 *
 * Les pages de formulaire sont ramenées à une largeur de lecture. Étalés sur
 * toute la largeur d'un écran de bureau, deux champs côte à côte finissent à
 * cinquante centimètres l'un de l'autre : l'œil doit traverser le vide entre
 * l'étiquette et sa valeur, et la ligne suivante se retrouve difficile à
 * accrocher. Les tableaux du back-office, eux, gardent la pleine largeur —
 * c'est leur densité qui fait leur intérêt.
 */
import { cn } from "@/lib/utils";

export function FormShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-3xl", className)}>{children}</div>;
}
