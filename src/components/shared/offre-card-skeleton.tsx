import { Skeleton } from "@/components/ui/skeleton";

/**
 * Ossature d'une carte d'offre.
 *
 * Elle reprend exactement la structure de `OffreCard` — bandeau, titre sur deux
 * lignes, deux lignes de méta, pied. Une ossature qui ne colle pas au contenu
 * final provoque un saut de mise en page à l'arrivée des données, plus gênant
 * que le chargement lui-même.
 */
export function OffreCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="h-28 shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col p-4">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="mt-2 h-4 w-2/3" />
        <Skeleton className="mt-4 h-3 w-1/2" />
        <Skeleton className="mt-2 h-3 w-1/3" />
        <div className="mt-auto flex items-center gap-3 border-t pt-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="ml-auto h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Grille d'ossatures, au même gabarit que les grilles d'offres. */
export function OffresGrilleSkeleton({ nombre = 6 }: { nombre?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: nombre }, (_, i) => (
        <OffreCardSkeleton key={i} />
      ))}
    </div>
  );
}
