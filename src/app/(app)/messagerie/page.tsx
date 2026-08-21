"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  MessageSquarePlus,
  MessagesSquare,
  MoreVertical,
  SendHorizontal,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import {
  EmojiPicker,
  insererAuCurseur,
} from "@/components/shared/emoji-picker";
import { CreerGroupe } from "@/components/messagerie/creer-groupe";
import { FilGroupe } from "@/components/messagerie/fil-groupe";
import {
  InvitationsGroupes,
  useInvitationsGroupes,
} from "@/components/messagerie/invitations-groupes";
import { errorMessage, fileUrl, groupesApi, messagingApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { formatRelative, formatTime, fullName } from "@/lib/format";
import { ROLE_BADGE, roleLabel } from "@/lib/enums";
import { cn } from "@/lib/utils";
import type { PrivateConversationSummary } from "@/lib/types";

/** Intervalle de rafraîchissement du fil actif. */
const THREAD_POLL_MS = 15_000;
const LIST_POLL_MS = 30_000;

/** Ce qui est ouvert à droite : une conversation à deux, ou un groupe. */
type Selection =
  | { genre: "prive"; id: number }
  | { genre: "groupe"; id: number }
  | null;

function initials(user: { firstName?: string | null; lastName?: string | null; username: string }) {
  return `${user.firstName?.[0] ?? user.username[0] ?? "?"}${user.lastName?.[0] ?? ""}`.toUpperCase();
}

function NewConversationDialog({
  onStarted,
}: {
  onStarted: (conversationId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["messaging", "contacts"],
    queryFn: messagingApi.contacts,
    enabled: open,
  });

  const start = useMutation({
    mutationFn: (userId: number) => messagingApi.start(userId),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ["messaging", "conversations"] });
      onStarted(conversation.id);
      setOpen(false);
    },
    onError: (error) =>
      toast.error("Impossible de démarrer la conversation", {
        description: errorMessage(error),
      }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <MessageSquarePlus className="size-4" />
            Nouvelle
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Choisissez un interlocuteur pour démarrer un échange.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid place-items-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun interlocuteur disponible.
          </p>
        ) : (
          <ScrollArea className="max-h-72">
            <ul className="space-y-1">
              {contacts.map((contact) => (
                <li key={contact.id}>
                  <button
                    onClick={() => start.mutate(contact.id)}
                    disabled={start.isPending}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={fileUrl(contact.pictureUrl)} alt="" />
                      <AvatarFallback className="text-[11px]">
                        {initials(contact)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {fullName(contact)}
                      </span>
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("h-5 shrink-0 px-1.5 text-[10px]", ROLE_BADGE[contact.role])}
                    >
                      {roleLabel(contact.role)}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Thread({
  conversation,
  onBack,
}: {
  conversation: PrivateConversationSummary;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  // Référence du champ : l'émoji s'insère à la position du curseur, pas en fin
  // de message — sans quoi il atterrit au mauvais endroit dès qu'on revient
  // corriger une phrase déjà écrite.
  const champMessage = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messaging", "messages", conversation.id],
    queryFn: () => messagingApi.messages(conversation.id),
    // L'ancienne messagerie n'avait aucun rafraîchissement : il fallait
    // recharger la page pour voir un nouveau message.
    refetchInterval: THREAD_POLL_MS,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: (content: string) => messagingApi.send(conversation.id, content),
    onSuccess: async () => {
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["messaging"] });
    },
    onError: (error) =>
      toast.error("Envoi impossible", { description: errorMessage(error) }),
  });

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
          aria-label="Retour aux conversations"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Avatar className="size-8">
          <AvatarImage src={fileUrl(conversation.otherUser.pictureUrl)} alt="" />
          <AvatarFallback className="text-[11px]">
            {initials(conversation.otherUser)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {fullName(conversation.otherUser)}
          </p>
          <p className="text-xs text-muted-foreground">
            {roleLabel(conversation.otherUser.role)}
          </p>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-4">
          {isLoading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun message. Écrivez le premier.
            </p>
          ) : (
            messages.map((message) => {
              const mine = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2.5 shadow-sm",
                      mine
                        ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-2xl rounded-bl-md border bg-card",
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[11px] tabular-nums",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) send.mutate(draft.trim());
        }}
        className="flex shrink-0 items-end gap-2 border-t p-3"
      >
        <EmojiPicker
          onChoisir={(symbole) =>
            setDraft((precedent) =>
              insererAuCurseur(champMessage.current, precedent, symbole),
            )
          }
          disabled={send.isPending}
        />

        <Textarea
          ref={champMessage}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (draft.trim()) send.mutate(draft.trim());
            }
          }}
          rows={1}
          placeholder="Votre message…"
          aria-label="Votre message"
          className="max-h-32 min-h-9 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!draft.trim() || send.isPending}
          aria-label="Envoyer"
        >
          {send.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

function Messagerie() {
  // Les notifications pointent vers « /messagerie?groupe=12 » : sans lecture de
  // ce paramètre, le lien ramènerait sur la liste sans ouvrir la discussion
  // annoncée.
  const parametres = useSearchParams();
  const groupeDemande = parametres.get("groupe");
  const conversationDemandee = parametres.get("conversation");

  const [selection, setSelection] = useState<Selection>(() => {
    if (groupeDemande) return { genre: "groupe", id: Number(groupeDemande) };
    if (conversationDemandee)
      return { genre: "prive", id: Number(conversationDemandee) };
    return null;
  });
  const [aSupprimer, setASupprimer] =
    useState<PrivateConversationSummary | null>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["messaging", "conversations"],
    queryFn: messagingApi.conversations,
    refetchInterval: LIST_POLL_MS,
  });

  const { data: groupes = [], isLoading: groupesEnCours } = useQuery({
    queryKey: ["groupes", "liste"],
    queryFn: groupesApi.liste,
    refetchInterval: LIST_POLL_MS,
  });

  const { data: invitations = [] } = useInvitationsGroupes();

  const supprimerConversation = useMutation({
    mutationFn: (conversationId: number) =>
      messagingApi.supprimerConversation(conversationId),
    onSuccess: async (reponse, conversationId) => {
      await queryClient.invalidateQueries({ queryKey: ["messaging"] });
      setASupprimer(null);
      if (selection?.genre === "prive" && selection.id === conversationId) {
        setSelection(null);
      }
      toast.success(reponse.message);
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  const conversationActive = useMemo(
    () =>
      selection?.genre === "prive"
        ? (conversations.find((c) => c.id === selection.id) ?? null)
        : null,
    [conversations, selection],
  );

  const groupeActif = useMemo(
    () =>
      selection?.genre === "groupe"
        ? (groupes.find((g) => g.id === selection.id) ?? null)
        : null,
    [groupes, selection],
  );

  const ouvert = conversationActive ?? groupeActif;
  const rienDuTout =
    conversations.length === 0 && groupes.length === 0 && invitations.length === 0;

  return (
    <div className="ecran-plein flex">
      {/* Liste : plein écran sur mobile tant qu'aucun fil n'est ouvert */}
      <aside
        className={cn(
          "w-full shrink-0 flex-col border-r md:flex md:w-72",
          ouvert ? "hidden md:flex" : "flex",
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3">
          <h1 className="text-base font-bold">Messagerie</h1>
          <div className="flex items-center gap-1.5">
            <CreerGroupe
              onCree={(id) => setSelection({ genre: "groupe", id })}
            />
            <NewConversationDialog
              onStarted={(id) => setSelection({ genre: "prive", id })}
            />
          </div>
        </header>

        <InvitationsGroupes
          onRejoint={(id) => setSelection({ genre: "groupe", id })}
        />

        <ScrollArea className="min-h-0 flex-1">
          {isLoading || groupesEnCours ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : rienDuTout ? (
            <div className="p-4">
              <EmptyState
                icon={MessagesSquare}
                couleur="var(--chart-3)"
                title="Aucune conversation"
                description="Écrivez à l'équipe ou à une structure, ou créez un groupe : tout arrive ici."
              />
            </div>
          ) : (
            <>
              {groupes.length > 0 ? (
                <>
                  <p className="px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Groupes
                  </p>
                  <ul className="p-2 pt-1">
                    {groupes.map((groupe) => (
                      <li key={`groupe-${groupe.id}`}>
                        <button
                          onClick={() =>
                            setSelection({ genre: "groupe", id: groupe.id })
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all duration-200",
                            selection?.genre === "groupe" &&
                              selection.id === groupe.id
                              ? "bg-accent"
                              : "hover:bg-accent/60",
                          )}
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10">
                            <UsersRound
                              className="size-4 text-primary"
                              aria-hidden
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-sm font-semibold">
                                {groupe.nom}
                              </span>
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {formatRelative(
                                  groupe.dernierMessage?.createdAt ??
                                    groupe.updatedAt,
                                )}
                              </span>
                            </span>
                            <span className="mt-0.5 flex items-center gap-2">
                              <span className="truncate text-xs text-muted-foreground">
                                {groupe.dernierMessage
                                  ? `${
                                      groupe.dernierMessage.auteur
                                        ? fullName(groupe.dernierMessage.auteur)
                                        : "Compte supprimé"
                                    } : ${groupe.dernierMessage.contenu}`
                                  : `${groupe.nombreMembres} membre${
                                      groupe.nombreMembres > 1 ? "s" : ""
                                    }`}
                              </span>
                              {groupe.nonLus > 0 ? (
                                <span className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/40">
                                  {groupe.nonLus}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {conversations.length > 0 ? (
                <>
                  {groupes.length > 0 ? (
                    <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Discussions
                    </p>
                  ) : null}
                  <ul className="p-2 pt-1">
                    {conversations.map((conversation) => (
                      <li key={conversation.id}>
                        {/* Bouton et menu côte à côte plutôt qu'imbriqués :
                            un bouton dans un bouton n'est pas du HTML valide
                            et casse la navigation au clavier. */}
                        <div
                          className={cn(
                            "group flex items-center rounded-xl transition-all duration-200",
                            selection?.genre === "prive" &&
                              selection.id === conversation.id
                              ? "bg-accent"
                              : "hover:bg-accent/60",
                          )}
                        >
                          <button
                            onClick={() =>
                              setSelection({
                                genre: "prive",
                                id: conversation.id,
                              })
                            }
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2.5 text-left"
                          >
                            <Avatar className="size-9 shrink-0">
                              <AvatarImage
                                src={fileUrl(conversation.otherUser.pictureUrl)}
                                alt=""
                              />
                              <AvatarFallback className="text-[11px]">
                                {initials(conversation.otherUser)}
                              </AvatarFallback>
                            </Avatar>

                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-sm font-semibold">
                                  {fullName(conversation.otherUser)}
                                </span>
                                <span className="shrink-0 text-[11px] text-muted-foreground">
                                  {formatRelative(conversation.updatedAt)}
                                </span>
                              </span>
                              <span className="mt-0.5 flex items-center gap-2">
                                <span className="truncate text-xs text-muted-foreground">
                                  {conversation.lastMessage?.content ??
                                    "Aucun message"}
                                </span>
                                {conversation.unreadCount > 0 ? (
                                  <span className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/40">
                                    {conversation.unreadCount}
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </button>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="mr-1 size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 md:opacity-0"
                                  aria-label={`Options de la conversation avec ${fullName(conversation.otherUser)}`}
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setASupprimer(conversation)}
                              >
                                <Trash2 className="size-4" />
                                Supprimer la discussion
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}
        </ScrollArea>
      </aside>

      <div className={cn("min-w-0 flex-1", ouvert ? "flex" : "hidden md:flex")}>
        {conversationActive ? (
          <div className="w-full">
            <Thread
              conversation={conversationActive}
              onBack={() => setSelection(null)}
            />
          </div>
        ) : groupeActif ? (
          <div className="w-full">
            <FilGroupe
              groupe={groupeActif}
              onRetour={() => setSelection(null)}
              onQuitte={() => setSelection(null)}
            />
          </div>
        ) : (
          <div className="grid w-full place-items-center p-6">
            <div className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10">
                <MessagesSquare className="size-7 text-primary" aria-hidden />
              </span>
              <p className="mt-4 text-lg font-bold">Vos échanges</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                Choisissez une conversation à gauche, ou démarrez-en une nouvelle.
              </p>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={aSupprimer !== null}
        onOpenChange={(valeur) => !valeur && setASupprimer(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette discussion ?</DialogTitle>
            <DialogDescription>
              Elle disparaîtra de votre liste, avec les messages échangés
              jusqu&apos;ici.{" "}
              {aSupprimer ? fullName(aSupprimer.otherUser) : "Votre interlocuteur"}{" "}
              conservera sa copie. Si un nouveau message arrive, la discussion
              réapparaîtra — sans l&apos;historique précédent.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setASupprimer(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={supprimerConversation.isPending}
              onClick={() =>
                aSupprimer && supprimerConversation.mutate(aSupprimer.id)
              }
            >
              {supprimerConversation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * `useSearchParams` impose une frontière de suspense : sans elle, le rendu
 * statique de la route échoue à la compilation.
 */
export default function MessageriePage() {
  return (
    <Suspense
      fallback={
        <div className="ecran-plein grid place-items-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <Messagerie />
    </Suspense>
  );
}
