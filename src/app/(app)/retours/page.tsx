"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, MessageSquare, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmation } from "@/components/admin/console-kit";
import { errorMessage, retoursApi } from "@/lib/api";
import { formatRelative } from "@/lib/format";

const TEINTE = "var(--c-amber)";

export default function RetoursPage() {
  const queryClient = useQueryClient();
  const confirmer = useConfirmation();

  const { data, isLoading } = useQuery({
    queryKey: ["retours", "mine"],
    queryFn: retoursApi.mine,
  });

  const remove = useMutation({
    mutationFn: (id: number) => retoursApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["retours"] });
      toast.success("Retour supprimé");
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  const retours = data ?? [];
  const avecReponse = retours.filter((retour) => retour.reponses?.length).length;
  const reponses = retours.reduce((total, retour) => total + (retour.reponses?.length ?? 0), 0);

  async function supprimer(id: number) {
    const ok = await confirmer({
      titre: "Supprimer ce retour ?",
      message: "Il disparaîtra de la fiche de l'offre, avec les réponses qu'il a reçues.",
      confirmer: "Supprimer",
      danger: true,
    });
    if (ok) remove.mutate(id);
  }

  return (
    <>
      <PageHeader
        title="Mes retours"
        surtitre="Ma contribution"
        icon={Star}
        couleur={TEINTE}
        description="Vos témoignages sur les opportunités auxquelles vous avez candidaté."
        actions={
          <Button variant="outline" className="rounded-xl bg-card/70" render={<Link href="/recherche" />}>
            <Search className="size-4" />
            Rechercher
          </Button>
        }
        mesures={
          retours.length
            ? [
                { label: "Retours publiés", valeur: retours.length, teinte: TEINTE },
                { label: "Avec une réponse", valeur: avecReponse, teinte: "var(--c-sky)" },
                { label: "Réponses reçues", valeur: reponses, teinte: "var(--c-violet)" },
              ]
            : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3 w-24" />
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : retours.length === 0 ? (
        <EmptyState
          icon={Star}
          couleur={TEINTE}
          title="Vous n'avez encore rien partagé"
          description="Racontez comment s'est passée une candidature : délais, processus, ressenti. C'est ce qui aide les suivants à se préparer."
          action={
            <Button className="rounded-xl" render={<Link href="/recherche" />}>
              Parcourir les offres
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {retours.map((retour, index) => (
            <li
              key={retour.id}
              className="entree group relative overflow-hidden rounded-2xl border bg-card p-5 pl-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
              style={{ "--i": index % 8 } as React.CSSProperties}
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1 transition-all duration-300 group-hover:w-1.5"
                style={{ background: TEINTE }}
              />
              <div className="flex items-start justify-between gap-3">
                <span
                  className="hidden size-10 shrink-0 place-items-center rounded-xl sm:grid"
                  style={{
                    background: `color-mix(in oklch, ${TEINTE} 15%, transparent)`,
                    color: TEINTE,
                  }}
                >
                  <Star className="size-4.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  {retour.offre ? (
                    <Link
                      href={`/offres/${retour.offre.id}`}
                      className="inline-flex items-center gap-1.5 text-base font-bold hover:text-primary"
                    >
                      {retour.offre.titre}
                      <ExternalLink className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      Offre supprimée
                    </span>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelative(retour.datePublication)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Supprimer ce retour"
                  disabled={remove.isPending}
                  onClick={() => void supprimer(retour.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed sm:pl-[3.25rem]">
                {retour.contenu}
              </p>

              {retour.reponses?.length ? (
                <div className="mt-4 space-y-2 border-t pt-3 sm:ml-[3.25rem]">
                  {retour.reponses.map((reponse) => (
                    <div
                      key={reponse.id}
                      className="rounded-xl border-l-2 border-l-[var(--c-sky)] bg-[color-mix(in_oklch,var(--c-sky)_6%,transparent)] p-3.5"
                    >
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <MessageSquare className="size-3.5 text-[var(--c-sky)]" aria-hidden />
                        {reponse.auteur.username}
                        <span className="font-normal text-muted-foreground">
                          · {formatRelative(reponse.dateCreation)}
                        </span>
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm">
                        {reponse.contenu}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
