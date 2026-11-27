"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bug,
  CalendarClock,
  Flag,
  HelpCircle,
  Lightbulb,
  Link2,
  Loader2,
  Lock,
  MessageCircle,
  MessagesSquare,
  SendHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConsolePastille } from "@/components/admin/console-ui";
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
  FEEDBACK_STATUS_LABELS,
} from "@/lib/enums";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FeedbackCategory, FeedbackPriority, FeedbackStatus } from "@/lib/types";

const TEINTE_STATUT: Record<FeedbackStatus, string | undefined> = {
  OUVERT: "var(--c-blue)",
  EN_COURS: "var(--c-orange)",
  RESOLU: "var(--c-emerald)",
  FERME: undefined,
};

const TEINTE_PRIORITE: Record<FeedbackPriority, string | undefined> = {
  BASSE: undefined,
  MOYENNE: "var(--c-sky)",
  HAUTE: "var(--c-orange)",
  CRITIQUE: "var(--c-rose)",
};

const CATEGORIES: Record<FeedbackCategory, { icone: LucideIcon; teinte: string }> = {
  BUG: { icone: Bug, teinte: "var(--c-rose)" },
  AMELIORATION: { icone: Lightbulb, teinte: "var(--c-amber)" },
  QUESTION: { icone: HelpCircle, teinte: "var(--c-violet)" },
  AUTRE: { icone: MessageCircle, teinte: "var(--c-sky)" },
};

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

  const categorie = CATEGORIES[feedback.categorie] ?? CATEGORIES.AUTRE;
  const IconeCategorie = categorie.icone;
  const teinte = categorie.teinte;
  const reponses = feedback.reponses ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 rounded-xl text-muted-foreground hover:text-foreground"
        render={<Link href="/feedback" />}
      >
        <ArrowLeft className="size-4" />
        Signalements
      </Button>

      <article className="entree relative overflow-hidden rounded-3xl border bg-card shadow-sm">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(115deg, color-mix(in oklch, ${teinte} 14%, transparent) 0%, color-mix(in oklch, ${teinte} 4%, transparent) 45%, transparent 75%)`,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full opacity-20 blur-3xl"
          style={{ background: teinte }}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-white"
              style={{
                background: `linear-gradient(135deg, ${teinte}, color-mix(in oklch, ${teinte} 65%, black))`,
                boxShadow: `0 10px 24px -8px color-mix(in oklch, ${teinte} 75%, transparent)`,
              }}
            >
              <IconeCategorie className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <ConsolePastille
                  libelle={FEEDBACK_STATUS_LABELS[feedback.statut]}
                  teinte={TEINTE_STATUT[feedback.statut]}
                />
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: teinte }}
                >
                  {FEEDBACK_CATEGORY_LABELS[feedback.categorie]}
                </span>
              </div>
              <h1 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
                {feedback.titre}
              </h1>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed">
            {feedback.description}
          </p>
        </div>

        <dl className="relative flex flex-wrap gap-px border-t bg-border/60 text-xs">
          <div className="flex min-w-0 grow basis-[calc(50%-1px)] items-center gap-2.5 bg-card/90 px-5 py-3 sm:basis-0">
            <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <dt className="text-muted-foreground">Ouvert le</dt>
              <dd className="truncate font-semibold">{formatDateTime(feedback.createdAt)}</dd>
            </div>
          </div>
          <div className="flex min-w-0 grow basis-[calc(50%-1px)] items-center gap-2.5 bg-card/90 px-5 py-3 sm:basis-0">
            <Flag
              className="size-4 shrink-0"
              style={{ color: TEINTE_PRIORITE[feedback.priorite] ?? "var(--muted-foreground)" }}
              aria-hidden
            />
            <div className="min-w-0">
              <dt className="text-muted-foreground">Priorité</dt>
              <dd className="font-semibold">{FEEDBACK_PRIORITY_LABELS[feedback.priorite]}</dd>
            </div>
          </div>
          {feedback.pageUrl ? (
            <div className="flex min-w-0 grow basis-full items-center gap-2.5 bg-card/90 px-5 py-3 sm:basis-0">
              <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <dt className="text-muted-foreground">Depuis la page</dt>
                <dd className="truncate font-mono font-semibold">{feedback.pageUrl}</dd>
              </div>
            </div>
          ) : null}
        </dl>
      </article>

      <section className="mt-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
          <span className="grid size-7 place-items-center rounded-lg bg-[color-mix(in_oklch,var(--c-sky)_15%,transparent)] text-[var(--c-sky)]">
            <MessagesSquare className="size-4" aria-hidden />
          </span>
          Échanges
          {reponses.length ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground">
              {reponses.length}
            </span>
          ) : null}
        </h2>

        {!reponses.length ? (
          <p className="dashed-frame py-10 text-center text-sm text-muted-foreground">
            Aucune réponse pour le moment. L&apos;équipe vous répondra ici.
          </p>
        ) : (
          <ul className="space-y-4">
            {reponses.map((reponse, index) => {
              // Mes propres précisions à droite, celles de l'équipe à gauche :
              // la lecture d'un fil de discussion habituel.
              const moi = reponse.auteur.id === feedback.auteur.id;
              return (
                <li
                  key={reponse.id}
                  className={cn("entree flex gap-3", moi && "flex-row-reverse")}
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <Avatar className="size-8 shrink-0 ring-2 ring-background">
                    <AvatarImage src={fileUrl(reponse.auteur.pictureUrl)} alt="" />
                    <AvatarFallback className="text-[11px] font-bold">
                      {reponse.auteur.username[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "min-w-0 max-w-[85%] rounded-2xl p-4 shadow-sm",
                      moi
                        ? "rounded-tr-md bg-primary text-primary-foreground"
                        : "rounded-tl-md border bg-card",
                    )}
                  >
                    <p className="text-xs">
                      <span className="font-semibold">
                        {moi ? "Vous" : reponse.auteur.username}
                      </span>
                      {!moi ? (
                        <span className="ml-1.5 rounded-full bg-[color-mix(in_oklch,var(--c-sky)_15%,transparent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--c-sky)]">
                          Équipe Noken
                        </span>
                      ) : null}
                      <span className={moi ? "text-primary-foreground/70" : "text-muted-foreground"}>
                        {" · "}
                        {formatRelative(reponse.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                      {reponse.contenu}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {feedback.statut !== "FERME" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reply.trim()) send.mutate(reply.trim());
          }}
          className="mt-5 flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-ring/30"
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
            className="max-h-40 min-h-0 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-xl"
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
        <p className="mt-5 flex items-center justify-center gap-2 rounded-2xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden />
          Ce signalement est clôturé.
        </p>
      )}
    </div>
  );
}
