import { BookOpen, School } from "lucide-react";
import { cn } from "@/lib/utils";

type Onglet = "offres" | "centres";

/**
 * Les deux portes de la catégorie Formation : les offres de formation, et les
 * centres où se former. Le rendu des liens est laissé à l'appelant : pages
 * publiques (liens localisés) et application (boutons d'état) s'en servent.
 */
export function BasculeFormation({
  actif,
  libelles,
  rendre,
  className,
}: {
  actif: Onglet;
  libelles: { offres: string; centres: string; groupe: string };
  rendre: (
    onglet: Onglet,
    props: { className: string; "aria-current"?: "page"; children: React.ReactNode },
  ) => React.ReactNode;
  className?: string;
}) {
  const onglets: { cle: Onglet; icone: typeof BookOpen }[] = [
    { cle: "offres", icone: BookOpen },
    { cle: "centres", icone: School },
  ];
  return (
    <nav
      aria-label={libelles.groupe}
      className={cn(
        "inline-flex w-full rounded-2xl border bg-muted/50 p-1 sm:w-auto",
        className,
      )}
    >
      {onglets.map(({ cle, icone: Icone }) => {
        const estActif = actif === cle;
        return (
          <span key={cle} className="flex-1 sm:flex-none">
            {rendre(cle, {
              className: cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                estActif
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ),
              "aria-current": estActif ? "page" : undefined,
              children: (
                <>
                  <Icone className="size-4" aria-hidden />
                  {cle === "offres" ? libelles.offres : libelles.centres}
                </>
              ),
            })}
          </span>
        );
      })}
    </nav>
  );
}
