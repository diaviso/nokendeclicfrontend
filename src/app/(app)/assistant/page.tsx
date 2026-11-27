"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  Bot,
  Loader2,
  MessageSquarePlus,
  PanelLeft,
  SendHorizontal,
  Sparkles,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  LIBELLES_OUTILS,
  chatbotApi,
  envoyerEnFlux,
  errorMessage,
} from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

/** Teinte de la rubrique « Assistant IA », la même que dans le menu. */
const TEINTE = "var(--c-violet)";
const LAVIS = "color-mix(in oklch, var(--c-violet) 14%, transparent)";
const DEGRADE =
  "linear-gradient(135deg, var(--c-violet), color-mix(in oklch, var(--c-violet) 65%, black))";

function Markdown({ children }: { children: string }) {
  return (
    <div
      className={cn(
        "text-sm leading-relaxed",
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-0.5",
        "[&_strong]:font-semibold",
        "[&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold",
        "[&_h2]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold",
        "[&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-medium",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px]",
        "[&_a]:text-[var(--c-violet)] [&_a]:underline [&_a]:underline-offset-2",
        "[&_table]:my-2 [&_table]:w-full [&_table]:text-left",
        "[&_th]:border-b [&_th]:py-1 [&_th]:font-medium [&_td]:py-1",
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

function ConversationList({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ["chatbot", "conversations"],
    queryFn: chatbotApi.conversations,
  });

  const remove = useMutation({
    mutationFn: (id: string) => chatbotApi.removeConversation(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ["chatbot", "conversations"] });
      if (id === activeId) onSelect(null);
      toast.success("Conversation supprimée");
    },
  });

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          className="w-full rounded-xl text-white shadow-md transition-transform hover:-translate-y-0.5"
          size="sm"
          onClick={() => onSelect(null)}
          style={{
            background: DEGRADE,
            boxShadow: "0 8px 18px -8px color-mix(in oklch, var(--c-violet) 80%, transparent)",
          }}
        >
          <MessageSquarePlus className="size-4" />
          Nouvelle conversation
        </Button>
      </div>
      <p className="px-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
        Historique
      </p>

      <ScrollArea className="flex-1">
        <ul className="space-y-0.5 px-2 pb-3">
          {conversations.length === 0 ? (
            <li className="mx-1 mt-2 rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              Vos échanges apparaîtront ici.
            </li>
          ) : (
            conversations.map((conversation) => (
              <li key={conversation.id} className="group relative">
                <button
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    "relative w-full rounded-xl px-3 py-2 pr-8 text-left transition-all duration-200",
                    activeId === conversation.id
                      ? "bg-card font-semibold shadow-sm ring-1 ring-border"
                      : "hover:bg-card/70",
                  )}
                >
                  {activeId === conversation.id ? (
                    <span
                      aria-hidden
                      className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
                      style={{ background: TEINTE }}
                    />
                  ) : null}
                  <span className="block truncate text-sm">
                    {conversation.title || "Sans titre"}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {formatRelative(conversation.updatedAt)}
                  </span>
                </button>
                <button
                  onClick={() => remove.mutate(conversation.id)}
                  aria-label="Supprimer la conversation"
                  className="absolute right-1.5 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}

export default function AssistantPage() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const localIdRef = useRef(0);

  const { data: conversation, isFetching } = useQuery({
    queryKey: ["chatbot", "conversation", conversationId],
    queryFn: () => chatbotApi.conversation(conversationId as string),
    enabled: Boolean(conversationId),
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["chatbot", "suggestions"],
    queryFn: chatbotApi.suggestions,
  });

  // Messages persistés + messages en attente (affichés avant la réponse).
  const messages: ChatMessage[] = [...(conversation?.messages ?? []), ...pending];

  // Réponse en cours de réception. Elle vit dans l'état plutôt que dans le
  // cache : elle change à chaque fragment, et n'a rien à y faire tant qu'elle
  // n'est pas terminée — c'est le serveur qui l'enregistre.
  const [enCours, setEnCours] = useState(false);
  const [reponseEnCours, setReponseEnCours] = useState("");
  const [outilEnCours, setOutilEnCours] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, reponseEnCours]);

  async function envoyer(message: string) {
    setEnCours(true);
    setReponseEnCours("");
    setOutilEnCours(null);

    try {
      const identifiant = await envoyerEnFlux(
        message,
        conversationId ?? undefined,
        {
          surDebut: (id) => setConversationId(id),
          surMorceau: (texte) => {
            // Le fragment est ajouté à l'existant : chaque événement ne porte
            // que ce qui vient d'être produit, jamais la réponse entière.
            setReponseEnCours((precedent) => precedent + texte);
            setOutilEnCours(null);
          },
          surOutil: (nom) => setOutilEnCours(nom),
          surErreur: (texte) =>
            toast.error("Réponse interrompue", { description: texte }),
        },
      );

      if (identifiant) setConversationId(identifiant);
      // La conversation est relue une fois terminée : l'échange complet vient
      // alors du serveur, et l'affichage provisoire s'efface sans clignoter.
      await queryClient.invalidateQueries({ queryKey: ["chatbot"] });
    } catch (error) {
      toast.error("Réponse impossible", { description: errorMessage(error) });
    } finally {
      setEnCours(false);
      setReponseEnCours("");
      setOutilEnCours(null);
      setPending([]);
    }
  }

  function submit(text: string) {
    const message = text.trim();
    if (!message || enCours) return;
    // Affichage immédiat du message utilisateur : sans cela, l'interface reste
    // figée pendant les quelques secondes d'appel au modèle.
    //
    // L'identifiant vient d'un compteur, pas de Date.now() : une horloge lue
    // dans le corps du composant est une impureté, et seule l'unicité de la
    // clé React compte ici. L'horodatage n'est pas affiché pour les messages
    // de l'utilisateur.
    localIdRef.current += 1;
    setPending([
      {
        id: `local-${localIdRef.current}`,
        role: "user",
        content: message,
        timestamp: "",
      },
    ]);
    setDraft("");
    void envoyer(message);
  }

  const empty = messages.length === 0;

  return (
    <div className="ecran-plein flex bg-background">
      {/* Liste des conversations — colonne fixe à partir de md */}
      <aside className="hidden w-64 shrink-0 border-r bg-muted/40 md:block">
        <ConversationList activeId={conversationId} onSelect={setConversationId} />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="relative flex h-14 shrink-0 items-center gap-2 overflow-hidden border-b px-3 sm:px-4">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: `linear-gradient(100deg, ${LAVIS}, transparent 55%)` }}
          />
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Conversations">
                  <PanelLeft className="size-4" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Conversations</SheetTitle>
              <ConversationList
                activeId={conversationId}
                onSelect={(id) => {
                  setConversationId(id);
                  setSheetOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>

          <div className="relative flex min-w-0 items-center gap-2.5">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-xl text-white shadow-sm"
              style={{ background: DEGRADE }}
            >
              <Bot className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 leading-tight">
              <h1 className="truncate text-sm font-bold">
                {conversation?.title || "Assistant carrière"}
              </h1>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--c-emerald)] opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[var(--c-emerald)]" />
                </span>
                {enCours ? "Rédige une réponse…" : "Connaît votre profil et le catalogue"}
              </span>
            </span>
          </div>

          {isFetching ? (
            <Loader2 className="relative ml-auto size-4 animate-spin text-muted-foreground" />
          ) : null}
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {empty ? (
              <div className="entree py-8 text-center">
                <span className="relative mx-auto grid size-20 place-items-center">
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{ background: LAVIS }}
                  />
                  <span
                    aria-hidden
                    className="anim-pulse-ring absolute inset-0 rounded-full border-2"
                    style={{ borderColor: "color-mix(in oklch, var(--c-violet) 45%, transparent)" }}
                  />
                  <span
                    className="relative grid size-12 place-items-center rounded-2xl text-white"
                    style={{
                      background: DEGRADE,
                      boxShadow: "0 12px 26px -10px color-mix(in oklch, var(--c-violet) 80%, transparent)",
                    }}
                  >
                    <Bot className="size-6" aria-hidden />
                  </span>
                </span>
                <p
                  className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: TEINTE }}
                >
                  Assistant carrière
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                  Comment puis-je vous aider&nbsp;?
                </h2>
                <p className="mx-auto mt-2 max-w-md text-base text-muted-foreground">
                  L&apos;assistant connaît votre profil, votre CV et le catalogue
                  d&apos;offres. Posez-lui une question précise.
                </p>

                {suggestions.length > 0 ? (
                  <ul className="mx-auto mt-6 grid max-w-xl gap-2 sm:grid-cols-2">
                    {suggestions.slice(0, 6).map((suggestion, index) => (
                      <li
                        key={suggestion}
                        className="entree"
                        style={{ animationDelay: `${80 + index * 60}ms` }}
                      >
                        <button
                          onClick={() => submit(suggestion)}
                          className="group flex h-full w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--c-violet)_40%,transparent)] hover:shadow-md"
                        >
                          <span
                            className="grid size-8 shrink-0 place-items-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                            style={{ background: LAVIS, color: TEINTE }}
                          >
                            <Sparkles className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">{suggestion}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <ul className="space-y-5">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={cn(
                      "entree flex gap-3",
                      message.role === "user" && "flex-row-reverse",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-xl",
                        message.role === "user" ? "border bg-muted" : "text-white shadow-sm",
                      )}
                      style={message.role === "user" ? undefined : { background: DEGRADE }}
                    >
                      {message.role === "user" ? (
                        <UserIcon className="size-3.5 text-muted-foreground" />
                      ) : (
                        <Bot className="size-3.5" />
                      )}
                    </span>

                    <div
                      className={cn(
                        "min-w-0 max-w-[85%] px-4 py-3 shadow-sm",
                        message.role === "user"
                          ? "rounded-2xl rounded-br-md text-white"
                          : "rounded-2xl rounded-bl-md border bg-card",
                      )}
                      style={message.role === "user" ? { background: DEGRADE } : undefined}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                      ) : (
                        <Markdown>{message.content}</Markdown>
                      )}
                    </div>
                  </li>
                ))}

                {enCours ? (
                  <li className="flex gap-3">
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                      style={{ background: DEGRADE }}
                    >
                      <Bot className="size-3.5" aria-hidden />
                    </span>

                    {reponseEnCours ? (
                      /* La réponse s'écrit dans sa bulle définitive : quand le
                         serveur a fini, le texte est déjà à sa place et seul
                         l'accent de rédaction disparaît. */
                      <div className="max-w-[85%] rounded-2xl rounded-bl-md border bg-card px-4 py-3 shadow-sm">
                        <Markdown>{reponseEnCours}</Markdown>
                        <span
                          aria-hidden
                          className="ml-0.5 inline-block h-4 w-[2px] animate-pulse rounded-full bg-[var(--c-violet)] align-text-bottom"
                        />
                        <span className="sr-only" aria-live="polite">
                          L&apos;assistant rédige sa réponse.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border bg-card px-4 py-3.5 shadow-sm">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="size-1.5 animate-bounce rounded-full bg-[var(--c-violet)] opacity-70"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground">
                          {outilEnCours
                            ? (LIBELLES_OUTILS[outilEnCours] ??
                              "Je consulte le catalogue…")
                            : "L'assistant réfléchit…"}
                        </span>
                      </div>
                    )}
                  </li>
                ) : null}
              </ul>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent px-3 pb-3 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-[color-mix(in_oklch,var(--c-violet)_35%,transparent)]"
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Entrée envoie, Maj+Entrée insère un saut de ligne.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(draft);
                }
              }}
              rows={1}
              placeholder="Posez votre question…"
              aria-label="Votre message"
              className="max-h-40 min-h-9 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || enCours}
              aria-label="Envoyer"
              className="shrink-0 rounded-xl text-white transition-transform hover:scale-105"
              style={{ background: DEGRADE }}
            >
              {enCours ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SendHorizontal className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
