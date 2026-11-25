"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Loader2, Reply, Star, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsoleHeader } from "@/components/admin/console-header";
import {
  ConsoleFiltre,
  ConsolePastille,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import { EmptyState } from "@/components/shared/empty-state";
import { errorMessage, retoursApi } from "@/lib/api";
import { formatNumber, formatRelative } from "@/lib/format";
import type { Retour } from "@/lib/types";

const TEINTE = "var(--chart-4)";

type Filtre = "" | "membres" | "partenaires" | "sansReponse";

function nomAuteur(retour: Retour): string {
  const { auteur } = retour;
  const nom = [auteur.firstName, auteur.lastName].filter(Boolean).join(" ");
  return nom || auteur.username;
}

function CarteRetour({ retour }: { retour: Retour }) {
  const queryClient = useQueryClient();
  const [reponse, setReponse] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const estPartenaire = retour.auteur.role === "PARTENAIRE";
  const aBilan = retour.candidaturesRecues != null || retour.recrutes != null;

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
    <li className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {estPartenaire ? (
              <Building2 className="size-4 text-muted-foreground" aria-hidden />
            ) : (
              <UserRound className="size-4 text-muted-foreground" aria-hidden />
            )}
            <Link
              href={`/admin/utilisateurs/${retour.auteur.id}`}
              className="hover:text-primary hover:underline"
            >
              {nomAuteur(retour)}
            </Link>
            {estPartenaire ? (
              <ConsolePastille
                libelle={retour.auteur.entreprise?.nom ?? "Partenaire"}
                teinte="var(--chart-3)"
              />
            ) : null}
          </p>
          {retour.offre ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              sur{" "}
              <Link
                href={`/offres/${retour.offre.id}`}
                target="_blank"
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {retour.offre.titre}
              </Link>
            </p>
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatRelative(retour.datePublication)}
        </span>
      </div>

      {aBilan ? (
        <dl className="mt-3 flex flex-wrap gap-3">
          {retour.candidaturesRecues != null ? (
            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Candidatures reçues</dt>
              <dd className="text-lg font-bold tabular-nums">
                {formatNumber(retour.candidaturesRecues)}
              </dd>
            </div>
          ) : null}
          {retour.recrutes != null ? (
            <div className="rounded-xl bg-success/10 px-3 py-2">
              <dt className="text-xs text-muted-foreground">Personnes recrutées</dt>
              <dd className="text-lg font-bold tabular-nums">
                {formatNumber(retour.recrutes)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{retour.contenu}</p>

      {retour.reponses?.length ? (
        <ul className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
          {retour.reponses.map((r) => (
            <li key={r.id} className="text-sm">
              <span className="font-semibold">{r.auteur.username}</span>{" "}
              <span className="text-muted-foreground">· {formatRelative(r.dateCreation)}</span>
              <p className="whitespace-pre-line">{r.contenu}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {ouvert ? (
        <form
          className="mt-3 space-y-2"
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
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={repondre.isPending || reponse.trim().length < 2}>
              {repondre.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Répondre
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 -ml-2 rounded-lg"
          onClick={() => setOuvert(true)}
        >
          <Reply className="size-4" />
          Répondre
        </Button>
      )}
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
          { label: "Retours", valeur: retours.length },
          { label: "De partenaires", valeur: partenaires.length, teinte: "var(--chart-3)" },
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
            { valeur: "membres", libelle: "Membres", compte: retours.length - partenaires.length },
            { valeur: "partenaires", libelle: "Partenaires", compte: partenaires.length },
            { valeur: "sansReponse", libelle: "Sans réponse", compte: sansReponse.length },
          ]}
        />
      </ConsoleToolbar>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
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
        <ul className="space-y-3">
          {affiches.map((retour) => (
            <CarteRetour key={retour.id} retour={retour} />
          ))}
        </ul>
      )}
    </>
  );
}
