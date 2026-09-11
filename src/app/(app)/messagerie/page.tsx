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
  Search,
  SendHorizontal,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useDebounced } from "@/hooks/use-debounced";
import { formatRelative, formatTime, fullName } from "@/lib/format";
import { ROLE_BADGE, roleLabel } from "@/lib/enums";
import { cn } from "@/lib/utils";
import type {
  PrivateConversationSummary,
  ResultatsRechercheMessagerie,
} from "@/lib/types";

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
  const [saisie, setSaisie] = useState("");
  const requete = useDebounced(saisie.trim());
  const queryClient = useQueryClient();

  // La recherche part au serveur : pour l'administration, les interlocuteurs
  // possibles dépassent sept cents comptes, et la liste d'un bloc sans champ
  // de recherche rendait la plupart d'entre eux introuvables.
  const {
    data: contacts = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["messaging", "contacts", requete],
    queryFn: () =>
      messagingApi.contacts(requete.length >= 2 ? requete : undefined),
    enabled: open,
    placeholderData: (precedent) => precedent,
  });

  const start = useMutation({
    mutationFn: (userId: number) => messagingApi.start(userId),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ["messaging", "conversations"] });
      onStarted(conversation.id);
      setOpen(false);
      setSaisie("");
    },
    onError: (error) =>
      toast.error("Impossible de démarrer la conversation", {
        description: errorMessage(error),
      }),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(valeur) => {
        setOpen(valeur);
        if (!valeur) setSaisie("");
      }}
    >
      {/* Icône seule, comme le bouton de groupe : libellés, les deux boutons
          débordaient de la colonne de 288 px. */}
      <DialogTrigger
        render={
          <Button
            size="icon"
            variant="outline"
            className="size-8 rounded-lg"
            aria-label="Nouvelle conversation"
            title="Nouvelle conversation"
          >
            <MessageSquarePlus className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Cherchez la personne à qui vous voulez écrire.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="Nom, prénom…"
            aria-label="Rechercher une personne"
            className="pl-9 pr-9"
          />
          {isFetching && !isLoading ? (
            <Loader2
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {requete.length >= 2
              ? `Personne ne correspond à « ${requete} ».`
              : "Aucun interlocuteur disponible."}
          </p>
        ) : (
          <>
            <ScrollArea className="max-h-72">
              <ul className="space-y-1">
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <button
                      onClick={() => start.mutate(contact.id)}
                      disabled={start.isPending}
                      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent"
                    >
                      <Avatar className="size-8 shrink-0">
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
            {requete.length < 2 && contacts.length >= 50 ? (
              <p className="text-center text-xs text-muted-foreground">
                Les cinquante premiers seulement : tapez un nom pour trouver
                les autres.
              </p>
            ) : null}
          </>
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

/** Extrait centré sur la première occurrence, le terme mis en évidence. */
function Extrait({ texte, requete }: { texte: string; requete: string }) {
  const position = texte.toLowerCase().indexOf(requete.toLowerCase());
  if (position < 0) {
    return <>{texte.length > 110 ? `${texte.slice(0, 110)}…` : texte}</>;
  }
  // Une fenêtre autour du terme plutôt que le début du message : dans un long
  // message, l'occurrence cherchée serait sinon coupée par les points de
  // suspension.
  const debut = Math.max(0, position - 36);
  const fin = Math.min(texte.length, position + requete.length + 70);
  return (
    <>
      {debut > 0 ? "…" : ""}
      {texte.slice(debut, position)}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">
        {texte.slice(position, position + requete.length)}
      </mark>
      {texte.slice(position + requete.length, fin)}
      {fin < texte.length ? "…" : ""}
    </>
  );
}

function TitreSection({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * Résultats de la recherche, par nature : discussions, groupes, messages,
 * puis personnes à qui écrire pour la première fois.
 */
function ResultatsRecherche({
  requete,
  resultats,
  chargement,
  selection,
  onOuvrir,
  onDemarrer,
  demarrageEnCours,
}: {
  requete: string;
  resultats: ResultatsRechercheMessagerie | undefined;
  chargement: boolean;
  selection: Selection;
  onOuvrir: (selection: Selection) => void;
  onDemarrer: (userId: number) => void;
  demarrageEnCours: boolean;
}) {
  if (chargement || !resultats) {
    return (
      <div className="grid place-items-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { discussions, groupes, messages, messagesGroupe, personnes } = resultats;

  // Une personne avec qui une discussion existe déjà figure sous
  // « Discussions » : la reproposer sous « Démarrer » ferait croire à deux
  // fils distincts avec elle.
  const dejaEnDiscussion = new Set(discussions.map((d) => d.otherUser.id));
  const nouvelles = personnes.filter((personne) => !dejaEnDiscussion.has(personne.id));

  const total =
    discussions.length +
    groupes.length +
    messages.length +
    messagesGroupe.length +
    nouvelles.length;

  if (total === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Rien ne correspond à « {requete} ».
      </p>
    );
  }

  const actif = (genre: "prive" | "groupe", id: number) =>
    selection?.genre === genre && selection.id === id;
  const ligne =
    "flex w-full gap-3 rounded-xl p-2.5 text-left transition-colors";

  return (
    <div className="pb-2">
      {discussions.length > 0 ? (
        <>
          <TitreSection>Discussions</TitreSection>
          <ul className="p-2 pt-1">
            {discussions.map((discussion) => (
              <li key={`d-${discussion.id}`}>
                <button
                  onClick={() => onOuvrir({ genre: "prive", id: discussion.id })}
                  className={cn(
                    ligne,
                    "items-center",
                    actif("prive", discussion.id) ? "bg-accent" : "hover:bg-accent/60",
                  )}
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={fileUrl(discussion.otherUser.pictureUrl)} alt="" />
                    <AvatarFallback className="text-[11px]">
                      {initials(discussion.otherUser)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {fullName(discussion.otherUser)}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {discussion.lastMessage?.content ?? "Aucun message"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {groupes.length > 0 ? (
        <>
          <TitreSection>Groupes</TitreSection>
          <ul className="p-2 pt-1">
            {groupes.map((groupe) => (
              <li key={`g-${groupe.id}`}>
                <button
                  onClick={() => onOuvrir({ genre: "groupe", id: groupe.id })}
                  className={cn(
                    ligne,
                    "items-center",
                    actif("groupe", groupe.id) ? "bg-accent" : "hover:bg-accent/60",
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10">
                    <UsersRound className="size-4 text-primary" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {groupe.nom}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {messages.length > 0 ? (
        <>
          <TitreSection>Messages</TitreSection>
          <ul className="p-2 pt-1">
            {messages.map((message) => (
              <li key={`m-${message.id}`}>
                <button
                  onClick={() =>
                    onOuvrir({ genre: "prive", id: message.conversationId })
                  }
                  className={cn(
                    ligne,
                    "items-start",
                    actif("prive", message.conversationId)
                      ? "bg-accent"
                      : "hover:bg-accent/60",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {message.otherUser ? fullName(message.otherUser) : "Discussion"}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRelative(message.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                      <span className="font-medium text-foreground/80">
                        {fullName(message.sender)} :{" "}
                      </span>
                      <Extrait texte={message.content} requete={requete} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {messagesGroupe.length > 0 ? (
        <>
          <TitreSection>Messages de groupe</TitreSection>
          <ul className="p-2 pt-1">
            {messagesGroupe.map((message) => (
              <li key={`mg-${message.id}`}>
                <button
                  onClick={() => onOuvrir({ genre: "groupe", id: message.groupeId })}
                  className={cn(
                    ligne,
                    "items-start",
                    actif("groupe", message.groupeId)
                      ? "bg-accent"
                      : "hover:bg-accent/60",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {message.groupe.nom}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRelative(message.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                      <span className="font-medium text-foreground/80">
                        {message.auteur ? fullName(message.auteur) : "Compte supprimé"} :{" "}
                      </span>
                      <Extrait texte={message.contenu} requete={requete} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {nouvelles.length > 0 ? (
        <>
          <TitreSection>Démarrer une conversation</TitreSection>
          <ul className="p-2 pt-1">
            {nouvelles.map((personne) => (
              <li key={`p-${personne.id}`}>
                <button
                  onClick={() => onDemarrer(personne.id)}
                  disabled={demarrageEnCours}
                  className={cn(ligne, "items-center hover:bg-accent/60")}
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={fileUrl(personne.pictureUrl)} alt="" />
                    <AvatarFallback className="text-[11px]">
                      {initials(personne)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {fullName(personne)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("h-5 shrink-0 px-1.5 text-[10px]", ROLE_BADGE[personne.role])}
                  >
                    {roleLabel(personne.role)}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
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

  // Recherche dans la messagerie. Deux caractères au moins : en deçà, tout
  // correspondrait, et la réponse ne dirait rien.
  const [recherche, setRecherche] = useState("");
  const requete = useDebounced(recherche.trim());
  const enRecherche = requete.length >= 2;

  const { data: resultats, isFetching: rechercheEnCours } = useQuery({
    queryKey: ["messaging", "recherche", requete],
    queryFn: () => messagingApi.rechercher(requete),
    enabled: enRecherche,
    placeholderData: (precedent) => precedent,
  });

  const demarrer = useMutation({
    mutationFn: (userId: number) => messagingApi.start(userId),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ["messaging", "conversations"] });
      setSelection({ genre: "prive", id: conversation.id });
    },
    onError: (error) =>
      toast.error("Impossible de démarrer la conversation", {
        description: errorMessage(error),
      }),
  });

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
          <div className="flex shrink-0 items-center gap-1.5">
            <CreerGroupe
              onCree={(id) => setSelection({ genre: "groupe", id })}
            />
            <NewConversationDialog
              onStarted={(id) => setSelection({ genre: "prive", id })}
            />
          </div>
        </header>

        <div className="relative shrink-0 border-b px-3 py-2">
          <Search
            className="pointer-events-none absolute left-5.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Personne, groupe, message…"
            aria-label="Rechercher dans la messagerie"
            className="h-9 rounded-lg pl-8 pr-8"
          />
          {recherche ? (
            <button
              onClick={() => setRecherche("")}
              aria-label="Effacer la recherche"
              className="absolute right-5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <InvitationsGroupes
          onRejoint={(id) => setSelection({ genre: "groupe", id })}
        />

        <ScrollArea className="min-h-0 flex-1">
          {enRecherche ? (
            <ResultatsRecherche
              requete={requete}
              resultats={resultats}
              chargement={rechercheEnCours && !resultats}
              selection={selection}
              onOuvrir={setSelection}
              onDemarrer={(userId) => demarrer.mutate(userId)}
              demarrageEnCours={demarrer.isPending}
            />
          ) : isLoading || groupesEnCours ? (
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
