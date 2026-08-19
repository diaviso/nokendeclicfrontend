"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Link2,
  Loader2,
  MessageCircle,
  SendHorizontal,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import {
  EmojiPicker,
  insererAuCurseur,
} from "@/components/shared/emoji-picker";
import { ConsolePastille } from "@/components/admin/console-ui";
import { adminApi, errorMessage, fileUrl } from "@/lib/api";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_STATUS_LABELS,
} from "@/lib/enums";
import { formatDateTime, formatRelative, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FeedbackPriority, FeedbackStatus } from "@/lib/types";

const TEINTE_STATUT: Record<FeedbackStatus, string | undefined> = {
  OUVERT: "var(--info)",
  EN_COURS: "var(--warning)",
  RESOLU: "var(--success)",
  FERME: undefined,
};

const TEINTE_PRIORITE: Record<FeedbackPriority, string | undefined> = {
  CRITIQUE: "var(--destructive)",
  HAUTE: "var(--warning)",
  MOYENNE: "var(--chart-1)",
  BASSE: undefined,
};

const classeSelect =
  "h-10 w-full rounded-xl border bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-input focus-visible:ring-2 focus-visible:ring-ring/40";

export default function AdminFeedbackDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const feedbackId = Number(id);
  const queryClient = useQueryClient();
  const [reponse, setReponse] = useState("");
  const champReponse = useRef<HTMLTextAreaElement>(null);

  const {
    data: feedback,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "feedback", feedbackId],
    queryFn: () => adminApi.feedbackById(feedbackId),
    enabled: Number.isInteger(feedbackId),
  });

  const rafraichir = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] });

  const changerStatut = useMutation({
    mutationFn: (statut: FeedbackStatus) =>
      adminApi.setFeedbackStatus(feedbackId, statut),
    onSuccess: async () => {
      await rafraichir();
      toast.success("Statut modifié");
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  const changerPriorite = useMutation({
    mutationFn: (priorite: FeedbackPriority) =>
      adminApi.setFeedbackPriority(feedbackId, priorite),
    onSuccess: async () => {
      await rafraichir();
      toast.success("Priorité modifiée");
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  const envoyer = useMutation({
    mutationFn: (contenu: string) => adminApi.replyFeedback(feedbackId, contenu),
    onSuccess: async () => {
      setReponse("");
      await rafraichir();
      toast.success("Réponse envoyée");
    },
    onError: (error) =>
      toast.error("Envoi impossible", { description: errorMessage(error) }),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Chargement du signalement…</span>
      </div>
    );
  }

  if (isError || !feedback) {
    return (
      <EmptyState
        icon={MessageCircle}
        couleur="var(--chart-5)"
        title="Signalement introuvable"
        description="Il a peut-être été supprimé depuis l'ouverture de la liste."
        action={
          <Button
            variant="outline"
            className="rounded-xl"
            render={<Link href="/admin/feedback" />}
          >
            Retour à la liste
          </Button>
        }
      />
    );
  }

  const teinte =
    TEINTE_PRIORITE[feedback.priorite] ??
    TEINTE_STATUT[feedback.statut] ??
    "var(--chart-5)";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 rounded-lg"
        render={<Link href="/admin/feedback" />}
      >
        <ArrowLeft className="size-4" />
        Signalements
      </Button>

      <div className="grid gap-4 lg:grid-cols-[1fr_19rem]">
        <div className="min-w-0">
          <article className="entree relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: teinte }}
            />

            <div className="flex flex-wrap items-center gap-1.5">
              <ConsolePastille
                libelle={FEEDBACK_STATUS_LABELS[feedback.statut]}
                teinte={TEINTE_STATUT[feedback.statut]}
                discret={!TEINTE_STATUT[feedback.statut]}
              />
              <ConsolePastille
                libelle={FEEDBACK_PRIORITY_LABELS[feedback.priorite]}
                teinte={TEINTE_PRIORITE[feedback.priorite]}
                discret={!TEINTE_PRIORITE[feedback.priorite]}
              />
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {FEEDBACK_CATEGORY_LABELS[feedback.categorie]}
              </span>
            </div>

            <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
              {feedback.titre}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Avatar className="size-7">
                <AvatarImage src={fileUrl(feedback.auteur.pictureUrl)} alt="" />
                <AvatarFallback className="text-[10px]">
                  {(feedback.auteur.username[0] ?? "?").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {fullName(feedback.auteur)}
                </span>
                {feedback.auteur.email ? ` · ${feedback.auteur.email}` : ""} ·{" "}
                {formatDateTime(feedback.createdAt)}
              </p>
            </div>

            {feedback.pageUrl ? (
              <p className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <Link2 className="size-3.5 shrink-0" aria-hidden />
                Signalé depuis
                <code className="min-w-0 truncate font-mono">
                  {feedback.pageUrl}
                </code>
              </p>
            ) : null}

            <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed">
              {feedback.description}
            </p>
          </article>

          <section className="mt-4">
            <h2 className="mb-3 flex items-center gap-2 px-1 text-sm font-bold">
              Échanges
              {feedback.reponses?.length ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                  {feedback.reponses.length}
                </span>
              ) : null}
            </h2>

            {!feedback.reponses?.length ? (
              <p className="dashed-frame py-10 text-center text-sm text-muted-foreground">
                Personne n&apos;a encore répondu. Votre réponse sera notifiée à
                l&apos;auteur.
              </p>
            ) : (
              <ul className="space-y-3">
                {feedback.reponses.map((message, index) => (
                  <li
                    key={message.id}
                    style={{ "--i": index } as React.CSSProperties}
                    className="entree flex gap-3"
                  >
                    <Avatar className="size-8 shrink-0">
                      <AvatarImage
                        src={fileUrl(message.auteur.pictureUrl)}
                        alt=""
                      />
                      <AvatarFallback className="text-[11px]">
                        {(message.auteur.username[0] ?? "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 rounded-2xl border bg-card p-3.5 shadow-sm">
                      <p className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold">
                          {message.auteur.username}
                        </span>
                        <span className="text-muted-foreground">
                          {formatRelative(message.createdAt)}
                        </span>
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                        {message.contenu}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (reponse.trim()) envoyer.mutate(reponse.trim());
              }}
              className="mt-4 rounded-2xl border bg-card p-3 shadow-sm"
              noValidate
            >
              <Textarea
                ref={champReponse}
                value={reponse}
                onChange={(event) => setReponse(event.target.value)}
                rows={3}
                placeholder="Répondre à l'utilisateur…"
                aria-label="Votre réponse"
                className="max-h-48 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <div className="flex items-center justify-between gap-3 border-t pt-2.5">
                <div className="flex items-center gap-2">
                  <EmojiPicker
                    onChoisir={(symbole) =>
                      setReponse((precedent) =>
                        insererAuCurseur(champReponse.current, precedent, symbole),
                      )
                    }
                    disabled={envoyer.isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    L&apos;auteur recevra une notification.
                  </p>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl"
                  disabled={!reponse.trim() || envoyer.isPending}
                >
                  {envoyer.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="size-4" />
                  )}
                  Répondre
                </Button>
              </div>
            </form>
          </section>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--console-entete)+1rem)] lg:self-start">
          <div className="entree overflow-hidden rounded-2xl border bg-card shadow-sm">
            <header className="flex items-center gap-2 border-b px-4 py-3">
              <ShieldCheck
                className="size-4 text-muted-foreground"
                aria-hidden
              />
              <h2 className="text-sm font-bold">Traitement</h2>
            </header>

            <div className="space-y-4 p-4">
              <div>
                <Label htmlFor="statut">Statut</Label>
                <select
                  id="statut"
                  className={cn(classeSelect, "mt-1.5")}
                  value={feedback.statut}
                  disabled={changerStatut.isPending}
                  onChange={(event) =>
                    changerStatut.mutate(event.target.value as FeedbackStatus)
                  }
                >
                  {(
                    Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]
                  ).map((valeur) => (
                    <option key={valeur} value={valeur}>
                      {FEEDBACK_STATUS_LABELS[valeur]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="priorite">Priorité</Label>
                <select
                  id="priorite"
                  className={cn(classeSelect, "mt-1.5")}
                  value={feedback.priorite}
                  disabled={changerPriorite.isPending}
                  onChange={(event) =>
                    changerPriorite.mutate(
                      event.target.value as FeedbackPriority,
                    )
                  }
                >
                  {(
                    Object.keys(FEEDBACK_PRIORITY_LABELS) as FeedbackPriority[]
                  ).map((valeur) => (
                    <option key={valeur} value={valeur}>
                      {FEEDBACK_PRIORITY_LABELS[valeur]}
                    </option>
                  ))}
                </select>
              </div>

              <dl className="border-t pt-3 text-xs">
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Ouvert</dt>
                  <dd className="font-medium">
                    {formatRelative(feedback.createdAt)}
                  </dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Mis à jour</dt>
                  <dd className="font-medium">
                    {formatRelative(feedback.updatedAt)}
                  </dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Réponses</dt>
                  <dd className="font-medium tabular-nums">
                    {feedback.reponses?.length ?? 0}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
