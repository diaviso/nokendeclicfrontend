"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorMessage, groupesApi } from "@/lib/api";
import { fullName } from "@/lib/format";

/** Nombre d'invitations en attente, pour la pastille de l'onglet. */
export function useInvitationsGroupes() {
  return useQuery({
    queryKey: ["groupes", "invitations"],
    queryFn: groupesApi.mesInvitations,
    refetchInterval: 60_000,
  });
}

/**
 * Invitations reçues, à accepter ou refuser.
 *
 * Affichées en tête de la liste des groupes : une invitation qui dort dans un
 * écran séparé n'est jamais vue.
 */
export function InvitationsGroupes({
  onRejoint,
}: {
  onRejoint: (groupeId: number) => void;
}) {
  const queryClient = useQueryClient();
  const { data: invitations = [] } = useInvitationsGroupes();

  const repondre = useMutation({
    mutationFn: ({ id, accepte }: { id: number; accepte: boolean }) =>
      groupesApi.repondre(id, accepte),
    onSuccess: async (reponse) => {
      await queryClient.invalidateQueries({ queryKey: ["groupes"] });
      toast.success(reponse.message);
      if (reponse.groupeId) onRejoint(reponse.groupeId);
    },
    onError: (error) =>
      toast.error("Réponse impossible", { description: errorMessage(error) }),
  });

  if (invitations.length === 0) return null;

  return (
    <div className="border-b bg-primary/5 p-2">
      <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Invitation{invitations.length > 1 ? "s" : ""} en attente
      </p>

      <ul className="space-y-1.5">
        {invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="rounded-xl border bg-card p-2.5 shadow-sm"
          >
            <div className="flex items-start gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10">
                <UsersRound className="size-4 text-primary" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {invitation.groupe.nom}
                </p>
                <p className="text-xs text-muted-foreground">
                  {invitation.invitePar
                    ? `Invité par ${fullName(invitation.invitePar)}`
                    : "Invitation"}{" "}
                  · {invitation.groupe._count.membres} membre
                  {invitation.groupe._count.membres > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="h-8 flex-1"
                disabled={repondre.isPending}
                onClick={() =>
                  repondre.mutate({ id: invitation.id, accepte: true })
                }
              >
                {repondre.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Rejoindre
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                disabled={repondre.isPending}
                onClick={() =>
                  repondre.mutate({ id: invitation.id, accepte: false })
                }
              >
                <X className="size-3.5" />
                Refuser
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
