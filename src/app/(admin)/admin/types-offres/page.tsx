"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
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
import { ConsolePastille } from "@/components/admin/console-ui";
import { adminTypesOffresApi, errorMessage } from "@/lib/api";
import { styleType } from "@/lib/type-offre";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TypeOffreDef } from "@/lib/types";

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

          <div onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg bg-card/70 backdrop-blur hover:bg-card"
                    aria-label={`Actions sur ${type.libelle}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  render={<Link href={`/admin/types-offres/${type.id}`} />}
                >
                  <Pencil className="size-4" />
                  Modifier le type et ses champs
                </DropdownMenuItem>
                <DropdownMenuItem disabled={bascule} onClick={onBasculer}>
                  {type.estActif ? (
                    <>
                      <EyeOff className="size-4" />
                      Retirer des formulaires
                    </>
                  ) : (
                    <>
                      <Eye className="size-4" />
                      Remettre dans les formulaires
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onSupprimer}>
                  <Trash2 className="size-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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

          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            render={<Link href={`/admin/types-offres/${type.id}`} />}
          >
            <Pencil className="size-3.5" />
            Modifier
          </Button>
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
  const [aSupprimer, setASupprimer] = useState<TypeOffreDef | null>(null);

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
      setASupprimer(null);
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
  const offresRattachees = types.reduce(
    (total, type) => total + (type._count?.offres ?? 0),
    0,
  );

  return (
    <>
      <ConsoleHeader
        title="Types d'offres"
        icon={Layers}
        teinte="var(--chart-4)"
        description="Chaque type porte une identité — nom, icône, couleur — et la liste des informations demandées lors de la publication."
        mesures={
          isLoading
            ? undefined
            : [
                { label: "types", valeur: types.length, teinte: "var(--chart-4)" },
                { label: "actifs", valeur: actifs, teinte: "var(--success)" },
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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <CarteSquelette key={index} index={index} />
          ))}
        </div>
      ) : types.length === 0 ? (
        <EmptyState
          icon={Layers}
          couleur="var(--chart-4)"
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {types.map((type, index) => (
            <CarteType
              key={type.id}
              type={type}
              index={index}
              bascule={basculerActif.isPending}
              onBasculer={() => basculerActif.mutate(type)}
              onSupprimer={() => setASupprimer(type)}
            />
          ))}
        </div>
      )}

      <Dialog open={Boolean(aSupprimer)} onOpenChange={() => setASupprimer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce type ?</DialogTitle>
            <DialogDescription>
              {aSupprimer && (aSupprimer._count?.offres ?? 0) > 0 ? (
                <>
                  « {aSupprimer.libelle} » est utilisé par{" "}
                  {aSupprimer._count?.offres} offre
                  {(aSupprimer._count?.offres ?? 0) > 1 ? "s" : ""}. La
                  suppression sera refusée : retirez-le plutôt des formulaires
                  pour cesser de le proposer, sans toucher aux offres existantes.
                </>
              ) : (
                <>
                  « {aSupprimer?.libelle} » et sa définition de champs seront
                  supprimés. Cette action est irréversible.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

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
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
