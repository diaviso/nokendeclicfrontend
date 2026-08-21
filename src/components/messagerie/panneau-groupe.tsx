"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Crown,
  DoorOpen,
  Loader2,
  MailPlus,
  MoreVertical,
  Pencil,
  ShieldMinus,
  Trash2,
  UserMinus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SelecteurPersonnes, initialesDe } from "./selecteur-personnes";
import { errorMessage, fileUrl, groupesApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { fullName } from "@/lib/format";
import type { GroupeDetail } from "@/lib/types";

/* --------------------------------------------------------------- inviter -- */

function DialogueInviter({
  groupeId,
  ouvert,
  onOuvert,
}: {
  groupeId: number;
  ouvert: boolean;
  onOuvert: (valeur: boolean) => void;
}) {
  const [selection, setSelection] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: invitables = [], isLoading } = useQuery({
    queryKey: ["groupes", "invitables", groupeId],
    queryFn: () => groupesApi.invitables(groupeId),
    enabled: ouvert,
  });

  const inviter = useMutation({
    mutationFn: () => groupesApi.inviter(groupeId, selection),
    onSuccess: async (reponse) => {
      await queryClient.invalidateQueries({ queryKey: ["groupes"] });
      toast.success(reponse.message);
      setSelection([]);
      onOuvert(false);
    },
    onError: (error) =>
      toast.error("Invitation impossible", { description: errorMessage(error) }),
  });

  return (
    <Dialog open={ouvert} onOpenChange={onOuvert}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inviter au groupe</DialogTitle>
          <DialogDescription>
            Chaque personne recevra une invitation qu&apos;elle est libre
            d&apos;accepter ou de refuser.
          </DialogDescription>
        </DialogHeader>

        <SelecteurPersonnes
          personnes={invitables}
          selection={selection}
          onChange={setSelection}
          chargement={isLoading}
          videMessage="Tout le monde est déjà membre ou déjà invité."
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOuvert(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => inviter.mutate()}
            disabled={selection.length === 0 || inviter.isPending}
          >
            {inviter.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Envoyer {selection.length > 0 ? `(${selection.length})` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------- renommer -- */

function DialogueRenommer({
  groupe,
  ouvert,
  onOuvert,
}: {
  groupe: GroupeDetail;
  ouvert: boolean;
  onOuvert: (valeur: boolean) => void;
}) {
  const [nom, setNom] = useState(groupe.nom);
  const [description, setDescription] = useState(groupe.description ?? "");
  const queryClient = useQueryClient();

  const enregistrer = useMutation({
    mutationFn: () =>
      groupesApi.modifier(groupe.id, {
        nom: nom.trim(),
        description: description.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["groupes"] });
      toast.success("Groupe mis à jour");
      onOuvert(false);
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  return (
    <Dialog open={ouvert} onOpenChange={onOuvert}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le groupe</DialogTitle>
          <DialogDescription>
            Le nouveau nom sera visible par tous les membres.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nom.trim().length >= 2) enregistrer.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="renommer-nom">Nom</Label>
            <Input
              id="renommer-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              maxLength={80}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="renommer-description">Description</Label>
            <Textarea
              id="renommer-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOuvert(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={nom.trim().length < 2 || enregistrer.isPending}
            >
              {enregistrer.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------- panneau complet -- */

/**
 * Panneau latéral d'un groupe : membres, rôles, invitations, sortie.
 *
 * Tout est réuni ici plutôt que dispersé dans des menus : quand on cherche
 * « comment quitter ce groupe », on ouvre les informations du groupe.
 */
export function PanneauGroupe({
  groupeId,
  ouvert,
  onOuvert,
  onQuitte,
}: {
  groupeId: number;
  ouvert: boolean;
  onOuvert: (valeur: boolean) => void;
  onQuitte: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviterOuvert, setInviterOuvert] = useState(false);
  const [renommerOuvert, setRenommerOuvert] = useState(false);
  const [confirmation, setConfirmation] = useState<
    null | { type: "quitter" | "supprimer" } | { type: "retirer"; membreId: number; nom: string }
  >(null);

  const { data: groupe, isLoading } = useQuery({
    queryKey: ["groupes", "detail", groupeId],
    queryFn: () => groupesApi.detail(groupeId),
    enabled: ouvert,
  });

  const rafraichir = () =>
    queryClient.invalidateQueries({ queryKey: ["groupes"] });

  const changerRole = useMutation({
    mutationFn: ({ membreId, admin }: { membreId: number; admin: boolean }) =>
      groupesApi.changerRole(groupeId, membreId, admin ? "ADMIN" : "MEMBRE"),
    onSuccess: async (reponse) => {
      await rafraichir();
      toast.success(reponse.message);
    },
    onError: (error) =>
      toast.error("Changement impossible", { description: errorMessage(error) }),
  });

  const retirer = useMutation({
    mutationFn: (membreId: number) => groupesApi.retirerMembre(groupeId, membreId),
    onSuccess: async (reponse) => {
      await rafraichir();
      setConfirmation(null);
      toast.success(reponse.message);
    },
    onError: (error) =>
      toast.error("Retrait impossible", { description: errorMessage(error) }),
  });

  const quitter = useMutation({
    mutationFn: () => groupesApi.quitter(groupeId),
    onSuccess: async (reponse) => {
      await rafraichir();
      setConfirmation(null);
      onOuvert(false);
      onQuitte();
      toast.success(reponse.message);
    },
    onError: (error) =>
      toast.error("Impossible de quitter", { description: errorMessage(error) }),
  });

  const supprimer = useMutation({
    mutationFn: () => groupesApi.supprimer(groupeId),
    onSuccess: async (reponse) => {
      await rafraichir();
      setConfirmation(null);
      onOuvert(false);
      onQuitte();
      toast.success(reponse.message);
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  const jeSuisAdmin = groupe?.monRole === "ADMIN";

  return (
    <>
      <Sheet open={ouvert} onOpenChange={onOuvert}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{groupe?.nom ?? "Groupe"}</SheetTitle>
            <SheetDescription>
              {groupe?.description || "Informations et membres du groupe."}
            </SheetDescription>
          </SheetHeader>

          {isLoading || !groupe ? (
            <div className="grid flex-1 place-items-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 px-4">
                {jeSuisAdmin ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInviterOuvert(true)}
                    >
                      <MailPlus className="size-4" />
                      Inviter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRenommerOuvert(true)}
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </Button>
                  </>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmation({ type: "quitter" })}
                >
                  <DoorOpen className="size-4" />
                  Quitter
                </Button>
                {jeSuisAdmin ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setConfirmation({ type: "supprimer" })}
                  >
                    <Trash2 className="size-4" />
                    Supprimer
                  </Button>
                ) : null}
              </div>

              <Separator className="my-4" />

              <ScrollArea className="flex-1 px-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {groupe.membres.length} membre
                  {groupe.membres.length > 1 ? "s" : ""}
                </p>

                <ul className="mt-2 space-y-1">
                  {groupe.membres.map((membre) => {
                    const moi = membre.userId === user?.id;
                    return (
                      <li
                        key={membre.id}
                        className="flex items-center gap-3 rounded-xl p-2"
                      >
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage
                            src={fileUrl(membre.user.pictureUrl)}
                            alt=""
                          />
                          <AvatarFallback className="text-[11px]">
                            {initialesDe(membre.user)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {fullName(membre.user)}
                            {moi ? (
                              <span className="text-muted-foreground"> (vous)</span>
                            ) : null}
                          </span>
                          {membre.role === "ADMIN" ? (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Crown className="size-3" aria-hidden />
                              Administrateur
                            </span>
                          ) : null}
                        </span>

                        {jeSuisAdmin && !moi ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 shrink-0"
                                  aria-label={`Gérer ${fullName(membre.user)}`}
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  changerRole.mutate({
                                    membreId: membre.userId,
                                    admin: membre.role !== "ADMIN",
                                  })
                                }
                              >
                                {membre.role === "ADMIN" ? (
                                  <>
                                    <ShieldMinus className="size-4" />
                                    Retirer le rôle d&apos;administrateur
                                  </>
                                ) : (
                                  <>
                                    <Crown className="size-4" />
                                    Nommer administrateur
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setConfirmation({
                                    type: "retirer",
                                    membreId: membre.userId,
                                    nom: fullName(membre.user),
                                  })
                                }
                              >
                                <UserMinus className="size-4" />
                                Retirer du groupe
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                {groupe.invitations.length > 0 ? (
                  <>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {groupe.invitations.length} invitation
                      {groupe.invitations.length > 1 ? "s" : ""} en attente
                    </p>
                    <ul className="mt-2 space-y-1 pb-4">
                      {groupe.invitations.map((invitation) => (
                        <li
                          key={invitation.id}
                          className="flex items-center gap-3 rounded-xl p-2 opacity-70"
                        >
                          <Avatar className="size-8 shrink-0">
                            <AvatarImage
                              src={fileUrl(invitation.user.pictureUrl)}
                              alt=""
                            />
                            <AvatarFallback className="text-[11px]">
                              {initialesDe(invitation.user)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {fullName(invitation.user)}
                          </span>
                          <Badge variant="secondary" className="shrink-0">
                            En attente
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="pb-4" />
                )}
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {groupe ? (
        <>
          <DialogueInviter
            groupeId={groupeId}
            ouvert={inviterOuvert}
            onOuvert={setInviterOuvert}
          />
          <DialogueRenommer
            key={`${groupe.nom}-${groupe.description ?? ""}`}
            groupe={groupe}
            ouvert={renommerOuvert}
            onOuvert={setRenommerOuvert}
          />
        </>
      ) : null}

      <Dialog
        open={confirmation !== null}
        onOpenChange={(valeur) => !valeur && setConfirmation(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmation?.type === "supprimer"
                ? "Supprimer ce groupe ?"
                : confirmation?.type === "quitter"
                  ? "Quitter ce groupe ?"
                  : "Retirer ce membre ?"}
            </DialogTitle>
            <DialogDescription>
              {confirmation?.type === "supprimer"
                ? "Le groupe et tous ses messages seront effacés pour l'ensemble des membres. Cette action est définitive."
                : confirmation?.type === "quitter"
                  ? "Vous ne recevrez plus les messages de ce groupe. Il faudra une nouvelle invitation pour y revenir."
                  : confirmation?.type === "retirer"
                    ? `${confirmation.nom} ne fera plus partie du groupe et en sera informé.`
                    : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmation(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={
                quitter.isPending || supprimer.isPending || retirer.isPending
              }
              onClick={() => {
                if (confirmation?.type === "supprimer") supprimer.mutate();
                else if (confirmation?.type === "quitter") quitter.mutate();
                else if (confirmation?.type === "retirer")
                  retirer.mutate(confirmation.membreId);
              }}
            >
              {quitter.isPending || supprimer.isPending || retirer.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
