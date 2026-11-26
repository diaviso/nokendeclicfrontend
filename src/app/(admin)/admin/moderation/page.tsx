"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsolePastille } from "@/components/admin/console-ui";
import { ConsoleChamp, ConsoleDialogue } from "@/components/admin/console-kit";
import { celebrer } from "@/components/shared/celebration";
import {
  EmojiPicker,
  insererAuCurseur,
} from "@/components/shared/emoji-picker";
import { errorMessage, fileUrl, offresApi } from "@/lib/api";
import { styleOffre } from "@/lib/type-offre";
import { formatDateShort, formatRelative, fullName } from "@/lib/format";
import type { Offre } from "@/lib/types";

const TEINTE = "var(--c-amber)";

/** Motifs fréquents, à compléter : ils évitent de réécrire la même phrase. */
const MOTIFS_TYPES = [
  "Informations de contact ou de candidature manquantes.",
  "Description trop courte pour comprendre le poste.",
  "Date limite dépassée.",
  "Offre en doublon d'une annonce déjà publiée.",
];

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
  const [deplie, setDeplie] = useState(false);

  return (
    <article
      style={{ "--i": index } as React.CSSProperties}
      className="entree relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: TEINTE }}
      />

      <div className="grid gap-0 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0 p-5 pl-6">
          <div className="flex min-w-0 items-start gap-3.5">
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-xl"
              style={{
                background: `color-mix(in oklch, ${style.teinte} 13%, transparent)`,
                color: style.teinte,
              }}
            >
              <Icone className="size-5" />
            </span>

            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <ConsolePastille libelle={style.libelle} teinte={style.teinte} />
                <ConsolePastille
                  libelle={`Déposée ${formatRelative(offre.datePublication)}`}
                  teinte={TEINTE}
                />
              </div>
              <h2 className="text-base font-bold leading-snug sm:text-lg">
                {offre.titre}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" aria-hidden />
                  {offre.entreprise ?? "Sans organisation"}
                </span>
                {offre.localisation ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden />
                    {offre.localisation}
                  </span>
                ) : null}
                {offre.dateLimite ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3.5" aria-hidden />
                    Jusqu&apos;au {formatDateShort(offre.dateLimite)}
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="relative mt-4">
            <p
              className={
                deplie
                  ? "whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-relaxed"
                  : "max-h-40 overflow-hidden whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-relaxed"
              }
            >
              {offre.description}
            </p>
            {!deplie ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-xl bg-gradient-to-t from-card to-transparent"
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setDeplie((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {deplie ? (
              <>
                <ChevronUp className="size-3.5" /> Réduire
              </>
            ) : (
              <>
                <ChevronDown className="size-3.5" /> Lire l&apos;annonce entière
              </>
            )}
          </button>
        </div>

        {/* Colonne de décision */}
        <aside className="flex flex-col gap-3 border-t bg-muted/25 p-5 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9">
              <AvatarImage src={fileUrl(offre.auteur?.pictureUrl)} alt="" />
              <AvatarFallback className="text-xs">
                {(offre.auteur?.username?.[0] ?? "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-xs">
              <p className="text-muted-foreground">Déposée par</p>
              <p className="truncate text-sm font-semibold">{fullName(offre.auteur)}</p>
            </div>
          </div>

          <div className="mt-auto grid gap-2">
            <Button className="w-full rounded-xl" disabled={enCours} onClick={onValider}>
              {enCours ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Publier
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={enCours}
              onClick={onRefuser}
            >
              <X className="size-4" />
              Refuser…
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-xl"
              render={<Link href={`/admin/offres/${offre.id}/modifier`} />}
            >
              <ExternalLink className="size-3.5" />
              Ouvrir en détail
            </Button>
          </div>
        </aside>
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

  const fermerRefus = () => {
    setARefuser(null);
    setMotif("");
  };

  const plusAncienne = offres.length
    ? offres.reduce((a, b) =>
        new Date(a.datePublication) < new Date(b.datePublication) ? a : b,
      )
    : null;

  return (
    <>
      <ConsoleHeader
        title="Validation des offres"
        icon={ShieldCheck}
        teinte={TEINTE}
        description="Annonces déposées par les structures partenaires, en attente de relecture. Les plus anciennes d'abord."
        mesures={
          isLoading
            ? undefined
            : [
                {
                  label: "en attente",
                  valeur: offres.length,
                  teinte: offres.length > 0 ? TEINTE : undefined,
                },
                {
                  label: "structures concernées",
                  valeur: new Set(offres.map((o) => o.entreprise ?? o.auteur?.id)).size,
                },
                {
                  label: "plus ancien dépôt",
                  valeur: plusAncienne ? formatRelative(plusAncienne.datePublication) : "—",
                },
              ]
        }
        actions={
          <Button
            variant="outline"
            className="rounded-xl bg-background/70"
            render={<Link href="/admin/offres" />}
          >
            <Building2 className="size-4" />
            Toutes les offres
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl border bg-card p-5"
              style={{ opacity: 1 - index * 0.25 }}
            >
              <div className="flex gap-3">
                <div className="shimmer size-11 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="shimmer h-4 w-1/3 rounded bg-muted" />
                  <div className="shimmer h-3 w-1/4 rounded bg-muted" />
                </div>
              </div>
              <div className="shimmer mt-4 h-24 rounded-xl bg-muted" />
            </div>
          ))}
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
              enCours={moderer.isPending && moderer.variables?.id === offre.id}
              onValider={() => moderer.mutate({ id: offre.id, statut: "PUBLIEE" })}
              onRefuser={() => {
                setARefuser(offre);
                setMotif("");
              }}
            />
          ))}
        </div>
      )}

      {aRefuser ? (
        <ConsoleDialogue
          onFermer={fermerRefus}
          icone={X}
          teinte="var(--destructive)"
          taille="md"
          titre="Refuser cette offre ?"
          description={
            <>
              « {aRefuser.titre} » restera accessible à son auteur, qui pourra la
              corriger et la soumettre à nouveau. Expliquez ce qui bloque :
              c&apos;est le seul élément dont il disposera.
            </>
          }
          onSubmit={() => {
            if (motif.trim().length >= 5) {
              moderer.mutate({
                id: aRefuser.id,
                statut: "REFUSEE",
                motif: motif.trim(),
              });
            }
          }}
          pied={
            <>
              <Button type="button" variant="ghost" className="rounded-lg" onClick={fermerRefus}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="rounded-lg"
                disabled={moderer.isPending || motif.trim().length < 5}
              >
                {moderer.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <X className="size-4" />
                )}
                Refuser et notifier
              </Button>
            </>
          }
        >
          <ConsoleChamp
            id="motif-refus"
            libelle="Motif du refus"
            requis
            aide="Au moins 5 caractères. Le partenaire le reçoit tel quel."
          >
            <Textarea
              id="motif-refus"
              ref={champMotif}
              value={motif}
              onChange={(event) => setMotif(event.target.value)}
              rows={5}
              maxLength={500}
              autoFocus
              placeholder="Ex. : la rémunération annoncée est incohérente avec le poste, et aucun contact de candidature n'est indiqué."
            />
          </ConsoleChamp>

          <div className="mt-2 flex items-center justify-between gap-2">
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

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Motifs fréquents
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MOTIFS_TYPES.map((texte) => (
                <button
                  key={texte}
                  type="button"
                  onClick={() =>
                    setMotif((precedent) =>
                      (precedent.trim() ? `${precedent.trim()} ${texte}` : texte).slice(0, 500),
                    )
                  }
                  className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {texte}
                </button>
              ))}
            </div>
          </div>
        </ConsoleDialogue>
      ) : null}
    </>
  );
}
