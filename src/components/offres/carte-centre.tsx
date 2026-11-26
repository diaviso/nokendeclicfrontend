import { MapPin, School } from "lucide-react";
import { fileUrl } from "@/lib/api/client";
import type { CentreFormation } from "@/lib/api/centres";

/** Classe du lien qui enveloppe la carte (le lien dépend du contexte). */
export const CLASSE_CARTE_CENTRE =
  "group flex h-full flex-col rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg";

/**
 * Contenu de la carte d'un centre de formation. Le lien est posé par
 * l'appelant : localisé sur les pages publiques, simple dans l'application.
 */
export function ContenuCarteCentre({
  centre,
  formations,
}: {
  centre: CentreFormation;
  formations: string;
}) {
  const lieu = [centre.ville, centre.region].filter(
    (v, i, tous) => v && tous.indexOf(v) === i,
  );
  return (
    <>
      <div className="flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-background">
          {centre.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl(centre.logoUrl)}
              alt=""
              loading="lazy"
              className="size-full object-contain p-1.5"
            />
          ) : (
            <School className="size-6 text-muted-foreground" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-lg font-bold leading-snug group-hover:text-primary">
            {centre.nom}
          </h2>
          {lieu.length ? (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {lieu.join(", ")}
            </p>
          ) : null}
        </div>
      </div>
      {centre.domaines ? (
        <p className="mt-3 text-sm font-medium text-foreground/80">{centre.domaines}</p>
      ) : null}
      {centre.description ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {centre.description}
        </p>
      ) : null}
      <p className="mt-auto pt-4 text-sm font-semibold text-primary">{formations}</p>
    </>
  );
}
