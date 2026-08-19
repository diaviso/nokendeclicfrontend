"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Eye,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PastilleModeration,
  etatModeration,
} from "@/components/partenaire/statut-moderation";
import { errorMessage, offresApi } from "@/lib/api";
import { styleOffre } from "@/lib/type-offre";
import { formatDateShort, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Offre, StatutModeration } from "@/lib/types";

type Filtre = StatutModeration | "";

const FILTRES: { valeur: Filtre; libelle: string }[] = [
  { valeur: "", libelle: "Toutes" },
  { valeur: "EN_ATTENTE", libelle: "En validation" },
  { valeur: "PUBLIEE", libelle: "En ligne" },
  { valeur: "REFUSEE", libelle: "Refusées" },
];

function CarteOffre({ offre, index }: { offre: Offre; index: number }) {
  const style = styleOffre(offre);
  const Icone = style.icone;
  const statut = offre.statutModeration ?? "PUBLIEE";

  return (
    <article
      style={{ "--i": index } as React.CSSProperties}
      className="entree group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 transition-all duration-200 group-hover:w-1.5"
        style={{ background: style.teinte }}
      />

      <div className="flex items-start gap-3.5">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105"
          style={{
            background: `color-mix(in oklch, ${style.teinte} 12%, transparent)`,
            color: style.teinte,
          }}
        >
          <Icone className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="min-w-0 text-base font-bold leading-snug">
              {offre.titre}
            </h2>
            <PastilleModeration statut={statut} />
          </div>

          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {offre.entreprise ?? "Sans organisation"}
            {offre.localisation ? ` · ${offre.localisation}` : ""}
            {` · ${formatDateShort(offre.datePublication)}`}
          </p>

          {statut === "REFUSEE" && offre.motifRefus ? (
            <p className="mt-2.5 rounded-xl border border-dashed px-3 py-2 text-sm">
              <span className="font-semibold text-destructive">Motif : </span>
              {offre.motifRefus}
            </p>
          ) : null}

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
            <dl className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Eye className="size-3.5" aria-hidden />
                <dd className="tabular-nums">{formatNumber(offre.viewCount)}</dd>
                <dt className="sr-only">consultations</dt>
              </div>
              {offre._count?.commentaires ? (
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="size-3.5" aria-hidden />
                  <dd className="tabular-nums">
                    {formatNumber(offre._count.commentaires)}
                  </dd>
                  <dt className="sr-only">commentaires</dt>
                </div>
              ) : null}
            </dl>

            <div className="flex items-center gap-1.5">
              {statut === "PUBLIEE" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg"
                  render={<Link href={`/offres/${offre.id}`} />}
                >
                  <Eye className="size-4" />
                  Voir
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                render={<Link href={`/partenaire/offres/${offre.id}/modifier`} />}
              >
                <Pencil className="size-3.5" />
                Modifier
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MesOffresPartenairePage() {
  const queryClient = useQueryClient();
  const [filtre, setFiltre] = useState<Filtre>("");
  const [aSupprimer, setASupprimer] = useState<Offre | null>(null);

  const { data: offres = [], isLoading } = useQuery({
    queryKey: ["mes-offres"],
    queryFn: offresApi.mine,
  });

  const supprimer = useMutation({
    mutationFn: (id: number) => offresApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mes-offres"] });
      setASupprimer(null);
      toast.success("Offre supprimée");
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  const comptes = useMemo(() => {
    const total: Record<string, number> = { "": offres.length };
    for (const offre of offres) {
      const statut = offre.statutModeration ?? "PUBLIEE";
      total[statut] = (total[statut] ?? 0) + 1;
    }
    return total;
  }, [offres]);

  const affichees = filtre
    ? offres.filter((offre) => (offre.statutModeration ?? "PUBLIEE") === filtre)
    : offres;

  const enAttente = comptes.EN_ATTENTE ?? 0;

  return (
    <>
      <PageHeader
        title="Mes offres"
        surtitre="Recrutement"
        icon={Building2}
        couleur="var(--chart-3)"
        description="Publiez vos opportunités et suivez leur mise en ligne."
        actions={
          <Button
            className="rounded-xl"
            render={<Link href="/partenaire/offres/nouvelle" />}
          >
            <Plus className="size-4" />
            Publier une offre
          </Button>
        }
      />

      {enAttente > 0 ? (
        <p className="mb-4 rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {enAttente} annonce{enAttente > 1 ? "s" : ""} en cours de relecture par
          l&apos;équipe Noken. {enAttente > 1 ? "Elles seront" : "Elle sera"} mise
          {enAttente > 1 ? "s" : ""} en ligne dès validation — vous serez
          prévenu.
        </p>
      ) : null}

      {offres.length > 0 ? (
        <div
          role="group"
          aria-label="Filtrer par état"
          className="no-scrollbar mb-4 flex gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1"
        >
          {FILTRES.map((option) => {
            const actif = option.valeur === filtre;
            const compte = comptes[option.valeur] ?? 0;
            const teinte = option.valeur
              ? etatModeration(option.valeur).teinte
              : undefined;

            return (
              <button
                key={option.valeur || "toutes"}
                type="button"
                aria-pressed={actif}
                onClick={() => setFiltre(option.valeur)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-all duration-200",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  actif
                    ? "bg-card font-semibold text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {teinte ? (
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: teinte }}
                  />
                ) : null}
                {option.libelle}
                <span className="text-[11px] font-bold tabular-nums text-muted-foreground/70">
                  {compte}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
              <Skeleton className="mt-4 h-3 w-24" />
            </div>
          ))}
        </div>
      ) : affichees.length === 0 ? (
        <EmptyState
          icon={Building2}
          couleur="var(--chart-3)"
          title={filtre ? "Aucune offre dans cet état" : "Aucune offre publiée"}
          description={
            filtre
              ? "Changez de filtre pour retrouver vos autres annonces."
              : "Publiez votre première opportunité : elle sera relue puis mise en ligne."
          }
          action={
            filtre ? undefined : (
              <Button
                className="rounded-xl"
                render={<Link href="/partenaire/offres/nouvelle" />}
              >
                <Plus className="size-4" />
                Publier une offre
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Le groupe est porté par l'enveloppe et non par la carte : le
              bouton de suppression en est un frère, et `group-hover` se résout
              sur l'ancêtre le plus proche. */}
          {affichees.map((offre, index) => (
            <div key={offre.id} className="group relative">
              <CarteOffre offre={offre} index={index} />
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4 size-8 rounded-lg text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                aria-label={`Supprimer ${offre.titre}`}
                onClick={() => setASupprimer(offre)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(aSupprimer)} onOpenChange={() => setASupprimer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette offre ?</DialogTitle>
            <DialogDescription>
              « {aSupprimer?.titre} » sera définitivement supprimée, ainsi que
              les commentaires et retours qu&apos;elle a reçus. Cette action est
              irréversible.
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
