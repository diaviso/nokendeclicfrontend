"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SelecteurPersonnes } from "./selecteur-personnes";
import { errorMessage, groupesApi } from "@/lib/api";

/** Création d'un groupe, avec ses premières invitations. */
export function CreerGroupe({ onCree }: { onCree: (groupeId: number) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [selection, setSelection] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: invitables = [], isLoading } = useQuery({
    queryKey: ["groupes", "invitables"],
    queryFn: () => groupesApi.invitables(),
    enabled: ouvert,
  });

  const creer = useMutation({
    mutationFn: () =>
      groupesApi.creer({
        nom: nom.trim(),
        description: description.trim() || undefined,
        membres: selection,
      }),
    onSuccess: async (groupe) => {
      await queryClient.invalidateQueries({ queryKey: ["groupes"] });
      toast.success(`Groupe « ${groupe.nom} » créé`, {
        description:
          selection.length > 0
            ? `${selection.length} invitation(s) envoyée(s).`
            : "Invitez des personnes depuis le panneau du groupe.",
      });
      setOuvert(false);
      setNom("");
      setDescription("");
      setSelection([]);
      onCree(groupe.id);
    },
    onError: (error) =>
      toast.error("Création impossible", { description: errorMessage(error) }),
  });

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <UsersRound className="size-4" />
            Groupe
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau groupe</DialogTitle>
          <DialogDescription>
            Vous en serez administrateur. Les personnes choisies recevront une
            invitation à accepter.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nom.trim().length >= 2) creer.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="nom-groupe">Nom du groupe</Label>
            <Input
              id="nom-groupe"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Promotion 2026, Bureau, Projet…"
              maxLength={80}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description-groupe">
              Description <span className="text-muted-foreground">(facultatif)</span>
            </Label>
            <Textarea
              id="description-groupe"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="À quoi sert ce groupe ?"
              maxLength={500}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Inviter</Label>
            <SelecteurPersonnes
              personnes={invitables}
              selection={selection}
              onChange={setSelection}
              chargement={isLoading}
              videMessage="Aucune personne à inviter pour le moment. Vous pourrez le faire plus tard."
            />
          </div>

          {/* Le pied colle au bas du dialogue, qui défile sur un petit écran :
              sans cela, il fallait faire défiler tout le formulaire pour
              retrouver le bouton de validation. */}
          <div className="sticky bottom-0 -mx-4 -mb-4 flex justify-end gap-2 border-t bg-popover px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOuvert(false)}
              disabled={creer.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={nom.trim().length < 2 || creer.isPending}
            >
              {creer.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Créer le groupe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
