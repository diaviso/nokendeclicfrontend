"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import {
  EmojiPicker,
  insererAuCurseur,
} from "@/components/shared/emoji-picker";
import { errorMessage, feedbackApi, fileUrl } from "@/lib/api";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_STATUS_BADGE,
  FEEDBACK_STATUS_LABELS,
} from "@/lib/enums";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function FeedbackDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  // Next 16 : `params` est une promesse, y compris dans un composant client.
  const { id } = use(props.params);
  const feedbackId = Number(id);
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const champ = useRef<HTMLTextAreaElement>(null);

  const { data: feedback, isLoading, isError } = useQuery({
    queryKey: ["feedback", feedbackId],
    queryFn: () => feedbackApi.byId(feedbackId),
    enabled: Number.isInteger(feedbackId),
  });

  const send = useMutation({
    mutationFn: (contenu: string) => feedbackApi.reply(feedbackId, contenu),
    onSuccess: async () => {
      setReply("");
      await queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (error) =>
      toast.error("Envoi impossible", { description: errorMessage(error) }),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !feedback) {
    return (
      <EmptyState
        title="Signalement introuvable"
        description="Il a peut-être été supprimé."
        action={
          <Button variant="outline" size="sm" render={<Link href="/feedback" />}>
            Retour aux signalements
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
        render={<Link href="/feedback" />}
      >
        <ArrowLeft className="size-4" />
        Signalements
      </Button>

      <article className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("h-5 px-1.5 text-[11px]", FEEDBACK_STATUS_BADGE[feedback.statut])}
          >
            {FEEDBACK_STATUS_LABELS[feedback.statut]}
          </Badge>
          <Badge variant="secondary" className="h-6 rounded-full px-2.5 text-[11px]">
            {FEEDBACK_CATEGORY_LABELS[feedback.categorie]}
          </Badge>
          <Badge variant="outline" className="h-6 rounded-full px-2.5 text-[11px]">
            Priorité {FEEDBACK_PRIORITY_LABELS[feedback.priorite].toLowerCase()}
          </Badge>
        </div>

        <h1 className="mt-3 text-xl font-semibold tracking-tight">
          {feedback.titre}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Ouvert le {formatDateTime(feedback.createdAt)}
          {feedback.pageUrl ? ` · depuis ${feedback.pageUrl}` : ""}
        </p>

        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">
          {feedback.description}
        </p>
      </article>

      <section className="mt-4">
        <h2 className="mb-4 text-lg font-bold">
          Échanges
          {feedback.reponses?.length ? ` (${feedback.reponses.length})` : ""}
        </h2>

        {!feedback.reponses?.length ? (
          <p className="dashed-frame py-8 text-center text-sm text-muted-foreground">
            Aucune réponse pour le moment. L&apos;équipe vous répondra ici.
          </p>
        ) : (
          <ul className="space-y-3">
            {feedback.reponses.map((reponse) => (
              <li key={reponse.id} className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={fileUrl(reponse.auteur.pictureUrl)} alt="" />
                  <AvatarFallback className="text-[11px]">
                    {reponse.auteur.username[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border bg-card p-4 shadow-sm">
                  <p className="text-xs">
                    <span className="font-medium">{reponse.auteur.username}</span>
                    <span className="text-muted-foreground">
                      {" · "}
                      {formatRelative(reponse.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                    {reponse.contenu}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {feedback.statut !== "FERME" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reply.trim()) send.mutate(reply.trim());
          }}
          className="mt-4 flex items-end gap-2"
        >
          <EmojiPicker
            onChoisir={(symbole) =>
              setReply((precedent) =>
                insererAuCurseur(champ.current, precedent, symbole),
              )
            }
            disabled={send.isPending}
          />

          <Textarea
            ref={champ}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={2}
            placeholder="Ajouter une précision…"
            aria-label="Votre réponse"
            className="max-h-40 resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!reply.trim() || send.isPending}
            aria-label="Envoyer"
          >
            {send.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendHorizontal className="size-4" />
            )}
          </Button>
        </form>
      ) : (
        <p className="mt-4 rounded-md border bg-muted/30 p-3 text-center text-sm text-muted-foreground">
          Ce signalement est clôturé.
        </p>
      )}
    </div>
  );
}
