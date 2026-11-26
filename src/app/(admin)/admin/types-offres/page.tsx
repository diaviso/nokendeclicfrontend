"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Layers,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConsoleHeader } from "@/components/admin/console-header";
import {
  ConsoleFiltre,
  ConsolePastille,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import {
  ConsoleAction,
  ConsoleActions,
  useConfirmation,
} from "@/components/admin/console-kit";
import { adminTypesOffresApi, errorMessage } from "@/lib/api";
import { styleType } from "@/lib/type-offre";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TypeOffreDef } from "@/lib/types";

const TEINTE = "var(--c-teal)";

type FiltreEtat = "" | "actifs" | "inactifs";

/**
 * Un type d'offre n'est pas une ligne de tableau : c'est une identité — une
 * icône, une couleur, un jeu de champs. La grille de cartes montre en un regard
 * ce que l'administrateur a réellement construit, là où un tableau réduisait
 * tout cela à deux colonnes de chiffres.
 */
function CarteType({
  type,
  index,
  onSupprimer,
  onBasculer,
  bascule,
}: {
  type: TypeOffreDef;
  index: number;
  onSupprimer: () => void;
  onBasculer: () => void;
  bascule: boolean;
}) {
  const style = styleType(type);
  const Icone = style.icone;
  const nbOffres = type._count?.offres ?? 0;

  return (
    <article
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "entree group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-lg",
        // Un type désactivé n'apparaît plus dans les formulaires : la carte se
        // retire visuellement sans disparaître, pour rester réactivable.
        !type.estActif && "opacity-60 saturate-50",
      )}
    >
      {/* Bandeau de teinte : c'est la couleur que porteront les offres de ce
          type dans tout le reste de l'application. */}
      <div
        className="relative h-20 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklch, ${style.teinte} 22%, transparent), color-mix(in oklch, ${style.teinte} 6%, transparent))`,
        }}
      >
        <span
          aria-hidden
          className="absolute -right-6 -top-8 size-28 rounded-full opacity-25 blur-2xl transition-transform duration-500 group-hover:scale-125"
          style={{ background: style.teinte }}
        />
        <Icone
          aria-hidden
          className="absolute -bottom-4 right-3 size-24 opacity-[0.12] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"
          style={{ color: style.teinte }}
        />

        <div className="absolute right-2 top-2 flex items-center gap-1">
          {type.estActif ? (
            <ConsolePastille libelle="Actif" teinte="var(--success)" />
          ) : (
            <ConsolePastille libelle="Désactivé" discret />
          )}

        </div>
      </div>

      {/* La pastille chevauche le bandeau et le corps de la carte. Elle est
          donc posée sur l'article et non dans le bandeau, dont le `overflow`
          — nécessaire aux décors qui débordent — lui trancherait la moitié
          basse. Le bandeau mesure 5rem, la pastille 3rem : elle démarre à
          3.5rem pour être coupée en deux par la limite. */}
      <span
        aria-hidden
        className="absolute left-5 top-14 grid size-12 place-items-center rounded-2xl border-4 border-card shadow-sm"
        style={{ background: style.teinte, color: "oklch(1 0 0)" }}
      >
        <Icone className="size-5.5" />
      </span>

      <div className="flex flex-1 flex-col p-5 pt-8">
        <div className="flex items-baseline gap-2">
          <h2 className="min-w-0 truncate text-lg font-bold tracking-tight">
            {type.libelle}
          </h2>
          <code className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {type.code}
          </code>
        </div>

        <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
          {type.description ||
            "Aucune description. Elle aide les rédacteurs à choisir le bon type."}
        </p>

        {/* Aperçu des champs : c'est la vraie substance d'un type, et ce qu'on
            vient vérifier avant de publier une offre. */}
        <div className="mt-4 min-h-14">
          {type.champs.length === 0 ? (
            <p className="dashed-frame px-3 py-2.5 text-xs text-muted-foreground">
              Aucun champ propre à ce type — seules les informations communes
              seront demandées.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {type.champs.slice(0, 5).map((champ) => (
                <li
                  key={champ.code}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[11px]",
                    champ.obligatoire
                      ? "border-foreground/15 bg-muted font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                  title={champ.obligatoire ? "Champ obligatoire" : "Champ facultatif"}
                >
                  {champ.libelle}
                  {champ.obligatoire ? (
                    <span aria-hidden className="ml-0.5 text-destructive">
                      *
                    </span>
                  ) : null}
                </li>
              ))}
              {type.champs.length > 5 ? (
                <li className="px-1 py-0.5 text-[11px] text-muted-foreground">
                  +{type.champs.length - 5}
                </li>
              ) : null}
            </ul>
          )}
        </div>

        <footer className="mt-auto flex items-center justify-between gap-3 border-t pt-3.5">
          <dl className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-baseline gap-1">
              <dd className="font-bold tabular-nums text-foreground">
                {type.champs.length}
              </dd>
              <dt>champ{type.champs.length > 1 ? "s" : ""}</dt>
            </div>
            <div className="flex items-baseline gap-1">
              <dd
                className="font-bold tabular-nums"
                style={{ color: nbOffres > 0 ? style.teinte : undefined }}
              >
                {formatNumber(nbOffres)}
              </dd>
              <dt>offre{nbOffres > 1 ? "s" : ""}</dt>
            </div>
          </dl>

          <ConsoleActions>
            <ConsoleAction
              libelle={type.estActif ? "Retirer des formulaires" : "Remettre dans les formulaires"}
              icone={type.estActif ? EyeOff : Eye}
              ton={type.estActif ? "neutre" : "succes"}
              disabled={bascule}
              onClick={onBasculer}
            />
            <ConsoleAction
              libelle="Supprimer"
              icone={Trash2}
              ton="danger"
              onClick={onSupprimer}
            />
            <Button
              variant="outline"
              size="sm"
              className="ml-1 h-8 rounded-lg"
              render={<Link href={`/admin/types-offres/${type.id}`} />}
            >
              <Pencil className="size-3.5" />
              Modifier
            </Button>
          </ConsoleActions>
        </footer>
      </div>
    </article>
  );
}

function CarteSquelette({ index }: { index: number }) {
  return (
    <div
      style={{ opacity: 1 - index * 0.15 }}
      className="overflow-hidden rounded-2xl border bg-card"
    >
      <div className="shimmer h-20 bg-muted" />
      <div className="space-y-3 p-5 pt-8">
        <div className="shimmer h-4 w-1/2 rounded bg-muted" />
        <div className="shimmer h-3 w-full rounded bg-muted" />
        <div className="shimmer h-3 w-2/3 rounded bg-muted" />
        <div className="shimmer h-8 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function AdminTypesOffresPage() {
  const queryClient = useQueryClient();
  const confirmer = useConfirmation();
  const [recherche, setRecherche] = useState("");
  const [etat, setEtat] = useState<FiltreEtat>("");

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["admin", "types-offres"],
    queryFn: () => adminTypesOffresApi.list(),
  });

  const rafraichir = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "types-offres"] });
    await queryClient.invalidateQueries({ queryKey: ["types-offres"] });
  };

  const supprimer = useMutation({
    mutationFn: (id: number) => adminTypesOffresApi.remove(id),
    onSuccess: async () => {
      await rafraichir();
      toast.success("Type supprimé");
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  const basculerActif = useMutation({
    mutationFn: (type: TypeOffreDef) =>
      adminTypesOffresApi.update(type.id, {
        libelle: type.libelle,
        estActif: !type.estActif,
      }),
    onSuccess: async (_donnees, type) => {
      await rafraichir();
      toast.success(
        type.estActif
          ? "Type retiré des formulaires"
          : "Type remis dans les formulaires",
      );
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  const actifs = types.filter((type) => type.estActif).length;
  const totalChamps = types.reduce((total, type) => total + type.champs.length, 0);

  const affiches = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return types.filter((type) => {
      if (etat === "actifs" && !type.estActif) return false;
      if (etat === "inactifs" && type.estActif) return false;
      if (!terme) return true;
      return [type.libelle, type.code, type.description]
        .filter(Boolean)
        .some((valeur) => valeur!.toLowerCase().includes(terme));
    });
  }, [types, recherche, etat]);

  const demanderSuppression = async (type: TypeOffreDef) => {
    const nb = type._count?.offres ?? 0;
    const ok = await confirmer({
      titre: `Supprimer « ${type.libelle} » ?`,
      message:
        nb > 0
          ? `Ce type est utilisé par ${nb} offre${nb > 1 ? "s" : ""}. La suppression sera refusée : retirez-le plutôt des formulaires pour cesser de le proposer, sans toucher aux offres existantes.`
          : "Le type et sa définition de champs seront supprimés. Cette action est irréversible.",
      confirmer: "Supprimer",
      danger: true,
    });
    if (ok) supprimer.mutate(type.id);
  };
  const offresRattachees = types.reduce(
    (total, type) => total + (type._count?.offres ?? 0),
    0,
  );

  return (
    <>
      <ConsoleHeader
        title="Types d'offres"
        icon={Layers}
        teinte={TEINTE}
        description="Chaque type porte une identité — nom, icône, couleur — et la liste des informations demandées lors de la publication."
        mesures={
          isLoading
            ? undefined
            : [
                { label: "types", valeur: types.length, teinte: TEINTE },
                { label: "actifs", valeur: actifs, teinte: "var(--success)" },
                { label: "désactivés", valeur: types.length - actifs },
                { label: "champs définis", valeur: totalChamps },
                { label: "offres rattachées", valeur: offresRattachees },
              ]
        }
        actions={
          <Button
            className="rounded-xl"
            render={<Link href="/admin/types-offres/nouveau" />}
          >
            <Plus className="size-4" />
            Nouveau type
          </Button>
        }
      />

      {!isLoading && types.length > 0 ? (
        <ConsoleToolbar>
          <ConsoleSearch
            valeur={recherche}
            onChange={setRecherche}
            placeholder="Nom, code, description…"
            label="Rechercher un type d'offre"
          />
          <ConsoleFiltre<FiltreEtat>
            label="Filtrer par état"
            valeur={etat}
            onChange={setEtat}
            options={[
              { valeur: "", libelle: "Tous", compte: types.length },
              { valeur: "actifs", libelle: "Actifs", compte: actifs, teinte: "var(--success)" },
              {
                valeur: "inactifs",
                libelle: "Désactivés",
                compte: types.length - actifs,
                teinte: "var(--muted-foreground)",
              },
            ]}
          />
        </ConsoleToolbar>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <CarteSquelette key={index} index={index} />
          ))}
        </div>
      ) : types.length === 0 ? (
        <EmptyState
          icon={Layers}
          couleur={TEINTE}
          title="Aucun type d'offre"
          description="Une offre doit être rattachée à un type. Créez-en un pour ouvrir la publication."
          action={
            <Button
              className="rounded-xl"
              render={<Link href="/admin/types-offres/nouveau" />}
            >
              <Plus className="size-4" />
              Créer un type
            </Button>
          }
        />
      ) : affiches.length === 0 ? (
        <EmptyState
          icon={recherche ? Search : ListChecks}
          couleur={TEINTE}
          title="Aucun type ne correspond"
          description="Modifiez la recherche ou le filtre d'état."
          action={
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setRecherche("");
                setEtat("");
              }}
            >
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {affiches.map((type, index) => (
            <CarteType
              key={type.id}
              type={type}
              index={index}
              bascule={basculerActif.isPending}
              onBasculer={() => basculerActif.mutate(type)}
              onSupprimer={() => demanderSuppression(type)}
            />
          ))}
        </div>
      )}

    </>
  );
}
