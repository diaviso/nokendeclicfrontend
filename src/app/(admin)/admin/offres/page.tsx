"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Briefcase,
  ChevronRight,
  Eye,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { adminApi, errorMessage, typesOffresApi } from "@/lib/api";
import { styleOffre, styleType } from "@/lib/type-offre";
import { formatDateShort, formatNumber } from "@/lib/format";
import type { Offre } from "@/lib/types";

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
              className="grid size-9 shrink-0 place-items-center rounded-lg transition-transform duration-200 group-hover:scale-105"
              style={{
                background: `color-mix(in oklch, ${style.teinte} 12%, transparent)`,
                color: style.teinte,
              }}
            >
              <Icone className="size-4.5" />
            </span>

            <div className="min-w-0 text-left">
              <p className="truncate font-semibold">{offre.titre}</p>
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
      className: "w-28",
      cellule: (offre) =>
        offre.estCloturee ? (
          <ConsolePastille libelle="Clôturée" discret />
        ) : (
          <ConsolePastille libelle="Ouverte" teinte="var(--success)" />
        ),
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
          <span className="text-xs tabular-nums text-muted-foreground">
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
      className: "w-32",
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
      className: "w-36",
      cellule: (offre) => (
        <div className="inline-flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
          <span className="inline-flex items-center gap-1" title="Vues">
            <Eye className="size-3.5" aria-hidden />
            {formatNumber(offre.viewCount)}
          </span>
          {offre._count?.commentaires ? (
            <span title="Commentaires">
              {formatNumber(offre._count.commentaires)} comm.
            </span>
          ) : null}
        </div>
      ),
    },
    {
      cle: "actions",
      entete: "",
      className: "w-20",
      align: "right",
      cellule: (offre) => (
        <div
          className="flex items-center justify-end gap-0.5"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg"
                  aria-label={`Actions sur ${offre.titre}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                render={<Link href={`/admin/offres/${offre.id}/modifier`} />}
              >
                <Pencil className="size-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={`/offres/${offre.id}`} />}>
                <Eye className="size-4" />
                Voir la page publique
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  basculerCloture.mutate({
                    id: offre.id,
                    estCloturee: !offre.estCloturee,
                  })
                }
              >
                {offre.estCloturee ? (
                  <>
                    <Unlock className="size-4" />
                    Rouvrir les candidatures
                  </>
                ) : (
                  <>
                    <Lock className="size-4" />
                    Clôturer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setASupprimer(offre)}
              >
                <Trash2 className="size-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
            aria-hidden
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="Offres"
        icon={Briefcase}
        teinte="var(--chart-3)"
        description="Toutes les opportunités publiées, tous types confondus."
        mesures={
          meta
            ? [
                { label: "offres", valeur: meta.total, teinte: "var(--chart-3)" },
                {
                  label: "ouvertes sur cette page",
                  valeur: offres.filter((offre) => !offre.estCloturee).length,
                  teinte: "var(--success)",
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
          <Button
            className="rounded-xl"
            render={<Link href="/admin/offres/nouvelle" />}
          >
            <Plus className="size-4" />
            Nouvelle offre
          </Button>
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
            couleur="var(--chart-3)"
            title={
              rechercheDifferee || typeOffre
                ? "Aucune offre ne correspond"
                : "Aucune offre publiée"
            }
            description={
              rechercheDifferee || typeOffre
                ? "Élargissez la recherche ou retirez le filtre de type."
                : "Publiez la première opportunité pour ouvrir le catalogue."
            }
            action={
              <Button
                className="rounded-xl"
                render={<Link href="/admin/offres/nouvelle" />}
              >
                <Plus className="size-4" />
                Créer une offre
              </Button>
            }
          />
        }
      />

      <ConsolePagination
        page={page}
        total={meta?.totalPages ?? 1}
        onChange={setPage}
      />

      {/* Confirmation explicite : la suppression cascade sur les commentaires,
          retours, favoris et pièces jointes. */}
      <Dialog open={Boolean(aSupprimer)} onOpenChange={() => setASupprimer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette offre ?</DialogTitle>
            <DialogDescription>
              « {aSupprimer?.titre} » sera définitivement supprimée, ainsi que ses
              commentaires, retours, favoris et pièces jointes. Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>

          <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
            Pour retirer l&apos;offre du catalogue sans rien perdre,{" "}
            <strong className="font-semibold text-foreground">clôturez-la</strong>{" "}
            plutôt : elle reste consultable et ses retours sont conservés.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              className="rounded-xl"
              onClick={() => setASupprimer(null)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={supprimer.isPending}
              onClick={() => aSupprimer && supprimer.mutate(aSupprimer.id)}
            >
              {supprimer.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Supprimer définitivement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
