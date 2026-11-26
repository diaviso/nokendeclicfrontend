"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarClock,
  Flag,
  Info,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  SendHorizontal,
  ShieldCheck,
  Tag,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import {
  EmojiPicker,
  insererAuCurseur,
} from "@/components/shared/emoji-picker";
import { ConsolePastille } from "@/components/admin/console-ui";
import {
  ConsolePanneau,
  ConsoleProprietes,
} from "@/components/admin/console-kit";
import { adminApi, errorMessage, fileUrl } from "@/lib/api";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_STATUS_LABELS,
} from "@/lib/enums";
import { formatDateTime, formatRelative, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FeedbackPriority, FeedbackStatus } from "@/lib/types";

const TEINTE = "var(--c-rose)";

const TEINTE_STATUT: Record<FeedbackStatus, string | undefined> = {
  OUVERT: "var(--info)",
  EN_COURS: "var(--warning)",
  RESOLU: "var(--success)",
  FERME: undefined,
};

const TEINTE_PRIORITE: Record<FeedbackPriority, string | undefined> = {
  CRITIQUE: "var(--destructive)",
  HAUTE: "var(--warning)",
  MOYENNE: "var(--c-sky)",
  BASSE: undefined,
};

/**
 * Choix segmenté du panneau de traitement : chaque valeur est visible et
 * cliquable d'un geste, avec sa couleur, là où une liste déroulante les cache.
 */
function ChoixSegmente<V extends string>({
  libelle,
  valeurs,
  libelles,
  teintes,
  valeur,
  onChange,
  enCours,
}: {
  libelle: string;
  valeurs: V[];
  libelles: Record<V, string>;
  teintes: Record<V, string | undefined>;
  valeur: V;
  onChange: (valeur: V) => void;
  enCours?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold">
        {libelle}
        {enCours ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        ) : null}
      </p>
      <div role="group" aria-label={libelle} className="grid grid-cols-2 gap-1.5">
        {valeurs.map((option) => {
          const actif = option === valeur;
          const teinte = teintes[option] ?? "var(--muted-foreground)";
          return (
            <button
              key={option}
              type="button"
              aria-pressed={actif}
              disabled={enCours}
              onClick={() => !actif && onChange(option)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60",
                actif ? "font-semibold shadow-sm" : "hover:bg-muted/60",
              )}
              style={
                actif
                  ? {
                      borderColor: `color-mix(in oklch, ${teinte} 45%, transparent)`,
                      background: `color-mix(in oklch, ${teinte} 10%, transparent)`,
                      color: teinte,
                    }
                  : undefined
              }
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: teinte }}
              />
              {libelles[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
        couleur={TEINTE}
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
    TEINTE;
  const nombreReponses = feedback.reponses?.length ?? 0;

  const soumettre = () => {
    if (reponse.trim() && !envoyer.isPending) envoyer.mutate(reponse.trim());
  };

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

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
          {/* Le signalement */}
          <article className="entree relative overflow-hidden rounded-3xl border bg-card shadow-sm">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(120deg, color-mix(in oklch, ${teinte} 9%, transparent), transparent 60%)`,
              }}
            />
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: teinte }}
            />

            <div className="relative p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-1.5">
                <ConsolePastille
                  libelle={FEEDBACK_STATUS_LABELS[feedback.statut]}
                  teinte={TEINTE_STATUT[feedback.statut]}
                  discret={!TEINTE_STATUT[feedback.statut]}
                />
                <ConsolePastille
                  libelle={`Priorité ${FEEDBACK_PRIORITY_LABELS[feedback.priorite].toLowerCase()}`}
                  teinte={TEINTE_PRIORITE[feedback.priorite]}
                  discret={!TEINTE_PRIORITE[feedback.priorite]}
                />
                <span className="inline-flex items-center gap-1 rounded-md border bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">
                  <Tag className="size-3" aria-hidden />
                  {FEEDBACK_CATEGORY_LABELS[feedback.categorie]}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  #{feedback.id}
                </span>
              </div>

              <h1 className="mt-3 text-balance text-xl font-extrabold tracking-tight sm:text-2xl">
                {feedback.titre}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Avatar className="size-9 ring-2 ring-background">
                  <AvatarImage src={fileUrl(feedback.auteur.pictureUrl)} alt="" />
                  <AvatarFallback className="text-[11px] font-semibold">
                    {(feedback.auteur.username[0] ?? "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-xs leading-tight">
                  <Link
                    href={`/admin/utilisateurs/${feedback.auteur.id}`}
                    className="text-sm font-semibold hover:text-primary hover:underline"
                  >
                    {fullName(feedback.auteur)}
                  </Link>
                  <p className="text-muted-foreground">
                    {feedback.auteur.email ? `${feedback.auteur.email} · ` : ""}
                    {formatDateTime(feedback.createdAt)}
                  </p>
                </div>
              </div>

              {feedback.pageUrl ? (
                <p className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-lg border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                  <Link2 className="size-3.5 shrink-0" aria-hidden />
                  Signalé depuis
                  <code className="min-w-0 truncate font-mono">
                    {feedback.pageUrl}
                  </code>
                </p>
              ) : null}

              <div className="mt-5 rounded-2xl border bg-background/70 p-4 sm:p-5">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {feedback.description}
                </p>
              </div>
            </div>
          </article>

          {/* Fil des échanges */}
          <ConsolePanneau
            titre="Échanges"
            description={
              nombreReponses
                ? `${nombreReponses} message${nombreReponses > 1 ? "s" : ""}`
                : "Aucune réponse pour l'instant"
            }
            icone={MessagesSquare}
            teinte={TEINTE}
          >
            {!nombreReponses ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-10 text-center">
                <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
                  <MessagesSquare className="size-5" aria-hidden />
                </span>
                <p className="text-sm font-medium">Personne n&apos;a encore répondu.</p>
                <p className="text-xs text-muted-foreground">
                  Votre réponse sera notifiée à l&apos;auteur.
                </p>
              </div>
            ) : (
              <ol className="space-y-4">
                {feedback.reponses.map((message, index) => {
                  const deLAuteur = message.auteur.id === feedback.auteur.id;
                  return (
                    <li
                      key={message.id}
                      style={{ "--i": index } as React.CSSProperties}
                      className={cn(
                        "entree flex gap-3",
                        !deLAuteur && "flex-row-reverse",
                      )}
                    >
                      <Avatar className="size-8 shrink-0">
                        <AvatarImage
                          src={fileUrl(message.auteur.pictureUrl)}
                          alt=""
                        />
                        <AvatarFallback
                          className={cn(
                            "text-[11px] font-semibold",
                            !deLAuteur && "bg-primary text-primary-foreground",
                          )}
                        >
                          {(message.auteur.username[0] ?? "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={cn(
                          "min-w-0 max-w-[85%]",
                          !deLAuteur && "text-right",
                        )}
                      >
                        <p
                          className={cn(
                            "mb-1 flex items-center gap-1.5 text-xs",
                            !deLAuteur && "justify-end",
                          )}
                        >
                          <span className="font-semibold">
                            {message.auteur.username}
                          </span>
                          {!deLAuteur ? (
                            <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 text-[10px] font-semibold text-primary">
                              <ShieldCheck className="size-2.5" aria-hidden />
                              Équipe
                            </span>
                          ) : null}
                          <time
                            dateTime={message.createdAt}
                            title={formatDateTime(message.createdAt)}
                            className="text-muted-foreground"
                          >
                            {formatRelative(message.createdAt)}
                          </time>
                        </p>
                        <div
                          className={cn(
                            "inline-block rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed shadow-sm",
                            deLAuteur
                              ? "rounded-tl-sm border bg-muted/40"
                              : "rounded-tr-sm bg-primary/[0.08] ring-1 ring-inset ring-primary/15",
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.contenu}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                soumettre();
              }}
              className="mt-5 overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring/30"
              noValidate
            >
              <Textarea
                ref={champReponse}
                value={reponse}
                onChange={(event) => setReponse(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    soumettre();
                  }
                }}
                rows={3}
                placeholder="Répondre à l'utilisateur…"
                aria-label="Votre réponse"
                className="max-h-48 min-h-24 resize-none border-0 bg-transparent px-4 pt-3 shadow-none focus-visible:ring-0"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-3 py-2.5">
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
                    L&apos;auteur recevra une notification ·{" "}
                    <kbd className="rounded border bg-background px-1 font-mono text-[10px]">
                      Ctrl
                    </kbd>{" "}
                    +{" "}
                    <kbd className="rounded border bg-background px-1 font-mono text-[10px]">
                      Entrée
                    </kbd>
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
          </ConsolePanneau>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[calc(var(--console-entete)+1rem)] lg:self-start">
          <ConsolePanneau
            titre="Traitement"
            description="Les changements sont enregistrés aussitôt."
            icone={ShieldCheck}
            teinte={teinte}
            className="entree"
          >
            <div className="space-y-5">
              <ChoixSegmente<FeedbackStatus>
                libelle="Statut"
                valeurs={Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]}
                libelles={FEEDBACK_STATUS_LABELS}
                teintes={TEINTE_STATUT}
                valeur={feedback.statut}
                enCours={changerStatut.isPending}
                onChange={(statut) => changerStatut.mutate(statut)}
              />
              <ChoixSegmente<FeedbackPriority>
                libelle="Priorité"
                valeurs={Object.keys(FEEDBACK_PRIORITY_LABELS) as FeedbackPriority[]}
                libelles={FEEDBACK_PRIORITY_LABELS}
                teintes={TEINTE_PRIORITE}
                valeur={feedback.priorite}
                enCours={changerPriorite.isPending}
                onChange={(priorite) => changerPriorite.mutate(priorite)}
              />
            </div>
          </ConsolePanneau>

          <ConsolePanneau
            titre="Informations"
            icone={Info}
            teinte="var(--muted-foreground)"
            className="entree"
          >
            <ConsoleProprietes
              lignes={[
                {
                  libelle: "Auteur",
                  icone: UserRound,
                  valeur: (
                    <Link
                      href={`/admin/utilisateurs/${feedback.auteur.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {fullName(feedback.auteur)}
                    </Link>
                  ),
                },
                ...(feedback.auteur.email
                  ? [
                      {
                        libelle: "Email",
                        icone: Mail,
                        valeur: (
                          <a
                            href={`mailto:${feedback.auteur.email}`}
                            className="break-all hover:text-primary hover:underline"
                          >
                            {feedback.auteur.email}
                          </a>
                        ),
                      },
                    ]
                  : []),
                {
                  libelle: "Catégorie",
                  icone: Tag,
                  valeur: FEEDBACK_CATEGORY_LABELS[feedback.categorie],
                },
                {
                  libelle: "Ouvert",
                  icone: CalendarClock,
                  valeur: (
                    <span title={formatDateTime(feedback.createdAt)}>
                      {formatRelative(feedback.createdAt)}
                    </span>
                  ),
                },
                {
                  libelle: "Mis à jour",
                  icone: RefreshCw,
                  valeur: (
                    <span title={formatDateTime(feedback.updatedAt)}>
                      {formatRelative(feedback.updatedAt)}
                    </span>
                  ),
                },
                {
                  libelle: "Réponses",
                  icone: Flag,
                  valeur: <span className="tabular-nums">{nombreReponses}</span>,
                },
              ]}
            />
          </ConsolePanneau>
        </aside>
      </div>
    </>
  );
}
