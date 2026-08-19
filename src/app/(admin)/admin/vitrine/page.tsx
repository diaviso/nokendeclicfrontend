"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Eye,
  EyeOff,
  ExternalLink,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import {
  ConsolePastille,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import { EmptyState } from "@/components/shared/empty-state";
import {
  errorMessage,
  fileUrl,
  partenaireApi,
  type EntreprisePourAdministration,
} from "@/lib/api";
import { secteurLabel } from "@/lib/enums";

const TEINTE = "var(--chart-3)";

function Logo({ fiche }: { fiche: EntreprisePourAdministration }) {
  if (!fiche.logoUrl) {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted/40 text-muted-foreground">
        <Building2 className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fileUrl(fiche.logoUrl)}
      alt=""
      className="size-9 shrink-0 rounded-lg border bg-background object-contain p-0.5"
    />
  );
}

export default function VitrinePage() {
  const queryClient = useQueryClient();
  const [recherche, setRecherche] = useState("");

  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ["admin", "vitrine"],
    queryFn: partenaireApi.listerPourAdministration,
  });

  const regler = useMutation({
    mutationFn: ({
      id,
      ...reglages
    }: {
      id: number;
      estVisibleVitrine?: boolean;
      ordreVitrine?: number;
    }) => partenaireApi.reglerVitrine(id, reglages),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "vitrine"] });
      if (variables.estVisibleVitrine !== undefined) {
        toast.success(
          variables.estVisibleVitrine
            ? "Structure mise en vitrine"
            : "Structure retirée de la vitrine",
          {
            description:
              "La page d'accueil est mise en cache cinq minutes : le changement peut mettre un instant à s'y voir.",
          },
        );
      }
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return fiches;
    return fiches.filter((fiche) =>
      [fiche.nom, fiche.ville, fiche.user.email]
        .filter(Boolean)
        .some((valeur) => valeur!.toLowerCase().includes(terme)),
    );
  }, [fiches, recherche]);

  const enVitrine = fiches.filter((fiche) => fiche.estVisibleVitrine);

  /**
   * Déplacement d'un cran dans la vitrine.
   *
   * Les rangs ne sont pas échangés deux à deux : tant que personne n'a été
   * réordonné, toutes les fiches portent le rang 0 par défaut, et un échange
   * entre deux zéros ne produirait aucun mouvement. On renumérote donc la liste
   * telle qu'elle doit être, et on n'écrit que les lignes dont le rang change.
   */
  const deplacer = async (
    fiche: EntreprisePourAdministration,
    sens: -1 | 1,
  ) => {
    const position = enVitrine.findIndex((autre) => autre.id === fiche.id);
    if (position < 0 || !enVitrine[position + sens]) return;

    const ordonnees = [...enVitrine];
    [ordonnees[position], ordonnees[position + sens]] = [
      ordonnees[position + sens],
      ordonnees[position],
    ];

    const aEcrire = ordonnees
      .map((entree, rang) => ({ entree, rang }))
      .filter(({ entree, rang }) => entree.ordreVitrine !== rang);

    // En série : les écritures visent des lignes distinctes, mais les envoyer
    // ensemble ferait invalider le cache autant de fois qu'il y a de lignes.
    for (const { entree, rang } of aEcrire) {
      await regler.mutateAsync({ id: entree.id, ordreVitrine: rang });
    }
  };

  const colonnes: ColonneConsole<EntreprisePourAdministration>[] = [
    {
      cle: "nom",
      entete: "Structure",
      cellule: (fiche) => (
        <div className="flex min-w-0 items-center gap-3">
          <Logo fiche={fiche} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{fiche.nom}</p>
            <p className="truncate text-xs text-muted-foreground">
              {fiche.user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      cle: "secteur",
      entete: "Secteur",
      secondaire: true,
      cellule: (fiche) =>
        fiche.secteur ? (
          <span className="text-sm">{secteurLabel(fiche.secteur)}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      cle: "ville",
      entete: "Ville",
      secondaire: true,
      cellule: (fiche) => (
        <span className="text-sm text-muted-foreground">{fiche.ville ?? "—"}</span>
      ),
    },
    {
      cle: "offres",
      entete: "Offres",
      align: "right",
      secondaire: true,
      cellule: (fiche) => (
        <span className="tabular-nums">{fiche.user._count.offres}</span>
      ),
    },
    {
      cle: "etat",
      entete: "Vitrine",
      cellule: (fiche) =>
        fiche.estVisibleVitrine ? (
          <ConsolePastille libelle="En vitrine" teinte="var(--success)" />
        ) : (
          <ConsolePastille libelle="Masquée" discret />
        ),
    },
    {
      cle: "actions",
      entete: "",
      align: "right",
      cellule: (fiche) => (
        <div className="flex items-center justify-end gap-1">
          {fiche.estVisibleVitrine ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                aria-label={`Remonter ${fiche.nom}`}
                disabled={
                  regler.isPending || enVitrine[0]?.id === fiche.id
                }
                onClick={() => deplacer(fiche, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                aria-label={`Descendre ${fiche.nom}`}
                disabled={
                  regler.isPending ||
                  enVitrine[enVitrine.length - 1]?.id === fiche.id
                }
                onClick={() => deplacer(fiche, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
            </>
          ) : null}

          {fiche.siteWeb ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              aria-label={`Ouvrir le site de ${fiche.nom}`}
              render={
                <a
                  href={fiche.siteWeb}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                />
              }
            >
              <ExternalLink className="size-4" />
            </Button>
          ) : null}

          <Button
            variant={fiche.estVisibleVitrine ? "ghost" : "outline"}
            size="sm"
            className="rounded-lg"
            disabled={regler.isPending}
            onClick={() =>
              regler.mutate({
                id: fiche.id,
                estVisibleVitrine: !fiche.estVisibleVitrine,
              })
            }
          >
            {fiche.estVisibleVitrine ? (
              <>
                <EyeOff className="size-4" />
                Retirer
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Mettre en vitrine
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="Vitrine des partenaires"
        icon={Store}
        teinte={TEINTE}
        description="Les structures mises en vitrine apparaissent sur la page d'accueil, dans l'ordre défini ici. Une fiche est renseignée par le partenaire lui-même ; l'administration décide seule de sa mise en avant."
        mesures={[
          { label: "Fiches", valeur: fiches.length },
          { label: "En vitrine", valeur: enVitrine.length, teinte: "var(--success)" },
        ]}
      />

      <ConsoleToolbar>
        <ConsoleSearch
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Nom, ville, email du compte…"
          label="Rechercher une structure partenaire"
        />
      </ConsoleToolbar>

      <ConsoleTable
        lignes={filtrees}
        colonnes={colonnes}
        cle={(fiche) => fiche.id}
        chargement={isLoading}
        rail={(fiche) =>
          fiche.estVisibleVitrine ? "var(--success)" : undefined
        }
        vide={
          <EmptyState
            icon={Store}
            couleur={TEINTE}
            title={
              recherche ? "Aucune structure ne correspond" : "Aucune fiche partenaire"
            }
            description={
              recherche
                ? "Essayez sur le nom de la structure ou l'email du compte."
                : "Les fiches apparaissent ici dès qu'un compte partenaire renseigne sa structure depuis son espace."
            }
          />
        }
      />
    </>
  );
}
