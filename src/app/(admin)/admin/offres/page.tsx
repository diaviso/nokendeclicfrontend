"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Briefcase,
  CalendarClock,
  Eye,
  ExternalLink,
  FileClock,
  Loader2,
  Lock,
  MessageSquare,
  Pencil,
  Pin,
  Plus,
  ShieldCheck,
  Trash2,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import {
  ConsoleFiltre,
  ConsolePagination,
  ConsolePastille,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import {
  ConsoleAction,
  ConsoleActions,
  ConsoleDialogue,
} from "@/components/admin/console-kit";
import { adminApi, errorMessage, typesOffresApi } from "@/lib/api";
import { styleOffre, styleType } from "@/lib/type-offre";
import { formatDateShort, formatNumber } from "@/lib/format";
import type { Offre } from "@/lib/types";

const TEINTE = "var(--c-emerald)";

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Une échéance passée sans clôture est l'anomalie que l'on vient chercher. */
function echeance(offre: Offre): { libelle: string; teinte?: string } | null {
  if (!offre.dateLimite) return null;

  const restant = Math.ceil(
    (new Date(offre.dateLimite).getTime() - Date.now()) / 86_400_000,
  );

  if (restant < 0) return { libelle: "Échue", teinte: "var(--destructive)" };
  if (restant === 0) return { libelle: "Aujourd'hui", teinte: "var(--warning)" };
  if (restant <= 7) return { libelle: `J−${restant}`, teinte: "var(--warning)" };
  return { libelle: formatDateShort(offre.dateLimite) };
}

/** État éditorial d'une offre, le plus significatif d'abord. */
function etat(offre: Offre): { libelle: string; teinte?: string } {
  if (offre.estBrouillon) return { libelle: "Brouillon" };
  if (offre.statutModeration === "EN_ATTENTE")
    return { libelle: "À valider", teinte: "var(--warning)" };
  if (offre.statutModeration === "REFUSEE")
    return { libelle: "Refusée", teinte: "var(--destructive)" };
  if (offre.estCloturee) return { libelle: "Clôturée" };
  return { libelle: "Ouverte", teinte: "var(--success)" };
}

export default function AdminOffresPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeOffre, setTypeOffre] = useState("");
  const [page, setPage] = useState(1);
  const [aSupprimer, setASupprimer] = useState<Offre | null>(null);
  const rechercheDifferee = useDebounced(search);

  const { data: types = [] } = useQuery({
    queryKey: ["types-offres"],
    queryFn: () => typesOffresApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "offres", { search: rechercheDifferee, typeOffre, page }],
    queryFn: () =>
      adminApi.offres({
        search: rechercheDifferee,
        typeOffre: typeOffre || undefined,
        page,
        limit: 20,
      }),
    placeholderData: (precedent) => precedent,
  });

  const supprimer = useMutation({
    mutationFn: (id: number) => adminApi.removeOffre(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "offres"] });
      setASupprimer(null);
      toast.success("Offre supprimée");
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  const basculerCloture = useMutation({
    mutationFn: ({ id, estCloturee }: { id: number; estCloturee: boolean }) =>
      adminApi.toggleCloture(id, estCloturee),
    onSuccess: async (_donnees, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "offres"] });
      toast.success(variables.estCloturee ? "Offre clôturée" : "Offre rouverte");
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  const offres = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const colonnes: ColonneConsole<Offre>[] = [
    {
      cle: "offre",
      entete: "Offre",
      cellule: (offre) => {
        const style = styleOffre(offre);
        const Icone = style.icone;

        return (
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105"
              style={{
                background: `color-mix(in oklch, ${style.teinte} 13%, transparent)`,
                color: style.teinte,
              }}
            >
              <Icone className="size-4.5" />
            </span>

            <div className="min-w-0 text-left">
              <p className="flex items-center gap-1.5 truncate font-semibold">
                {offre.estEpinglee ? (
                  <Pin
                    className="size-3.5 shrink-0 text-[var(--c-amber)]"
                    aria-label="Épinglée"
                  />
                ) : null}
                <span className="truncate">{offre.titre}</span>
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {offre.entreprise ?? offre.organisme ?? "Sans organisation"}
                {offre.localisation ? ` · ${offre.localisation}` : ""}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      cle: "type",
      entete: "Type",
      className: "w-36",
      cellule: (offre) => {
        const style = styleOffre(offre);
        return <ConsolePastille libelle={style.libelle} teinte={style.teinte} />;
      },
    },
    {
      cle: "statut",
      entete: "État",
      className: "w-32",
      cellule: (offre) => {
        const e = etat(offre);
        return e.teinte ? (
          <ConsolePastille libelle={e.libelle} teinte={e.teinte} />
        ) : (
          <ConsolePastille libelle={e.libelle} discret />
        );
      },
    },
    {
      cle: "echeance",
      entete: "Échéance",
      secondaire: true,
      className: "w-32",
      cellule: (offre) => {
        const limite = echeance(offre);
        if (!limite) {
          return <span className="text-xs text-muted-foreground/60">—</span>;
        }
        return limite.teinte ? (
          <ConsolePastille libelle={limite.libelle} teinte={limite.teinte} />
        ) : (
          <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
            <CalendarClock className="size-3.5" aria-hidden />
            {limite.libelle}
          </span>
        );
      },
    },
    {
      cle: "publication",
      entete: "Publiée le",
      secondaire: true,
      align: "right",
      className: "w-28",
      cellule: (offre) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatDateShort(offre.datePublication)}
        </span>
      ),
    },
    {
      cle: "audience",
      entete: "Audience",
      align: "right",
      className: "w-32",
      cellule: (offre) => (
        <div className="inline-flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
          <span className="inline-flex items-center gap-1" title="Vues">
            <Eye className="size-3.5" aria-hidden />
            {formatNumber(offre.viewCount)}
          </span>
          {offre._count?.commentaires ? (
            <span className="inline-flex items-center gap-1" title="Commentaires">
              <MessageSquare className="size-3.5" aria-hidden />
              {formatNumber(offre._count.commentaires)}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      cle: "actions",
      entete: "",
      className: "w-44",
      align: "right",
      cellule: (offre) => (
        <ConsoleActions>
          <ConsoleAction
            libelle="Voir la page publique"
            icone={ExternalLink}
            href={`/offres/${offre.id}`}
            cible="_blank"
          />
          <ConsoleAction
            libelle={offre.estCloturee ? "Rouvrir les candidatures" : "Clôturer"}
            icone={offre.estCloturee ? Unlock : Lock}
            ton={offre.estCloturee ? "succes" : "neutre"}
            enCours={
              basculerCloture.isPending && basculerCloture.variables?.id === offre.id
            }
            onClick={() =>
              basculerCloture.mutate({
                id: offre.id,
                estCloturee: !offre.estCloturee,
              })
            }
          />
          <ConsoleAction
            libelle="Modifier"
            icone={Pencil}
            ton="primaire"
            href={`/admin/offres/${offre.id}/modifier`}
          />
          <ConsoleAction
            libelle="Supprimer"
            icone={Trash2}
            ton="danger"
            onClick={() => setASupprimer(offre)}
          />
        </ConsoleActions>
      ),
    },
  ];

  const filtreActif = Boolean(rechercheDifferee || typeOffre);

  return (
    <>
      <ConsoleHeader
        title="Offres"
        icon={Briefcase}
        teinte={TEINTE}
        description="Toutes les opportunités publiées, tous types confondus."
        mesures={
          meta
            ? [
                { label: "offres", valeur: meta.total, teinte: TEINTE },
                {
                  label: "ouvertes sur cette page",
                  valeur: offres.filter((offre) => !offre.estCloturee).length,
                  teinte: "var(--success)",
                },
                {
                  label: "brouillons sur cette page",
                  valeur: offres.filter((offre) => offre.estBrouillon).length,
                },
                {
                  label: "échues non clôturées",
                  valeur: offres.filter(
                    (offre) =>
                      !offre.estCloturee && echeance(offre)?.libelle === "Échue",
                  ).length,
                  teinte: "var(--destructive)",
                },
              ]
            : undefined
        }
        actions={
          <>
            <Button
              variant="outline"
              className="rounded-xl bg-background/70"
              render={<Link href="/admin/moderation" />}
            >
              <ShieldCheck className="size-4" />
              Validation
            </Button>
            <Button className="rounded-xl" render={<Link href="/admin/offres/nouvelle" />}>
              <Plus className="size-4" />
              Nouvelle offre
            </Button>
          </>
        }
      />

      <ConsoleToolbar>
        <ConsoleSearch
          valeur={search}
          onChange={(valeur) => {
            // Retour à la première page dans le gestionnaire plutôt que dans un
            // effet : enchaîner un setState sur un changement de dépendance
            // provoquerait un rendu en cascade et une requête sur une page qui
            // n'existe plus dans le nouveau jeu de résultats.
            setSearch(valeur);
            setPage(1);
          }}
          placeholder="Titre, entreprise, description…"
          label="Rechercher une offre"
          enCours={isFetching && !isLoading}
        />

        <ConsoleFiltre
          label="Filtrer par type"
          valeur={typeOffre}
          onChange={(valeur) => {
            setTypeOffre(valeur);
            setPage(1);
          }}
          options={[
            { valeur: "", libelle: "Tous les types" },
            ...types.map((type) => ({
              valeur: type.code,
              libelle: type.libelle,
              teinte: styleType(type).teinte,
            })),
          ]}
        />
      </ConsoleToolbar>

      {meta && !isLoading ? (
        <p className="mb-2 px-1 text-xs text-muted-foreground">
          {formatNumber(meta.total)} offre{meta.total > 1 ? "s" : ""}
          {filtreActif ? " correspondant aux filtres" : ""} · page {meta.page} sur{" "}
          {Math.max(1, meta.totalPages)}
        </p>
      ) : null}

      <ConsoleTable
        lignes={offres}
        colonnes={colonnes}
        cle={(offre) => offre.id}
        chargement={isLoading}
        rail={(offre) =>
          offre.estCloturee ? "var(--muted-foreground)" : styleOffre(offre).teinte
        }
        onLigneClick={(offre) => router.push(`/admin/offres/${offre.id}/modifier`)}
        vide={
          <EmptyState
            icon={Briefcase}
            couleur={TEINTE}
            title={filtreActif ? "Aucune offre ne correspond" : "Aucune offre publiée"}
            description={
              filtreActif
                ? "Élargissez la recherche ou retirez le filtre de type."
                : "Publiez la première opportunité pour ouvrir le catalogue."
            }
            action={
              filtreActif ? (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setSearch("");
                    setTypeOffre("");
                    setPage(1);
                  }}
                >
                  Effacer les filtres
                </Button>
              ) : (
                <Button className="rounded-xl" render={<Link href="/admin/offres/nouvelle" />}>
                  <Plus className="size-4" />
                  Créer une offre
                </Button>
              )
            }
          />
        }
      />

      <ConsolePagination page={page} total={meta?.totalPages ?? 1} onChange={setPage} />

      {/* Confirmation explicite : la suppression cascade sur les commentaires,
          retours, favoris et pièces jointes. */}
      {aSupprimer ? (
        <ConsoleDialogue
          onFermer={() => setASupprimer(null)}
          icone={Trash2}
          teinte="var(--destructive)"
          taille="sm"
          titre="Supprimer cette offre ?"
          description={
            <>
              « {aSupprimer.titre} » sera définitivement supprimée, ainsi que ses
              commentaires, retours, favoris et pièces jointes. Cette action est
              irréversible.
            </>
          }
          pied={
            <>
              <Button
                variant="ghost"
                className="rounded-lg"
                onClick={() => setASupprimer(null)}
              >
                Annuler
              </Button>
              {!aSupprimer.estCloturee ? (
                <Button
                  variant="outline"
                  className="rounded-lg"
                  disabled={basculerCloture.isPending}
                  onClick={() => {
                    basculerCloture.mutate({ id: aSupprimer.id, estCloturee: true });
                    setASupprimer(null);
                  }}
                >
                  <Lock className="size-4" />
                  Clôturer plutôt
                </Button>
              ) : null}
              <Button
                variant="destructive"
                className="rounded-lg"
                disabled={supprimer.isPending}
                onClick={() => supprimer.mutate(aSupprimer.id)}
              >
                {supprimer.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Supprimer définitivement
              </Button>
            </>
          }
        >
          <div className="flex gap-3 rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <FileClock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Pour retirer l&apos;offre du catalogue sans rien perdre,{" "}
              <strong className="font-semibold text-foreground">clôturez-la</strong>{" "}
              plutôt : elle reste consultable et ses retours sont conservés.
            </p>
          </div>
        </ConsoleDialogue>
      ) : null}
    </>
  );
}
