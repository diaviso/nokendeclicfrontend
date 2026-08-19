"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, retoursApi } from "@/lib/api";
import { formatRelative } from "@/lib/format";

export default function RetoursPage() {
  const queryClient = useQueryClient();

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

  return (
    <>
      <PageHeader
        title="Mes retours"
        surtitre="Ma contribution"
        icon={Star}
        couleur="var(--chart-3)"
        description="Vos témoignages sur les opportunités auxquelles vous avez candidaté."
        actions={
          <Button variant="outline" className="rounded-xl" render={<Link href="/recherche" />}>
            <Search className="size-4" />
            Rechercher
          </Button>
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
          couleur="var(--chart-3)"
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
              className="entree rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              style={{ "--i": index } as React.CSSProperties}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {retour.offre ? (
                    <Link
                      href={`/offres/${retour.offre.id}`}
                      className="text-base font-bold hover:text-primary hover:underline"
                    >
                      {retour.offre.titre}
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
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Supprimer ce retour"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(retour.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                {retour.contenu}
              </p>

              {retour.reponses?.length ? (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {retour.reponses.map((reponse) => (
                    <div
                      key={reponse.id}
                      className="rounded-xl border-l-2 border-l-primary bg-muted/30 p-3.5"
                    >
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <MessageSquare className="size-3.5" aria-hidden />
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
