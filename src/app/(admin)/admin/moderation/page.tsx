"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Check,
  ExternalLink,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsolePastille } from "@/components/admin/console-ui";
import { celebrer } from "@/components/shared/celebration";
import {
  EmojiPicker,
  insererAuCurseur,
} from "@/components/shared/emoji-picker";
import { errorMessage, fileUrl, offresApi } from "@/lib/api";
import { styleOffre } from "@/lib/type-offre";
import { formatRelative, fullName } from "@/lib/format";
import type { Offre } from "@/lib/types";

/**
 * File de validation des offres déposées par les partenaires.
 *
 * Les plus anciennes en tête : c'est le partenaire qui attend depuis le plus
 * longtemps qu'il faut traiter d'abord. Chaque annonce est présentée entière —
 * on ne valide pas un titre, on valide un contenu.
 */
function CarteAttente({
  offre,
  index,
  onValider,
  onRefuser,
  enCours,
}: {
  offre: Offre;
  index: number;
  onValider: () => void;
  onRefuser: () => void;
  enCours: boolean;
}) {
  const style = styleOffre(offre);
  const Icone = style.icone;

  return (
    <article
      style={{ "--i": index } as React.CSSProperties}
      className="entree relative overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: "var(--warning)" }}
      />

      <div className="p-5 pl-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl"
              style={{
                background: `color-mix(in oklch, ${style.teinte} 12%, transparent)`,
                color: style.teinte,
              }}
            >
              <Icone className="size-5" />
            </span>

            <div className="min-w-0">
              <h2 className="text-base font-bold leading-snug">{offre.titre}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {offre.entreprise ?? "Sans organisation"}
                {offre.localisation ? ` · ${offre.localisation}` : ""}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <ConsolePastille libelle={style.libelle} teinte={style.teinte} />
            <ConsolePastille
              libelle={`Déposée ${formatRelative(offre.datePublication)}`}
              teinte="var(--warning)"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="size-6">
            <AvatarImage src={fileUrl(offre.auteur?.pictureUrl)} alt="" />
            <AvatarFallback className="text-[10px]">
              {(offre.auteur?.username?.[0] ?? "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          Déposée par{" "}
          <span className="font-semibold text-foreground">
            {fullName(offre.auteur)}
          </span>
        </div>

        <p className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted/40 p-3.5 text-sm leading-relaxed">
          {offre.description}
        </p>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t pt-3.5">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg"
            render={<Link href={`/admin/offres/${offre.id}/modifier`} />}
          >
            <ExternalLink className="size-3.5" />
            Ouvrir en détail
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-destructive hover:bg-destructive/10"
              disabled={enCours}
              onClick={onRefuser}
            >
              <X className="size-4" />
              Refuser
            </Button>
            <Button
              size="sm"
              className="rounded-lg"
              disabled={enCours}
              onClick={onValider}
            >
              {enCours ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Publier
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const [aRefuser, setARefuser] = useState<Offre | null>(null);
  const [motif, setMotif] = useState("");
  const champMotif = useRef<HTMLTextAreaElement>(null);

  const { data: offres = [], isLoading } = useQuery({
    queryKey: ["admin", "moderation"],
    queryFn: offresApi.enAttente,
  });

  const rafraichir = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "moderation"] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "offres"] });
    await queryClient.invalidateQueries({ queryKey: ["offres"] });
  };

  const moderer = useMutation({
    mutationFn: ({
      id,
      statut,
      motif,
    }: {
      id: number;
      statut: "PUBLIEE" | "REFUSEE";
      motif?: string;
    }) => offresApi.moderer(id, { statut, motif }),
    onSuccess: async (_donnees, variables) => {
      await rafraichir();
      setARefuser(null);
      setMotif("");

      if (variables.statut === "PUBLIEE") {
        celebrer();
        toast.success("Offre publiée", {
          description: "Elle est désormais visible au catalogue, et les membres en sont notifiés.",
        });
      } else {
        toast.success("Offre refusée", {
          description: "Le partenaire peut la corriger et la soumettre à nouveau.",
        });
      }
    },
    onError: (error) =>
      toast.error("Décision impossible", { description: errorMessage(error) }),
  });

  return (
    <>
      <ConsoleHeader
        title="Validation des offres"
        icon={ShieldCheck}
        teinte="var(--warning)"
        description="Annonces déposées par les structures partenaires, en attente de relecture. Les plus anciennes d'abord."
        mesures={
          isLoading
            ? undefined
            : [
                {
                  label: "en attente",
                  valeur: offres.length,
                  teinte: offres.length > 0 ? "var(--warning)" : undefined,
                },
              ]
        }
      />

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="sr-only">Chargement de la file…</span>
        </div>
      ) : offres.length === 0 ? (
        <EmptyState
          icon={Check}
          couleur="var(--success)"
          title="Rien à relire"
          description="Aucune offre partenaire n'attend de validation. Les nouveaux dépôts apparaîtront ici."
          action={
            <Button
              variant="outline"
              className="rounded-xl"
              render={<Link href="/admin/offres" />}
            >
              <Building2 className="size-4" />
              Voir toutes les offres
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {offres.map((offre, index) => (
            <CarteAttente
              key={offre.id}
              offre={offre}
              index={index}
              enCours={moderer.isPending}
              onValider={() =>
                moderer.mutate({ id: offre.id, statut: "PUBLIEE" })
              }
              onRefuser={() => {
                setARefuser(offre);
                setMotif("");
              }}
            />
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(aRefuser)}
        onOpenChange={() => {
          setARefuser(null);
          setMotif("");
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Refuser cette offre ?</DialogTitle>
            <DialogDescription>
              « {aRefuser?.titre} » restera accessible à son auteur, qui pourra
              la corriger et la soumettre à nouveau. Expliquez ce qui bloque :
              c&apos;est le seul élément dont il disposera.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (aRefuser && motif.trim()) {
                moderer.mutate({
                  id: aRefuser.id,
                  statut: "REFUSEE",
                  motif: motif.trim(),
                });
              }
            }}
            noValidate
          >
            <Textarea
              ref={champMotif}
              value={motif}
              onChange={(event) => setMotif(event.target.value)}
              rows={4}
              maxLength={500}
              autoFocus
              placeholder="Ex. : la rémunération annoncée est incohérente avec le poste, et aucun contact de candidature n'est indiqué."
              aria-label="Motif du refus"
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <EmojiPicker
                  onChoisir={(symbole) =>
                    setMotif((precedent) =>
                      insererAuCurseur(champMotif.current, precedent, symbole),
                    )
                  }
                  label="Insérer un émoji dans le motif"
                />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {motif.length}/500
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => {
                    setARefuser(null);
                    setMotif("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  className="rounded-xl"
                  disabled={moderer.isPending || motif.trim().length < 5}
                >
                  {moderer.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-4" />
                  )}
                  Refuser et notifier
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
