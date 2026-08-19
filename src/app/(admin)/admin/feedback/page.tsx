"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MessageCircle, MessagesSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import {
  ConsoleFiltre,
  ConsolePastille,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import { adminApi, fileUrl } from "@/lib/api";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_STATUS_LABELS,
} from "@/lib/enums";
import { formatRelative, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Feedback, FeedbackPriority, FeedbackStatus } from "@/lib/types";

/**
 * L'ordre des statuts est celui du traitement, pas l'ordre alphabétique : un
 * signalement ouvert demande une action, un signalement fermé n'en demande plus.
 */
const ORDRE_STATUTS: FeedbackStatus[] = [
  "OUVERT",
  "EN_COURS",
  "RESOLU",
  "FERME",
];

const TEINTE_STATUT: Record<FeedbackStatus, string | undefined> = {
  OUVERT: "var(--info)",
  EN_COURS: "var(--warning)",
  RESOLU: "var(--success)",
  FERME: undefined,
};

const TEINTE_PRIORITE: Record<FeedbackPriority, string | undefined> = {
  CRITIQUE: "var(--destructive)",
  HAUTE: "var(--warning)",
  MOYENNE: "var(--chart-1)",
  BASSE: undefined,
};

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [statut, setStatut] = useState<FeedbackStatus | "">("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: adminApi.feedbacks,
  });

  const tous = useMemo(() => data ?? [], [data]);

  const signalements = useMemo(() => {
    const filtres = statut ? tous.filter((f) => f.statut === statut) : tous;
    return [...filtres].sort(
      (a, b) =>
        ORDRE_STATUTS.indexOf(a.statut) - ORDRE_STATUTS.indexOf(b.statut) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [tous, statut]);

  const comptes = useMemo(
    () =>
      ORDRE_STATUTS.reduce(
        (acc, valeur) => {
          acc[valeur] = tous.filter((f) => f.statut === valeur).length;
          return acc;
        },
        {} as Record<FeedbackStatus, number>,
      ),
    [tous],
  );

  const enAttente = (comptes.OUVERT ?? 0) + (comptes.EN_COURS ?? 0);
  const urgents = tous.filter(
    (f) =>
      (f.priorite === "CRITIQUE" || f.priorite === "HAUTE") &&
      f.statut !== "RESOLU" &&
      f.statut !== "FERME",
  ).length;

  const colonnes: ColonneConsole<Feedback>[] = [
    {
      cle: "signalement",
      entete: "Signalement",
      cellule: (feedback) => (
        <div className="flex items-start gap-3">
          <Avatar className="mt-0.5 size-8 shrink-0">
            <AvatarImage src={fileUrl(feedback.auteur.pictureUrl)} alt="" />
            <AvatarFallback className="text-[11px]">
              {(feedback.auteur.username[0] ?? "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 text-left">
            <p className="truncate font-semibold">{feedback.titre}</p>
            <p className="truncate text-xs text-muted-foreground">
              {fullName(feedback.auteur)} · {formatRelative(feedback.createdAt)}
            </p>
          </div>
        </div>
      ),
    },
    {
      cle: "categorie",
      entete: "Catégorie",
      className: "w-36",
      cellule: (feedback) => (
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {FEEDBACK_CATEGORY_LABELS[feedback.categorie]}
        </span>
      ),
    },
    {
      cle: "statut",
      entete: "Statut",
      className: "w-32",
      cellule: (feedback) => (
        <ConsolePastille
          libelle={FEEDBACK_STATUS_LABELS[feedback.statut]}
          teinte={TEINTE_STATUT[feedback.statut]}
          discret={!TEINTE_STATUT[feedback.statut]}
        />
      ),
    },
    {
      cle: "priorite",
      entete: "Priorité",
      secondaire: true,
      className: "w-32",
      cellule: (feedback) => (
        <ConsolePastille
          libelle={FEEDBACK_PRIORITY_LABELS[feedback.priorite]}
          teinte={TEINTE_PRIORITE[feedback.priorite]}
          discret={!TEINTE_PRIORITE[feedback.priorite]}
        />
      ),
    },
    {
      cle: "reponses",
      entete: "Échanges",
      align: "right",
      className: "w-28",
      cellule: (feedback) => {
        const nombre = feedback.reponses?.length ?? 0;
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs tabular-nums",
              nombre === 0
                ? "text-muted-foreground/50"
                : "font-semibold text-foreground",
            )}
          >
            <MessagesSquare className="size-3.5" aria-hidden />
            {nombre}
          </span>
        );
      },
    },
    {
      cle: "aller",
      entete: "",
      className: "w-8",
      align: "right",
      cellule: () => (
        <ChevronRight
          className="size-4 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
          aria-hidden
        />
      ),
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="Signalements"
        icon={MessageCircle}
        teinte="var(--chart-5)"
        description="Anomalies, questions et suggestions remontées par les membres depuis l'application."
        mesures={
          isLoading
            ? undefined
            : [
                { label: "au total", valeur: tous.length, teinte: "var(--chart-5)" },
                {
                  label: "en attente de traitement",
                  valeur: enAttente,
                  teinte: enAttente > 0 ? "var(--info)" : undefined,
                },
                {
                  label: "prioritaires non traités",
                  valeur: urgents,
                  teinte: urgents > 0 ? "var(--destructive)" : undefined,
                },
              ]
        }
      />

      <ConsoleToolbar>
        <ConsoleFiltre<FeedbackStatus | "">
          label="Filtrer par statut"
          valeur={statut}
          onChange={setStatut}
          className="w-full sm:w-auto"
          options={[
            { valeur: "", libelle: "Tous", compte: tous.length },
            ...ORDRE_STATUTS.map((valeur) => ({
              valeur,
              libelle: FEEDBACK_STATUS_LABELS[valeur],
              compte: comptes[valeur] ?? 0,
              teinte: TEINTE_STATUT[valeur] ?? "var(--muted-foreground)",
            })),
          ]}
        />

        <p className="ml-auto hidden text-xs text-muted-foreground lg:block">
          Les signalements ouverts remontent en premier.
        </p>
      </ConsoleToolbar>

      <ConsoleTable
        lignes={signalements}
        colonnes={colonnes}
        cle={(feedback) => feedback.id}
        chargement={isLoading}
        rail={(feedback) =>
          TEINTE_PRIORITE[feedback.priorite] ??
          TEINTE_STATUT[feedback.statut] ??
          "var(--muted-foreground)"
        }
        onLigneClick={(feedback) =>
          router.push(`/admin/feedback/${feedback.id}`)
        }
        vide={
          <EmptyState
            icon={MessageCircle}
            couleur="var(--chart-5)"
            title={statut ? "Rien dans ce statut" : "Aucun signalement"}
            description={
              statut
                ? "Aucun signalement n'est actuellement dans cet état."
                : "Les retours envoyés depuis l'application apparaîtront ici."
            }
          />
        }
      />
    </>
  );
}
