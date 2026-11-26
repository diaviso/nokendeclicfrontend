"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Loader2,
  Reply,
  SendHorizontal,
  ShieldCheck,
  Star,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConsoleHeader } from "@/components/admin/console-header";
import {
  ConsoleFiltre,
  ConsolePastille,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import { ConsoleAction, ConsoleActions } from "@/components/admin/console-kit";
import { EmptyState } from "@/components/shared/empty-state";
import { errorMessage, fileUrl, retoursApi } from "@/lib/api";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Retour } from "@/lib/types";

const TEINTE = "var(--c-orange)";
const TEINTE_PARTENAIRE = "var(--c-lime)";
const TEINTE_MEMBRE = "var(--c-blue)";

type Filtre = "" | "membres" | "partenaires" | "sansReponse";

function nomAuteur(retour: Retour): string {
  const { auteur } = retour;
  const nom = [auteur.firstName, auteur.lastName].filter(Boolean).join(" ");
  return nom || auteur.username;
}

function CarteRetour({ retour, index }: { retour: Retour; index: number }) {
  const queryClient = useQueryClient();
  const [reponse, setReponse] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const estPartenaire = retour.auteur.role === "PARTENAIRE";
  const aBilan = retour.candidaturesRecues != null || retour.recrutes != null;
  const aReponse = Boolean(retour.reponses?.length);
  const teinte = estPartenaire ? TEINTE_PARTENAIRE : TEINTE_MEMBRE;
  const taux =
    retour.candidaturesRecues && retour.recrutes != null
      ? Math.round((retour.recrutes / retour.candidaturesRecues) * 100)
      : null;

  const repondre = useMutation({
    mutationFn: () => retoursApi.repondre(retour.id, reponse.trim()),
    onSuccess: async () => {
      setReponse("");
      setOuvert(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "retours"] });
      toast.success("Réponse envoyée");
    },
    onError: (error) =>
      toast.error("Réponse impossible", { description: errorMessage(error) }),
  });

  return (
    <li
      style={{ "--i": index } as React.CSSProperties}
      className="entree relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: teinte }}
      />

      <div className="p-5 pl-6">
        {/* En-tête : auteur, offre, date */}
        <div className="flex flex-wrap items-start gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={fileUrl(retour.auteur.pictureUrl)} alt="" />
            <AvatarFallback
              className="text-xs font-semibold"
              style={{
                background: `color-mix(in oklch, ${teinte} 15%, transparent)`,
                color: teinte,
              }}
            >
              {estPartenaire ? (
                <Building2 className="size-4" aria-hidden />
              ) : (
                (nomAuteur(retour)[0] ?? "?").toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              <Link
                href={`/admin/utilisateurs/${retour.auteur.id}`}
                className="hover:text-primary hover:underline"
              >
                {nomAuteur(retour)}
              </Link>
              {estPartenaire ? (
                <ConsolePastille
                  libelle={retour.auteur.entreprise?.nom ?? "Partenaire"}
                  teinte={TEINTE_PARTENAIRE}
                />
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <UserRound className="size-3" aria-hidden />
                  Membre
                </span>
              )}
              {aReponse ? (
                <ConsolePastille libelle="Répondu" teinte="var(--success)" />
              ) : (
                <ConsolePastille libelle="Sans réponse" teinte="var(--warning)" />
              )}
            </p>
            {retour.offre ? (
              <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <Briefcase className="size-3.5 shrink-0" aria-hidden />
                <span className="shrink-0">sur</span>
                <Link
                  href={`/offres/${retour.offre.id}`}
                  target="_blank"
                  className="truncate font-medium text-foreground hover:text-primary hover:underline"
                >
                  {retour.offre.titre}
                </Link>
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <time
              dateTime={retour.datePublication}
              title={formatDateTime(retour.datePublication)}
              className="text-xs text-muted-foreground"
            >
              {formatRelative(retour.datePublication)}
            </time>
            <ConsoleActions>
              {retour.offre ? (
                <ConsoleAction
                  libelle="Voir l'offre"
                  icone={ArrowUpRight}
                  href={`/offres/${retour.offre.id}`}
                  cible="_blank"
                />
              ) : null}
              <ConsoleAction
                libelle="Répondre"
                icone={Reply}
                ton="primaire"
                onClick={() => setOuvert(true)}
              />
            </ConsoleActions>
          </div>
        </div>

        {/* Bilan chiffré d'une structure */}
        {aBilan ? (
          <dl className="mt-4 flex flex-wrap gap-2.5">
            {retour.candidaturesRecues != null ? (
              <div className="flex items-center gap-2.5 rounded-xl border bg-muted/30 px-3 py-2">
                <Users className="size-4 text-muted-foreground" aria-hidden />
                <div>
                  <dd className="text-lg font-bold leading-none tabular-nums">
                    {formatNumber(retour.candidaturesRecues)}
                  </dd>
                  <dt className="mt-0.5 text-[11px] text-muted-foreground">
                    Candidatures reçues
                  </dt>
                </div>
              </div>
            ) : null}
            {retour.recrutes != null ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-[color-mix(in_oklch,var(--success)_30%,transparent)] bg-success/10 px-3 py-2">
                <UserCheck className="size-4 text-[var(--success)]" aria-hidden />
                <div>
                  <dd className="text-lg font-bold leading-none tabular-nums">
                    {formatNumber(retour.recrutes)}
                  </dd>
                  <dt className="mt-0.5 text-[11px] text-muted-foreground">
                    Personnes recrutées
                  </dt>
                </div>
              </div>
            ) : null}
            {taux != null ? (
              <div className="flex items-center rounded-xl border bg-muted/30 px-3 py-2">
                <div>
                  <dd className="text-lg font-bold leading-none tabular-nums">
                    {taux} %
                  </dd>
                  <dt className="mt-0.5 text-[11px] text-muted-foreground">
                    Taux de recrutement
                  </dt>
                </div>
              </div>
            ) : null}
          </dl>
        ) : null}

        {/* Contenu */}
        <blockquote className="mt-4 whitespace-pre-line rounded-xl bg-muted/30 px-4 py-3 text-sm leading-relaxed">
          {retour.contenu}
        </blockquote>

        {/* Réponses de l'administration */}
        {aReponse ? (
          <ul className="mt-3 space-y-2">
            {retour.reponses.map((r) => (
              <li
                key={r.id}
                className="ml-4 rounded-xl rounded-tl-sm bg-primary/[0.06] px-4 py-2.5 text-sm ring-1 ring-inset ring-primary/15"
              >
                <p className="mb-0.5 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="size-3 text-primary" aria-hidden />
                  <span className="font-semibold">{r.auteur.username}</span>
                  <time
                    dateTime={r.dateCreation}
                    title={formatDateTime(r.dateCreation)}
                    className="text-muted-foreground"
                  >
                    · {formatRelative(r.dateCreation)}
                  </time>
                </p>
                <p className="whitespace-pre-line leading-relaxed">{r.contenu}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Réponse */}
        {ouvert ? (
          <form
            className="mt-3 overflow-hidden rounded-xl border bg-background focus-within:ring-2 focus-within:ring-ring/30"
            onSubmit={(e) => {
              e.preventDefault();
              if (reponse.trim().length >= 2) repondre.mutate();
            }}
          >
            <Textarea
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Votre réponse, visible par l'auteur du retour"
              aria-label="Réponse au retour"
              autoFocus
              className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2">
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {reponse.length} / 2000
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setOuvert(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-lg"
                  disabled={repondre.isPending || reponse.trim().length < 2}
                >
                  {repondre.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="size-4" />
                  )}
                  Répondre
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className={cn("mt-2 -ml-2 rounded-lg", !aReponse && "text-primary")}
            onClick={() => setOuvert(true)}
          >
            <Reply className="size-4" />
            {aReponse ? "Répondre à nouveau" : "Répondre"}
          </Button>
        )}
      </div>
    </li>
  );
}

export default function RetoursConsolePage() {
  const [filtre, setFiltre] = useState<Filtre>("");
  const [recherche, setRecherche] = useState("");

  const { data: retours = [], isLoading } = useQuery({
    queryKey: ["admin", "retours"],
    queryFn: retoursApi.tous,
  });

  const partenaires = retours.filter((r) => r.auteur.role === "PARTENAIRE");
  const sansReponse = retours.filter((r) => !r.reponses?.length);
  const recrutes = partenaires.reduce((total, r) => total + (r.recrutes ?? 0), 0);
  const candidatures = partenaires.reduce(
    (total, r) => total + (r.candidaturesRecues ?? 0),
    0,
  );

  const affiches = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return retours.filter((r) => {
      if (filtre === "membres" && r.auteur.role === "PARTENAIRE") return false;
      if (filtre === "partenaires" && r.auteur.role !== "PARTENAIRE") return false;
      if (filtre === "sansReponse" && r.reponses?.length) return false;
      if (!terme) return true;
      return [r.contenu, r.offre?.titre, nomAuteur(r), r.auteur.entreprise?.nom]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(terme));
    });
  }, [retours, filtre, recherche]);

  return (
    <>
      <ConsoleHeader
        title="Retours"
        icon={Star}
        teinte={TEINTE}
        description="Les retours d'expérience des membres sur leurs candidatures, et les bilans des structures partenaires sur leurs recrutements. Ils sont privés : seule l'administration les lit, et peut y répondre."
        mesures={[
          { label: "Retours", valeur: retours.length, teinte: TEINTE },
          { label: "De partenaires", valeur: partenaires.length, teinte: TEINTE_PARTENAIRE },
          { label: "Candidatures déclarées", valeur: candidatures },
          { label: "Recrutements déclarés", valeur: recrutes, teinte: "var(--success)" },
          { label: "Sans réponse", valeur: sansReponse.length, teinte: "var(--warning)" },
        ]}
      />

      <ConsoleToolbar>
        <ConsoleSearch
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Texte, offre, auteur…"
          label="Rechercher un retour"
        />
        <ConsoleFiltre<Filtre>
          label="Filtrer les retours"
          valeur={filtre}
          onChange={setFiltre}
          options={[
            { valeur: "", libelle: "Tous", compte: retours.length },
            {
              valeur: "membres",
              libelle: "Membres",
              compte: retours.length - partenaires.length,
              teinte: TEINTE_MEMBRE,
            },
            {
              valeur: "partenaires",
              libelle: "Partenaires",
              compte: partenaires.length,
              teinte: TEINTE_PARTENAIRE,
            },
            {
              valeur: "sansReponse",
              libelle: "Sans réponse",
              compte: sansReponse.length,
              teinte: "var(--warning)",
            },
          ]}
        />
      </ConsoleToolbar>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : affiches.length === 0 ? (
        <EmptyState
          icon={Star}
          couleur={TEINTE}
          title={retours.length ? "Aucun retour ne correspond" : "Aucun retour pour l'instant"}
          description="Les membres laissent un retour depuis la page d'une offre ; les structures partenaires depuis la page de leurs propres offres."
        />
      ) : (
        <>
          <p className="mb-3 px-1 text-xs text-muted-foreground">
            {affiches.length} retour{affiches.length > 1 ? "s" : ""} affiché
            {affiches.length > 1 ? "s" : ""}
          </p>
          <ul className="space-y-3">
            {affiches.map((retour, index) => (
              <CarteRetour key={retour.id} retour={retour} index={index} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
