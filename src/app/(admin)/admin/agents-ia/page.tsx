"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  ChevronDown,
  Crown,
  FileText,
  Hash,
  Loader2,
  MapPin,
  MessageSquareText,
  MousePointerClick,
  Repeat,
  ScanText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { ConsoleHeader } from "@/components/admin/console-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { agentsIaApi, fileUrl } from "@/lib/api";
import {
  ROLE_LABELS,
  SEXE_LABELS,
  STATUT_PROFESSIONNEL_LABELS,
} from "@/lib/enums";
import {
  formatDateShort,
  formatDateTime,
  formatNumber,
  formatRelative,
  fullName,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatistiquesAgentsIA, UtilisateurAgentIA } from "@/lib/types";

const TEINTE = "var(--chart-2)";

const PERIODES = [
  { jours: 7, libelle: "7 jours" },
  { jours: 30, libelle: "30 jours" },
  { jours: 90, libelle: "3 mois" },
  { jours: 365, libelle: "12 mois" },
  { jours: 0, libelle: "Depuis le début" },
] as const;

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const JOURS_LONGS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

const LIBELLES_THEMES: Record<string, string> = {
  emploi: "Emploi",
  formation: "Formation",
  bourse: "Bourse",
  stage: "Stage",
  cv: "CV",
  orientation: "Orientation",
  secteurs: "Secteurs",
  volontariat: "Volontariat",
  entreprises: "Entreprises",
  plateforme: "Noken",
};

const LIBELLES_MODE: Record<string, string> = {
  apercu: "Relu avant enregistrement",
  enregistrement: "Enregistré directement",
};

type Assistant = StatistiquesAgentsIA["assistant"];
type Extracteur = StatistiquesAgentsIA["extracteur"];

/* ---------------------------------------------------------------- outils -- */

const infobulle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "0.75rem",
    fontSize: "0.8125rem",
    color: "var(--popover-foreground)",
  },
  labelStyle: { fontWeight: 600, color: "var(--popover-foreground)" },
} as const;

const axe = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

function pourcent(valeur: number): string {
  return `${valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

function initiales(user: UtilisateurAgentIA): string {
  return `${user.firstName?.[0] ?? user.username[0] ?? "?"}${
    user.lastName?.[0] ?? ""
  }`.toUpperCase();
}

/** Libellé lisible d'une valeur de profil, selon sa dimension. */
function libelleValeur(dimension: string, valeur: string): string {
  const cartes: Record<string, Record<string, string>> = {
    statut: STATUT_PROFESSIONNEL_LABELS as Record<string, string>,
    sexe: SEXE_LABELS as Record<string, string>,
    role: ROLE_LABELS as Record<string, string>,
  };
  return cartes[dimension]?.[valeur] ?? valeur;
}

/** Le Markdown de l'assistant, lu comme du texte : sans ses balises visibles. */
function texteSimple(markdown: string): string {
  return markdown
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1");
}

/* --------------------------------------------------------- composants -- */

function Bloc({
  titre,
  sousTitre,
  icone: Icone,
  large,
  children,
}: {
  titre: string;
  sousTitre?: string;
  icone?: React.ElementType;
  large?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("min-w-0 rounded-2xl border bg-card", large && "lg:col-span-2")}
    >
      <header className="flex items-start gap-2.5 border-b px-5 py-3.5">
        {Icone ? (
          <Icone
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-bold">{titre}</h2>
          {sousTitre ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{sousTitre}</p>
          ) : null}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Tendance({ valeur }: { valeur: number | null }) {
  if (valeur === null) return null;
  const hausse = valeur >= 0;
  const teinte = hausse ? "var(--success)" : "var(--destructive)";
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
      style={{
        background: `color-mix(in oklch, ${teinte} 14%, transparent)`,
        color: teinte,
      }}
      title="Par rapport à la période précédente de même durée"
    >
      {hausse ? (
        <TrendingUp className="size-3" aria-hidden />
      ) : (
        <TrendingDown className="size-3" aria-hidden />
      )}
      {hausse ? "+" : "−"}
      {Math.abs(valeur)}
      {" %"}
    </span>
  );
}

function Indicateur({
  icone: Icone,
  libelle,
  valeur,
  detail,
  tendance,
  teinte = TEINTE,
}: {
  icone: React.ElementType;
  libelle: string;
  valeur: string;
  detail?: string;
  tendance?: number | null;
  teinte?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border bg-card p-4">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl"
        style={{
          background: `color-mix(in oklch, ${teinte} 13%, transparent)`,
          color: teinte,
        }}
      >
        <Icone className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {libelle}
        </p>
        <p className="mt-0.5 flex items-center gap-2 text-xl font-bold tabular-nums">
          {valeur}
          {tendance !== undefined ? <Tendance valeur={tendance} /> : null}
        </p>
        {detail ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

function Personne({
  user,
  sousTitre,
}: {
  user: UtilisateurAgentIA | null;
  sousTitre?: string;
}) {
  if (!user) {
    return (
      <span className="text-sm text-muted-foreground">Compte supprimé</span>
    );
  }
  return (
    <Link
      href={`/admin/utilisateurs/${user.id}`}
      className="group flex min-w-0 items-center gap-2.5"
    >
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={fileUrl(user.pictureUrl)} alt="" />
        <AvatarFallback className="text-[11px]">{initiales(user)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold group-hover:underline">
          {fullName(user)}
        </span>
        {sousTitre ? (
          <span className="block truncate text-xs text-muted-foreground">
            {sousTitre}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** Barre de proportion, pour les classements par thème, lieu ou mot. */
function Barre({
  libelle,
  valeur,
  max,
  detail,
  teinte = TEINTE,
}: {
  libelle: React.ReactNode;
  valeur: number;
  max: number;
  detail?: string;
  teinte?: string;
}) {
  return (
    <li className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{libelle}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{formatNumber(valeur)}</span>
          {detail ? ` · ${detail}` : null}
        </span>
      </div>
      <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${max > 0 ? Math.max(3, (valeur / max) * 100) : 0}%`,
            background: teinte,
          }}
        />
      </span>
    </li>
  );
}

function Vide({ texte }: { texte: string }) {
  return (
    <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
      {texte}
    </p>
  );
}

/* --------------------------------------------------- assistant : parties -- */

function CarteChaleur({ heatmap }: { heatmap: number[][] }) {
  const max = Math.max(0, ...heatmap.flat());
  if (max === 0) return <Vide texte="Aucune question sur la période." />;

  let pic = { jour: 0, heure: 0, valeur: 0 };
  heatmap.forEach((ligne, jour) =>
    ligne.forEach((valeur, heure) => {
      if (valeur > pic.valeur) pic = { jour, heure, valeur };
    }),
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[34rem]">
          <div className="grid grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[3px]">
            <span />
            {Array.from({ length: 24 }, (_, heure) => (
              <span
                key={heure}
                className="text-center text-[10px] tabular-nums text-muted-foreground"
              >
                {heure % 3 === 0 ? `${heure}h` : ""}
              </span>
            ))}
            {heatmap.map((ligne, jour) => (
              <div key={jour} className="contents">
                <span className="self-center text-[11px] text-muted-foreground">
                  {JOURS_SEMAINE[jour]}
                </span>
                {ligne.map((valeur, heure) => (
                  <span
                    key={heure}
                    className="aspect-square rounded-[4px]"
                    title={`${JOURS_LONGS[jour]} ${heure} h : ${valeur} question${valeur > 1 ? "s" : ""}`}
                    style={{
                      background:
                        valeur === 0
                          ? "var(--muted)"
                          : `color-mix(in oklch, ${TEINTE} ${Math.round(18 + (valeur / max) * 82)}%, transparent)`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Pic d&apos;activité : le {JOURS_LONGS[pic.jour]} vers {pic.heure} h
        ({pic.valeur} question{pic.valeur > 1 ? "s" : ""}). Heure de Dakar.
      </p>
    </div>
  );
}

function ComparaisonProfil({ profil }: { profil: Assistant["profil"] }) {
  const [dimension, setDimension] = useState(profil[0]?.dimension ?? "statut");
  const courante = profil.find((p) => p.dimension === dimension) ?? profil[0];
  if (!courante) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Dimension du profil">
        {profil.map((p) => (
          <button
            key={p.dimension}
            role="tab"
            aria-selected={p.dimension === dimension}
            onClick={() => setDimension(p.dimension)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              p.dimension === dimension
                ? "border-transparent bg-foreground text-background"
                : "hover:bg-accent",
            )}
          >
            {p.libelle}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: TEINTE }} />
          Utilisateurs de l&apos;assistant
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-muted-foreground/40" />
          Ensemble des membres
        </span>
      </div>

      <ul className="space-y-3">
        {courante.lignes.map((ligne) => {
          const ecart = ligne.partAssistant - ligne.partMembres;
          return (
            <li key={ligne.valeur} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {libelleValeur(courante.dimension, ligne.valeur)}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
                  <span className="font-semibold">{pourcent(ligne.partAssistant)}</span>
                  <span className="text-muted-foreground">
                    contre {pourcent(ligne.partMembres)}
                  </span>
                  {Math.abs(ecart) >= 10 && ligne.assistant > 0 ? (
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 text-[10px]"
                      style={{
                        color: ecart > 0 ? "var(--success)" : "var(--warning)",
                      }}
                    >
                      {ecart > 0 ? "surreprésenté" : "sous-représenté"}
                    </Badge>
                  ) : null}
                </span>
              </div>
              <span className="mt-1.5 block space-y-1">
                <span className="block h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${ligne.partAssistant}%`, background: TEINTE }}
                  />
                </span>
                <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-muted-foreground/40"
                    style={{ width: `${ligne.partMembres}%` }}
                  />
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OngletAssistant({
  a,
  granularite,
  periode,
}: {
  a: Assistant;
  granularite: "jour" | "semaine";
  periode: string;
}) {
  const i = a.indicateurs;

  if (i.questions === 0) {
    return (
      <EmptyState
        icon={Bot}
        couleur={TEINTE}
        title="Aucune question sur cette période"
        description="Élargissez la période pour voir l'usage de l'assistant."
      />
    );
  }

  const maxTheme = Math.max(...a.themes.map((t) => t.questions), 0);
  const maxMot = Math.max(...a.mots.map((m) => m.occurrences), 0);
  const maxLieu = Math.max(...a.lieux.map((l) => l.mentions), 0);
  const maxSuggestion = Math.max(...a.suggestions.map((s) => s.occurrences), 0);
  const maxEngagement = Math.max(...a.engagement.map((e) => e.utilisateurs), 0);
  const activite = a.activite.map((ligne) => ({
    ...ligne,
    libelle: formatDateShort(ligne.date),
  }));

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------ indicateurs ---- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Indicateur
          icone={MessageSquareText}
          libelle="Questions posées"
          valeur={formatNumber(i.questions)}
          detail={`${formatNumber(i.conversations)} conversation${i.conversations > 1 ? "s" : ""} · ${periode}`}
          tendance={a.tendance.questions}
        />
        <Indicateur
          icone={Users}
          libelle="Personnes qui l'ont utilisé"
          valeur={formatNumber(i.utilisateurs)}
          detail={`${i.questionsParUtilisateur.toLocaleString("fr-FR")} question${i.questionsParUtilisateur >= 2 ? "s" : ""} par personne en moyenne`}
          tendance={a.tendance.utilisateurs}
        />
        <Indicateur
          icone={Sparkles}
          libelle="Adoption"
          valeur={pourcent(i.adoption)}
          detail={`${formatNumber(i.utilisateursTotal)} comptes sur ${formatNumber(i.comptesTotal)} l'ont déjà essayé`}
          teinte="var(--chart-1)"
        />
        <Indicateur
          icone={UserPlus}
          libelle="Nouveaux utilisateurs"
          valeur={formatNumber(i.nouveaux)}
          detail="Première question posée sur la période"
          teinte="var(--chart-3)"
        />
        <Indicateur
          icone={Repeat}
          libelle="Utilisateurs fidèles"
          valeur={formatNumber(i.fideles)}
          detail={`Revenus au moins deux jours différents · ${pourcent(i.utilisateurs ? (i.fideles * 100) / i.utilisateurs : 0)}`}
          teinte="var(--chart-5)"
        />
        <Indicateur
          icone={AlertTriangle}
          libelle="Réponses en échec"
          valeur={formatNumber(i.echecs + i.sansReponse)}
          detail={
            i.echecs + i.sansReponse === 0
              ? "Chaque question a reçu une réponse"
              : `${i.echecs} réponse${i.echecs > 1 ? "s" : ""} de repli, ${i.sansReponse} sans réponse`
          }
          teinte={i.echecs + i.sansReponse > 0 ? "var(--warning)" : "var(--success)"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ------------------------------------------------- activité ---- */}
        <Bloc
          titre="Activité"
          sousTitre={`Questions par ${granularite === "jour" ? "jour" : "semaine"}, et nombre de personnes.`}
          icone={CalendarClock}
          large
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={activite} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="libelle" {...axe} minTickGap={18} />
              <YAxis allowDecimals={false} width={44} {...axe} />
              <Tooltip {...infobulle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="questions" name="Questions" fill={TEINTE} radius={[5, 5, 0, 0]} />
              <Bar
                dataKey="utilisateurs"
                name="Personnes"
                fill="var(--chart-1)"
                fillOpacity={0.45}
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Bloc>

        {/* -------------------------------------------------- quand ------ */}
        <Bloc
          titre="Quand l'assistant est sollicité"
          sousTitre="Questions par jour de la semaine et par heure."
          icone={CalendarClock}
          large
        >
          <CarteChaleur heatmap={a.heatmap} />
        </Bloc>

        {/* -------------------------------------------------- thèmes ----- */}
        <Bloc
          titre="Thèmes des questions"
          sousTitre="Part des questions qui évoquent chaque thème ; une question peut en toucher plusieurs."
          icone={Hash}
        >
          <ul className="space-y-3">
            {a.themes.map((theme) => (
              <Barre
                key={theme.cle}
                libelle={theme.libelle}
                valeur={theme.questions}
                max={maxTheme}
                detail={pourcent(theme.part)}
              />
            ))}
          </ul>
        </Bloc>

        {/* ------------------------------------------ questions fréquentes -- */}
        <Bloc
          titre="Questions les plus posées"
          sousTitre="Regroupées quand elles sont identiques, à la ponctuation et aux accents près."
          icone={Crown}
        >
          {a.questionsFrequentes.length === 0 ? (
            <Vide texte="Aucune question sur la période." />
          ) : (
            <ol className="space-y-2.5">
              {a.questionsFrequentes.map((question, rang) => (
                <li key={question.texte} className="flex min-w-0 items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold tabular-nums">
                    {rang + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug [overflow-wrap:anywhere]">
                      {question.texte}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {question.occurrences} fois
                      </span>
                      <span>
                        par {question.utilisateurs} personne
                        {question.utilisateurs > 1 ? "s" : ""}
                      </span>
                      <span>· {formatRelative(question.derniere)}</span>
                      {question.suggestion ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          suggestion
                        </Badge>
                      ) : null}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Bloc>

        {/* ------------------------------------------------- suggestions --- */}
        <Bloc
          titre="Suggestions choisies"
          sousTitre="Les questions proposées d'un clic à l'ouverture de l'assistant."
          icone={MousePointerClick}
        >
          <ul className="space-y-3">
            {a.suggestions.map((suggestion) => (
              <Barre
                key={suggestion.texte}
                libelle={suggestion.texte}
                valeur={suggestion.occurrences}
                max={maxSuggestion}
                detail={`${suggestion.utilisateurs} pers.`}
                teinte="var(--chart-1)"
              />
            ))}
          </ul>
          {maxSuggestion === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Aucune suggestion choisie sur la période : les personnes posent
              leurs propres questions.
            </p>
          ) : null}
        </Bloc>

        {/* ---------------------------------------------------- mots ------ */}
        <Bloc
          titre="Mots les plus fréquents"
          sousTitre="Nombre de questions qui emploient chaque mot, mots outils écartés."
          icone={Hash}
        >
          {a.mots.length === 0 ? (
            <Vide texte="Pas assez de texte pour en tirer des mots." />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {a.mots.map((mot) => (
                <li
                  key={mot.mot}
                  className="rounded-full border px-2.5 py-1 text-sm"
                  style={{
                    background: `color-mix(in oklch, ${TEINTE} ${Math.round(6 + (mot.occurrences / maxMot) * 28)}%, transparent)`,
                  }}
                >
                  {mot.mot}{" "}
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {mot.occurrences}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Bloc>

        {/* ---------------------------------------------------- lieux ----- */}
        <Bloc
          titre="Lieux mentionnés"
          sousTitre="Villes et régions citées dans les questions."
          icone={MapPin}
        >
          {a.lieux.length === 0 ? (
            <Vide texte="Aucun lieu cité dans les questions de la période." />
          ) : (
            <ul className="space-y-3">
              {a.lieux.map((lieu) => (
                <Barre
                  key={lieu.lieu}
                  libelle={lieu.lieu}
                  valeur={lieu.mentions}
                  max={maxLieu}
                  teinte="var(--chart-4)"
                />
              ))}
            </ul>
          )}
        </Bloc>

        {/* ------------------------------------------------ classement --- */}
        <Bloc
          titre="Ceux qui l'utilisent le plus"
          sousTitre="Classement par nombre de questions sur la période."
          icone={Crown}
          large
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Personne</th>
                  <th className="pb-2 pr-3 text-right font-medium">Questions</th>
                  <th className="pb-2 pr-3 text-right font-medium">Conversations</th>
                  <th className="pb-2 pr-3 text-right font-medium">Jours actifs</th>
                  <th className="pb-2 pr-3 font-medium">Première question</th>
                  <th className="pb-2 font-medium">Dernière</th>
                </tr>
              </thead>
              <tbody>
                {a.classement.map((ligne, rang) => (
                  <tr key={ligne.user.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">
                      {rang + 1}
                    </td>
                    <td className="max-w-[16rem] py-2.5 pr-3">
                      <Personne
                        user={ligne.user}
                        sousTitre={[
                          ligne.profil.statutProfessionnel
                            ? libelleValeur("statut", ligne.profil.statutProfessionnel)
                            : null,
                          ligne.profil.region,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">
                      {ligne.questions}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {ligne.conversations}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {ligne.joursActifs}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {formatDateShort(ligne.premiere)}
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">
                      {formatRelative(ligne.derniere)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bloc>

        {/* ------------------------------------------------- engagement --- */}
        <Bloc
          titre="Intensité d'usage"
          sousTitre="Nombre de personnes selon le nombre de questions posées."
          icone={Repeat}
        >
          <ul className="space-y-3">
            {a.engagement.map((tranche) => (
              <Barre
                key={tranche.tranche}
                libelle={tranche.tranche}
                valeur={tranche.utilisateurs}
                max={maxEngagement}
                detail={pourcent(i.utilisateurs ? (tranche.utilisateurs * 100) / i.utilisateurs : 0)}
                teinte="var(--chart-5)"
              />
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Question moyenne : {formatNumber(a.longueurs.question)} caractères.
            Réponse moyenne : {formatNumber(a.longueurs.reponse)} caractères.
          </p>
        </Bloc>

        {/* --------------------------------------------------- profil ----- */}
        <Bloc
          titre="Qui utilise l'assistant"
          sousTitre="Profil des utilisateurs de la période, comparé à l'ensemble des membres."
          icone={Users}
        >
          <ComparaisonProfil profil={a.profil} />
        </Bloc>

        {/* ------------------------------------------ dernières questions -- */}
        <Bloc
          titre="Les 30 dernières questions"
          sousTitre="Touchez une question pour lire la réponse donnée."
          icone={MessageSquareText}
          large
        >
          <ul className="space-y-2">
            {a.dernieres.map((question) => (
              <li key={question.id} className="rounded-xl border">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start gap-3 p-3.5 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Personne user={question.user} />
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDateTime(question.date)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed [overflow-wrap:anywhere]">
                        {question.contenu}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {question.themes.map((theme) => (
                          <Badge
                            key={theme}
                            variant="outline"
                            className="h-5 px-1.5 text-[10px]"
                          >
                            {LIBELLES_THEMES[theme] ?? theme}
                          </Badge>
                        ))}
                        {question.reponseEnEchec || !question.reponse ? (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px]"
                            style={{ color: "var(--warning)" }}
                          >
                            {question.reponse ? "réponse en échec" : "sans réponse"}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <ChevronDown
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="border-t bg-muted/30 px-3.5 py-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Réponse de l&apos;assistant
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
                      {question.reponse
                        ? texteSimple(question.reponse)
                        : "Aucune réponse enregistrée pour cette question."}
                    </p>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Bloc>
      </div>
    </div>
  );
}

/* -------------------------------------------------- extracteur : partie -- */

function OngletExtracteur({
  e,
  granularite,
  periode,
}: {
  e: Extracteur;
  granularite: "jour" | "semaine";
  periode: string;
}) {
  const i = e.indicateurs;

  const contexte = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Indicateur
        icone={FileText}
        libelle="Membres ayant un CV"
        valeur={pourcent(i.membresAvecCv)}
        detail={`${formatNumber(i.cvTotal)} CV enregistrés sur la plateforme`}
        teinte="var(--chart-3)"
      />
      <Indicateur
        icone={CalendarClock}
        libelle="Journal de l'extracteur"
        valeur={e.mesureDepuis ? formatDateShort(e.mesureDepuis) : "Démarre"}
        detail={
          e.mesureDepuis
            ? "Date de la première extraction enregistrée"
            : "Les extractions sont enregistrées à partir de cette version"
        }
        teinte="var(--chart-1)"
      />
    </div>
  );

  if (!e.mesureDepuis || i.extractions === 0) {
    return (
      <div className="space-y-4">
        {contexte}
        <EmptyState
          icon={ScanText}
          couleur="var(--chart-3)"
          title={
            e.mesureDepuis
              ? "Aucune extraction sur cette période"
              : "Pas encore d'extraction enregistrée"
          }
          description={
            e.mesureDepuis
              ? "Élargissez la période pour voir l'usage de l'extracteur."
              : "L'extracteur ne gardait aucune trace de ses passages. Chaque CV analysé est désormais enregistré — qui, quand, quel fichier, quel résultat — et les statistiques apparaîtront ici dès les premières utilisations."
          }
        />
      </div>
    );
  }

  const maxType = Math.max(...e.parType.map((t) => t.extractions), 0);
  const maxMode = Math.max(...e.parMode.map((m) => m.extractions), 0);
  const activite = e.activite.map((ligne) => ({
    ...ligne,
    libelle: formatDateShort(ligne.date),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Indicateur
          icone={ScanText}
          libelle="CV analysés"
          valeur={formatNumber(i.extractions)}
          detail={periode}
          teinte="var(--chart-3)"
        />
        <Indicateur
          icone={Users}
          libelle="Personnes"
          valeur={formatNumber(i.utilisateurs)}
          detail="Ont fait analyser au moins un CV"
          teinte="var(--chart-3)"
        />
        <Indicateur
          icone={Sparkles}
          libelle="Analyses exploitables"
          valeur={pourcent(i.tauxReussite)}
          detail={`${formatNumber(i.reussies)} exploitable${i.reussies > 1 ? "s" : ""}${
            i.vides ? ` · ${i.vides} vide${i.vides > 1 ? "s" : ""}` : ""
          }`}
          teinte={i.tauxReussite >= 90 ? "var(--success)" : "var(--warning)"}
        />
        <Indicateur
          icone={FileText}
          libelle="Richesse moyenne"
          valeur={
            e.richesse
              ? `${e.richesse.experiences.toLocaleString("fr-FR")} exp.`
              : "—"
          }
          detail={
            e.richesse
              ? `${e.richesse.formations.toLocaleString("fr-FR")} formations, ${e.richesse.competences.toLocaleString("fr-FR")} compétences par CV`
              : "Aucune analyse aboutie"
          }
          teinte="var(--chart-3)"
        />
      </div>

      {contexte}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bloc
          titre="Activité"
          sousTitre={`CV analysés par ${granularite === "jour" ? "jour" : "semaine"}.`}
          icone={CalendarClock}
          large
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activite} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="libelle" {...axe} minTickGap={18} />
              <YAxis allowDecimals={false} width={44} {...axe} />
              <Tooltip {...infobulle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="extractions" name="CV analysés" fill="var(--chart-3)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Bloc>

        <Bloc
          titre="Type de fichier"
          sousTitre="PDF ou photographie du CV, et part d'analyses exploitables pour chacun."
          icone={FileText}
        >
          <ul className="space-y-3">
            {e.parType.map((type) => (
              <Barre
                key={type.type}
                libelle={type.type}
                valeur={type.extractions}
                max={maxType}
                detail={`${pourcent(type.extractions ? (type.reussies * 100) / type.extractions : 0)} de réussite`}
                teinte="var(--chart-3)"
              />
            ))}
          </ul>
        </Bloc>

        <Bloc
          titre="Façon de l'utiliser"
          sousTitre="Relu avant d'être enregistré, ou enregistré d'office."
          icone={MousePointerClick}
        >
          <ul className="space-y-3">
            {e.parMode.map((mode) => (
              <Barre
                key={mode.mode}
                libelle={LIBELLES_MODE[mode.mode] ?? mode.mode}
                valeur={mode.extractions}
                max={maxMode}
                teinte="var(--chart-1)"
              />
            ))}
          </ul>
        </Bloc>

        <Bloc
          titre="Ceux qui l'utilisent le plus"
          sousTitre="Plusieurs analyses pour une même personne peuvent signaler une difficulté."
          icone={Crown}
        >
          <ul className="space-y-3">
            {e.classement.map((ligne) => (
              <li key={ligne.user.id} className="flex min-w-0 items-center justify-between gap-3">
                <Personne user={ligne.user} sousTitre={formatRelative(ligne.derniere)} />
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{ligne.extractions}</span>{" "}
                  analyse{ligne.extractions > 1 ? "s" : ""}
                  {ligne.reussies < ligne.extractions
                    ? ` · ${ligne.extractions - ligne.reussies} échec${ligne.extractions - ligne.reussies > 1 ? "s" : ""}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc
          titre="Échecs les plus fréquents"
          sousTitre="Ce que l'extracteur a répondu quand l'analyse n'a pas abouti."
          icone={AlertTriangle}
        >
          {e.echecs.length === 0 ? (
            <Vide texte="Aucun échec sur la période." />
          ) : (
            <ul className="space-y-2.5">
              {e.echecs.map((echec) => (
                <li key={echec.erreur} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 [overflow-wrap:anywhere]">{echec.erreur}</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {echec.occurrences}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Bloc>

        <Bloc
          titre="Les 30 dernières analyses"
          sousTitre="Qui, quand, quel fichier, et ce qui en a été tiré."
          icone={ScanText}
          large
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Personne</th>
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Fichier</th>
                  <th className="pb-2 pr-3 font-medium">Mode</th>
                  <th className="pb-2 font-medium">Résultat</th>
                </tr>
              </thead>
              <tbody>
                {e.dernieres.map((ligne) => (
                  <tr key={ligne.id} className="border-b align-top last:border-0">
                    <td className="max-w-[14rem] py-2.5 pr-3">
                      <Personne user={ligne.user} />
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {formatDateTime(ligne.date)}
                    </td>
                    <td className="py-2.5 pr-3 text-xs">
                      {ligne.type}
                      <span className="block text-muted-foreground">
                        {formatNumber(ligne.tailleKo)} Ko
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {LIBELLES_MODE[ligne.mode] ?? ligne.mode}
                    </td>
                    <td className="py-2.5 text-xs">
                      {ligne.succes && ligne.vide ? (
                        <span style={{ color: "var(--warning)" }}>
                          Analyse vide — rien n&apos;a été tiré du document
                        </span>
                      ) : ligne.succes ? (
                        <span>
                          {ligne.experiences} exp. · {ligne.formations} form. ·{" "}
                          {ligne.competences} comp.
                        </span>
                      ) : (
                        <span style={{ color: "var(--warning)" }} className="[overflow-wrap:anywhere]">
                          Échec{ligne.erreur ? ` — ${ligne.erreur}` : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bloc>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page -- */

export default function AgentsIaPage() {
  const [jours, setJours] = useState<number>(30);
  const [onglet, setOnglet] = useState<"assistant" | "extracteur">("assistant");

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["admin", "agents-ia", jours],
    queryFn: () => agentsIaApi.statistiques(jours),
    placeholderData: (precedent) => precedent,
  });

  const periode =
    jours === 0
      ? "depuis le début"
      : `sur ${PERIODES.find((p) => p.jours === jours)?.libelle ?? `${jours} jours`}`;

  return (
    <>
      <ConsoleHeader
        title="Agents IA"
        icon={Bot}
        teinte={TEINTE}
        description="Qui utilise l'assistant et l'extracteur de CV, pour demander quoi, et à quelle fréquence."
        mesures={
          data
            ? [
                {
                  label: "questions à l'assistant",
                  valeur: data.assistant.indicateurs.questions,
                  teinte: TEINTE,
                },
                {
                  label: "personnes",
                  valeur: data.assistant.indicateurs.utilisateurs,
                },
                {
                  label: "CV analysés",
                  valeur: data.extracteur.indicateurs.extractions,
                  teinte: "var(--chart-3)",
                },
              ]
            : undefined
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl border bg-card p-1" role="tablist" aria-label="Agent">
          {(
            [
              { cle: "assistant", libelle: "Assistant IA", icone: Bot },
              { cle: "extracteur", libelle: "Extracteur de CV", icone: ScanText },
            ] as const
          ).map(({ cle, libelle, icone: Icone }) => (
            <button
              key={cle}
              role="tab"
              aria-selected={onglet === cle}
              onClick={() => setOnglet(cle)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                onglet === cle
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icone className="size-4" aria-hidden />
              {libelle}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Période">
          {isFetching && !isLoading ? (
            <Loader2 className="mr-1 size-4 animate-spin text-muted-foreground" aria-hidden />
          ) : null}
          {PERIODES.map((p) => (
            <button
              key={p.jours}
              onClick={() => setJours(p.jours)}
              aria-pressed={jours === p.jours}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                jours === p.jours
                  ? "border-transparent bg-foreground text-background"
                  : "hover:bg-accent",
              )}
            >
              {p.libelle}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError || !data ? (
        <EmptyState
          icon={AlertTriangle}
          couleur="var(--warning)"
          title="Statistiques indisponibles"
          description="Le serveur n'a pas répondu. Réessayez dans un instant."
        />
      ) : onglet === "assistant" ? (
        <OngletAssistant
          a={data.assistant}
          granularite={data.periode.granularite}
          periode={periode}
        />
      ) : (
        <OngletExtracteur
          e={data.extracteur}
          granularite={data.periode.granularite}
          periode={periode}
        />
      )}
    </>
  );
}
