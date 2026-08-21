"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Info,
  Loader2,
  SendHorizontal,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  EmojiPicker,
  insererAuCurseur,
} from "@/components/shared/emoji-picker";
import { PanneauGroupe } from "./panneau-groupe";
import { initialesDe } from "./selecteur-personnes";
import { errorMessage, fileUrl, groupesApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { formatTime, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GroupeResume } from "@/lib/types";

const POLL_MS = 15_000;

/** Fil d'un groupe : messages, envoi, accès au panneau des membres. */
export function FilGroupe({
  groupe,
  onRetour,
  onQuitte,
}: {
  groupe: GroupeResume;
  onRetour: () => void;
  onQuitte: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [brouillon, setBrouillon] = useState("");
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const basRef = useRef<HTMLDivElement>(null);
  const champMessage = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["groupes", "messages", groupe.id],
    queryFn: () => groupesApi.messages(groupe.id),
    refetchInterval: POLL_MS,
  });

  useEffect(() => {
    basRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const envoyer = useMutation({
    mutationFn: (contenu: string) => groupesApi.envoyer(groupe.id, contenu),
    onSuccess: async () => {
      setBrouillon("");
      await queryClient.invalidateQueries({ queryKey: ["groupes"] });
    },
    onError: (error) =>
      toast.error("Envoi impossible", { description: errorMessage(error) }),
  });

  const supprimerMessage = useMutation({
    mutationFn: (messageId: number) =>
      groupesApi.supprimerMessage(groupe.id, messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groupes"] });
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  const soumettre = () => {
    const contenu = brouillon.trim();
    if (contenu) envoyer.mutate(contenu);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onRetour}
          aria-label="Retour aux discussions"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10">
          <UsersRound className="size-4 text-primary" aria-hidden />
        </span>

        <button
          onClick={() => setPanneauOuvert(true)}
          className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left transition-colors hover:bg-accent"
        >
          <span className="block truncate text-sm font-medium">{groupe.nom}</span>
          <span className="block text-xs text-muted-foreground">
            {groupe.nombreMembres} membre{groupe.nombreMembres > 1 ? "s" : ""}
          </span>
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPanneauOuvert(true)}
          aria-label="Informations du groupe"
        >
          <Info className="size-4" />
        </Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-4">
          {isLoading ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun message dans ce groupe. Lancez la discussion.
            </p>
          ) : (
            messages.map((message, rang) => {
              const mien = message.auteurId === user?.id;
              // L'auteur n'est réaffiché que lorsqu'il change : dans un groupe,
              // répéter le nom à chaque ligne hache la lecture.
              const memeAuteur =
                rang > 0 && messages[rang - 1].auteurId === message.auteurId;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "group flex items-end gap-2",
                    mien ? "justify-end" : "justify-start",
                  )}
                >
                  {!mien ? (
                    <Avatar
                      className={cn("size-7 shrink-0", memeAuteur && "invisible")}
                    >
                      <AvatarImage
                        src={fileUrl(message.auteur?.pictureUrl)}
                        alt=""
                      />
                      <AvatarFallback className="text-[10px]">
                        {message.auteur ? initialesDe(message.auteur) : "?"}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}

                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2.5 shadow-sm",
                      mien
                        ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-2xl rounded-bl-md border bg-card",
                    )}
                  >
                    {!mien && !memeAuteur ? (
                      <p className="mb-0.5 text-[11px] font-semibold text-primary">
                        {message.auteur
                          ? fullName(message.auteur)
                          : "Compte supprimé"}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.contenu}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[11px] tabular-nums",
                        mien
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>

                  {mien || groupe.role === "ADMIN" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      onClick={() => supprimerMessage.mutate(message.id)}
                      aria-label="Supprimer ce message"
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  ) : null}
                </div>
              );
            })
          )}
          <div ref={basRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          soumettre();
        }}
        className="flex shrink-0 items-end gap-2 border-t p-3"
      >
        <EmojiPicker
          onChoisir={(symbole) =>
            setBrouillon((precedent) =>
              insererAuCurseur(champMessage.current, precedent, symbole),
            )
          }
          disabled={envoyer.isPending}
        />

        <Textarea
          ref={champMessage}
          value={brouillon}
          onChange={(e) => setBrouillon(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              soumettre();
            }
          }}
          rows={1}
          placeholder={`Message à ${groupe.nom}…`}
          aria-label="Votre message"
          className="max-h-32 min-h-9 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!brouillon.trim() || envoyer.isPending}
          aria-label="Envoyer"
        >
          {envoyer.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </form>

      <PanneauGroupe
        groupeId={groupe.id}
        ouvert={panneauOuvert}
        onOuvert={setPanneauOuvert}
        onQuitte={onQuitte}
      />
    </div>
  );
}
