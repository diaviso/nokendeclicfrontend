"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Accessibility,
  ArrowLeft,
  Bell,
  BellRing,
  Bot,
  Briefcase,
  Cake,
  FileText,
  GraduationCap,
  Heart,
  Layers,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Phone,
  Star,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ConsolePastille } from "@/components/admin/console-ui";
import { DefinirMotDePasse } from "@/components/admin/definir-mot-de-passe";
import { adminApi, fileUrl } from "@/lib/api";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_STATUS_LABELS,
  roleLabel,
  sexeLabel,
  statutProfessionnelLabel,
} from "@/lib/enums";
import { styleType } from "@/lib/type-offre";
import {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatRelative,
  fullName,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  FeedbackPriority,
  FeedbackStatus,
  Role,
  TypeOffreDef,
} from "@/lib/types";

const TEINTE_ROLE: Record<Role, string> = {
  ADMIN: "var(--destructive)",
  PARTENAIRE: "var(--chart-2)",
  MEMBRE: "var(--chart-1)",
};

const TEINTE_STATUT_SIGNALEMENT: Record<FeedbackStatus, string | undefined> = {
  OUVERT: "var(--info)",
  EN_COURS: "var(--warning)",
  RESOLU: "var(--success)",
  FERME: undefined,
};

const TEINTE_PRIORITE: Record<FeedbackPriority, string | undefined> = {
  CRITIQUE: "var(--destructive)",
  HAUTE: "var(--warning)",
  MOYENNE: undefined,
  BASSE: undefined,
};

/** Type d'offre tel qu'imbriqué dans les listes de la fiche. */
type TypeImbrique = Pick<
  TypeOffreDef,
  "id" | "code" | "libelle" | "icone" | "couleur"
> | null;

/**
 * Forme renvoyée par GET /api/admin/users/:id.
 *
 * Ne contient volontairement ni `password` ni `refreshToken` : la projection
 * backend a été corrigée (constat C3 de l'audit), elle utilisait `include` seul
 * et exposait donc le hash bcrypt et le jeton de rafraîchissement.
 */
interface FicheUtilisateur {
  id: number;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  role: Role;
  isActive: boolean;
  isEmailVerified?: boolean;
  isGoogleLogin?: boolean;
  pictureUrl?: string | null;
  statutProfessionnel?: string | null;
  sexe?: string | null;
  dateNaissance?: string | null;
  telephone?: string | null;
  pays?: string | null;
  region?: string | null;
  departement?: string | null;
  commune?: string | null;
  adresse?: string | null;
  handicap?: boolean;
  typeHandicap?: string | null;
  createdAt: string;
  updatedAt?: string;
  derniereActivite?: string | null;

  cv?: {
    titreProfessionnel?: string | null;
    resume?: string | null;
    telephone?: string | null;
    ville?: string | null;
    pays?: string | null;
    linkedin?: string | null;
    github?: string | null;
    siteWeb?: string | null;
    competences?: string[];
    langues?: string[];
    certifications?: string[];
    interets?: string[];
    rubriques?: { titre: string; entrees: { titre: string }[] }[];
    estPublic?: boolean;
    dateModification?: string;
    experiences?: {
      id: number;
      poste: string;
      entreprise: string;
      ville?: string | null;
      dateDebut: string;
      dateFin?: string | null;
      enCours?: boolean;
    }[];
    formations?: {
      id: number;
      diplome: string;
      etablissement: string;
      ville?: string | null;
      dateDebut: string;
      dateFin?: string | null;
      enCours?: boolean;
    }[];
  } | null;

  offres?: {
    id: number;
    titre: string;
    datePublication: string;
    estCloturee?: boolean;
    typeOffre?: TypeImbrique;
    _count?: { retours: number; commentaires: number };
  }[];
  retours?: {
    id: number;
    contenu: string;
    datePublication: string;
    offre?: { id: number; titre: string };
    _count?: { reponses: number };
  }[];
  favorites?: {
    id: number;
    createdAt: string;
    offre: {
      id: number;
      titre: string;
      entreprise?: string | null;
      estCloturee?: boolean;
      typeOffre?: TypeImbrique;
    };
  }[];
  likes?: {
    id: number;
    createdAt: string;
    offre: { id: number; titre: string; typeOffre?: TypeImbrique };
  }[];
  commentaires?: {
    id: number;
    contenu: string;
    datePublication: string;
    offre?: { id: number; titre: string };
  }[];
  feedbacks?: {
    id: number;
    titre: string;
    categorie: keyof typeof FEEDBACK_CATEGORY_LABELS;
    statut: FeedbackStatus;
    priorite: FeedbackPriority;
    createdAt: string;
    _count?: { reponses: number };
  }[];
  alerts?: {
    id: number;
    criteria: Record<string, unknown>;
    isActive: boolean;
    lastSent?: string | null;
    createdAt: string;
  }[];
  dernieresNotifications?: {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }[];

  _count?: {
    retours: number;
    offres: number;
    favorites: number;
    likes: number;
    commentaires: number;
    feedbacks: number;
    alerts: number;
    notifications: number;
    conversations: number;
  };
  aiChatStats?: {
    totalConversations: number;
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    lastConversationDate: string | null;
  };
  messagingStats?: {
    privateConversations: number;
    privateMessagesSent: number;
    privateMessagesReceived: number;
  };
  engagementStats?: {
    alertsCount: number;
    commentsCount: number;
    likesCount: number;
    feedbacksCount: number;
    notificationsCount: number;
    notificationsNonLues: number;
  };
}

function Ligne({
  icone: Icone,
  label,
  valeur,
}: {
  icone?: typeof Mail;
  label: string;
  valeur?: React.ReactNode;
}) {
  if (valeur === null || valeur === undefined || valeur === "") return null;

  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        {Icone ? (
          <Icone className="size-3.5 text-muted-foreground/70" aria-hidden />
        ) : null}
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm font-medium">{valeur}</dd>
    </div>
  );
}

function Panneau({
  titre,
  teinte = "var(--chart-1)",
  compte,
  index = 0,
  className,
  children,
}: {
  titre: string;
  teinte?: string;
  /** Total réel, quand la liste affichée n'en montre qu'un extrait. */
  compte?: number;
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "entree overflow-hidden rounded-2xl border bg-card shadow-sm",
        className,
      )}
    >
      <header className="flex items-center gap-2.5 border-b px-5 py-3.5">
        <span
          aria-hidden
          className="h-4 w-1 shrink-0 rounded-full"
          style={{ background: teinte }}
        />
        <h2 className="text-sm font-bold">{titre}</h2>
        {compte !== undefined && compte > 0 ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
            {compte}
          </span>
        ) : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Mesure({
  label,
  valeur,
  icone: Icone,
  teinte,
  precision,
}: {
  label: string;
  valeur: number;
  icone: typeof Briefcase;
  teinte: string;
  precision?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <div className="flex items-center gap-2">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklch, ${teinte} 13%, transparent)`,
            color: teinte,
          }}
        >
          <Icone className="size-3.5" aria-hidden />
        </span>
        <p className="min-w-0 truncate text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold leading-none tabular-nums">{valeur}</p>
      {precision ? (
        <p className="mt-1.5 truncate text-xs text-muted-foreground">{precision}</p>
      ) : null}
    </div>
  );
}

/** Ligne d'offre réutilisée par les favoris, les mentions « j'aime » et les publications. */
function LigneOffre({
  id,
  titre,
  type,
  meta,
  cloturee,
}: {
  id: number;
  titre: string;
  type?: TypeImbrique;
  meta?: string;
  cloturee?: boolean;
}) {
  const style = styleType(type ?? undefined, type?.code);
  const Icone = style.icone;

  return (
    <Link
      href={`/offres/${id}`}
      className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
    >
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-md"
        style={{
          background: `color-mix(in oklch, ${style.teinte} 12%, transparent)`,
          color: style.teinte,
        }}
      >
        <Icone className="size-3.5" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm group-hover:underline",
            cloturee && "text-muted-foreground line-through decoration-1",
          )}
        >
          {titre}
        </span>
        {meta ? (
          <span className="block truncate text-xs text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** Rend une période de CV, avec « aujourd'hui » quand la fin est ouverte. */
function periode(debut: string, fin?: string | null, enCours?: boolean): string {
  const depuis = formatDateShort(debut);
  if (enCours || !fin) return `${depuis} — aujourd'hui`;
  return `${depuis} — ${formatDateShort(fin)}`;
}

function ListeMots({ titre, valeurs }: { titre: string; valeurs?: string[] }) {
  if (!valeurs?.length) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titre}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {valeurs.map((valeur) => (
          <li
            key={valeur}
            className="rounded-md bg-muted px-2 py-0.5 text-xs"
          >
            {valeur}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Vide({ texte }: { texte: string }) {
  return (
    <p className="dashed-frame py-8 text-center text-sm text-muted-foreground">
      {texte}
    </p>
  );
}

export default function AdminUserDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const userId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => adminApi.userById<FicheUtilisateur>(userId),
    enabled: Number.isInteger(userId),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Chargement de la fiche…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={UserRound}
        couleur="var(--chart-2)"
        title="Utilisateur introuvable"
        description="Ce compte a peut-être été supprimé depuis l'ouverture de la liste."
        action={
          <Button
            variant="outline"
            className="rounded-xl"
            render={<Link href="/admin/utilisateurs" />}
          >
            Retour à la liste
          </Button>
        }
      />
    );
  }

  const teinte = TEINTE_ROLE[data.role];
  const localisation = [data.commune, data.departement, data.region, data.pays]
    .filter(Boolean)
    .join(", ");
  const cv = data.cv;
  const engagement = data.engagementStats;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 rounded-lg"
        render={<Link href="/admin/utilisateurs" />}
      >
        <ArrowLeft className="size-4" />
        Utilisateurs
      </Button>

      <header className="entree relative mb-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-20"
          style={{
            background: `linear-gradient(135deg, color-mix(in oklch, ${teinte} 16%, transparent), transparent 70%)`,
          }}
        />

        <div className="relative flex flex-col gap-4 p-5 pt-8 sm:flex-row sm:items-end">
          <Avatar className="size-20 shrink-0 border-4 border-card shadow-sm">
            <AvatarImage src={fileUrl(data.pictureUrl)} alt="" />
            <AvatarFallback
              className="text-2xl font-bold"
              style={{
                background: `color-mix(in oklch, ${teinte} 15%, transparent)`,
                color: teinte,
              }}
            >
              {(data.firstName?.[0] ?? data.username[0] ?? "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 pb-1">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {fullName(data)}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              @{data.username} · {data.email} ·{" "}
              <span className="font-mono">#{data.id}</span>
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <ConsolePastille
                libelle={roleLabel(data.role)}
                teinte={teinte}
                discret={data.role === "MEMBRE"}
              />
              {data.isActive ? (
                <ConsolePastille libelle="Compte actif" teinte="var(--success)" />
              ) : (
                <ConsolePastille libelle="Compte désactivé" discret />
              )}
              {data.isGoogleLogin ? (
                <ConsolePastille libelle="Connexion Google" discret />
              ) : null}
              {data.isEmailVerified === false ? (
                <ConsolePastille
                  libelle="Email non vérifié"
                  teinte="var(--warning)"
                />
              ) : null}
              {cv?.estPublic ? (
                <ConsolePastille libelle="CV public" teinte="var(--chart-3)" />
              ) : null}
            </div>
          </div>

          <dl className="shrink-0 space-y-1 pb-1 text-xs text-muted-foreground sm:text-right">
            <div>
              <dt className="inline">Inscrit le </dt>
              <dd className="inline font-semibold text-foreground">
                {formatDate(data.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="inline">Dernière activité </dt>
              <dd className="inline font-semibold text-foreground">
                {data.derniereActivite
                  ? formatRelative(data.derniereActivite)
                  : "aucune"}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="mb-4 grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Mesure
          label="Offres"
          valeur={data._count?.offres ?? 0}
          icone={Briefcase}
          teinte="var(--chart-3)"
        />
        <Mesure
          label="Retours"
          valeur={data._count?.retours ?? 0}
          icone={Star}
          teinte="var(--chart-4)"
        />
        <Mesure
          label="Favoris"
          valeur={data._count?.favorites ?? 0}
          icone={Heart}
          teinte="var(--chart-5)"
        />
        <Mesure
          label="J'aime"
          valeur={engagement?.likesCount ?? 0}
          icone={ThumbsUp}
          teinte="var(--chart-1)"
        />
        <Mesure
          label="Commentaires"
          valeur={engagement?.commentsCount ?? 0}
          icone={MessageSquare}
          teinte="var(--chart-2)"
        />
        <Mesure
          label="Signalements"
          valeur={engagement?.feedbacksCount ?? 0}
          icone={MessageCircle}
          teinte="var(--chart-5)"
        />
        <Mesure
          label="Alertes"
          valeur={engagement?.alertsCount ?? 0}
          icone={Bell}
          teinte="var(--chart-4)"
        />
        <Mesure
          label="Assistant"
          valeur={data.aiChatStats?.userMessages ?? 0}
          icone={Bot}
          teinte="var(--chart-2)"
          precision={
            data.aiChatStats?.totalConversations
              ? `${data.aiChatStats.totalConversations} conv.`
              : undefined
          }
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panneau titre="Identité et coordonnées" teinte="var(--chart-2)" index={0}>
          <dl className="divide-y">
            <Ligne icone={Mail} label="Email" valeur={data.email} />
            <Ligne icone={Phone} label="Téléphone" valeur={data.telephone} />
            <Ligne
              icone={Cake}
              label="Date de naissance"
              valeur={
                data.dateNaissance ? formatDate(data.dateNaissance) : undefined
              }
            />
            <Ligne label="Sexe" valeur={sexeLabel(data.sexe)} />
            <Ligne
              label="Statut professionnel"
              valeur={statutProfessionnelLabel(data.statutProfessionnel)}
            />
            <Ligne
              icone={Accessibility}
              label="Situation de handicap"
              valeur={data.handicap ? data.typeHandicap || "Renseignée" : "Non"}
            />
          </dl>
        </Panneau>

        <Panneau titre="Localisation" teinte="var(--chart-5)" index={1}>
          {localisation || data.adresse ? (
            <dl className="divide-y">
              <Ligne icone={MapPin} label="Pays" valeur={data.pays} />
              <Ligne label="Région" valeur={data.region} />
              <Ligne label="Département" valeur={data.departement} />
              <Ligne label="Commune" valeur={data.commune} />
              <Ligne label="Adresse" valeur={data.adresse} />
            </dl>
          ) : (
            <Vide texte="Aucune localisation renseignée." />
          )}
        </Panneau>

        <Panneau titre="Compte et accès" teinte="var(--destructive)" index={2}>
          <dl className="divide-y">
            <Ligne label="Identifiant interne" valeur={`#${data.id}`} />
            <Ligne label="Nom d'utilisateur" valeur={data.username} />
            <Ligne label="Rôle" valeur={roleLabel(data.role)} />
            <Ligne
              label="Compte"
              valeur={data.isActive ? "Actif" : "Désactivé"}
            />
            <Ligne
              label="Adresse email"
              valeur={data.isEmailVerified ? "Vérifiée" : "Non vérifiée"}
            />
            <Ligne
              label="Méthode de connexion"
              valeur={data.isGoogleLogin ? "Google" : "Mot de passe"}
            />
            <Ligne label="Inscription" valeur={formatDateTime(data.createdAt)} />
            <Ligne
              label="Dernière modification du profil"
              valeur={data.updatedAt ? formatDateTime(data.updatedAt) : undefined}
            />
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
            <DefinirMotDePasse
              utilisateurId={data.id}
              nomUtilisateur={data.username}
            />
            {data.isGoogleLogin ? (
              <p className="text-xs text-muted-foreground">
                Ce compte se connecte avec Google. Lui définir un mot de passe
                ajoute une seconde manière d&apos;entrer, sans retirer la
                première.
              </p>
            ) : null}
          </div>
        </Panneau>

        <Panneau titre="Échanges" teinte="var(--chart-1)" index={3}>
          <dl className="divide-y">
            <Ligne
              icone={MessagesSquare}
              label="Conversations privées"
              valeur={data.messagingStats?.privateConversations ?? 0}
            />
            <Ligne
              label="Messages envoyés"
              valeur={data.messagingStats?.privateMessagesSent ?? 0}
            />
            <Ligne
              label="Messages reçus"
              valeur={data.messagingStats?.privateMessagesReceived ?? 0}
            />
            <Ligne
              icone={Bot}
              label="Questions à l'assistant"
              valeur={data.aiChatStats?.userMessages ?? 0}
            />
            <Ligne
              label="Réponses de l'assistant"
              valeur={data.aiChatStats?.assistantMessages ?? 0}
            />
            <Ligne
              label="Dernier échange avec l'assistant"
              valeur={
                data.aiChatStats?.lastConversationDate
                  ? formatDateTime(data.aiChatStats.lastConversationDate)
                  : "Jamais"
              }
            />
            <Ligne
              icone={BellRing}
              label="Notifications"
              valeur={
                engagement
                  ? `${engagement.notificationsCount} dont ${engagement.notificationsNonLues} non lue${engagement.notificationsNonLues > 1 ? "s" : ""}`
                  : undefined
              }
            />
          </dl>
        </Panneau>

        <Panneau
          titre="Curriculum vitæ"
          teinte="var(--chart-3)"
          index={4}
          className="lg:col-span-2"
        >
          {!cv ? (
            <Vide texte="Aucun CV renseigné." />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {cv.titreProfessionnel ? (
                    <p className="flex items-center gap-2 text-base font-bold">
                      <FileText
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      {cv.titreProfessionnel}
                    </p>
                  ) : null}
                  {cv.resume ? (
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {cv.resume}
                    </p>
                  ) : null}
                </div>

                {cv.dateModification ? (
                  <p className="shrink-0 text-xs text-muted-foreground">
                    Mis à jour {formatRelative(cv.dateModification)}
                  </p>
                ) : null}
              </div>

              {cv.linkedin || cv.github || cv.siteWeb || cv.ville ? (
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  {cv.ville ? (
                    <li className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" aria-hidden />
                      {[cv.ville, cv.pays].filter(Boolean).join(", ")}
                    </li>
                  ) : null}
                  {[cv.linkedin, cv.github, cv.siteWeb]
                    .filter((lien): lien is string => Boolean(lien))
                    .map((lien) => (
                      <li key={lien}>
                        <a
                          href={lien}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
                        >
                          {lien.replace(/^https?:\/\//, "")}
                        </a>
                      </li>
                    ))}
                </ul>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <ListeMots titre="Compétences" valeurs={cv.competences} />
                <ListeMots titre="Langues" valeurs={cv.langues} />
                <ListeMots titre="Certifications" valeurs={cv.certifications} />
                <ListeMots titre="Centres d'intérêt" valeurs={cv.interets} />
              </div>

              <div className="grid gap-5 border-t pt-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Briefcase className="size-3.5" aria-hidden />
                    Expériences
                  </p>
                  {!cv.experiences?.length ? (
                    <p className="text-sm text-muted-foreground">Aucune.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {cv.experiences.map((experience) => (
                        <li key={experience.id} className="text-sm">
                          <p className="font-semibold">{experience.poste}</p>
                          <p className="text-muted-foreground">
                            {experience.entreprise}
                            {experience.ville ? ` · ${experience.ville}` : ""}
                          </p>
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {periode(
                              experience.dateDebut,
                              experience.dateFin,
                              experience.enCours,
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <GraduationCap className="size-3.5" aria-hidden />
                    Formations
                  </p>
                  {!cv.formations?.length ? (
                    <p className="text-sm text-muted-foreground">Aucune.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {cv.formations.map((formation) => (
                        <li key={formation.id} className="text-sm">
                          <p className="font-semibold">{formation.diplome}</p>
                          <p className="text-muted-foreground">
                            {formation.etablissement}
                            {formation.ville ? ` · ${formation.ville}` : ""}
                          </p>
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {periode(
                              formation.dateDebut,
                              formation.dateFin,
                              formation.enCours,
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {cv.rubriques?.length ? (
                <div className="border-t pt-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Layers className="size-3.5" aria-hidden />
                    Autres rubriques
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {cv.rubriques.map((rubrique) => (
                      <li
                        key={rubrique.titre}
                        className="rounded-md border px-2 py-0.5 text-xs"
                      >
                        {rubrique.titre}
                        <span className="ml-1 text-muted-foreground">
                          ({rubrique.entrees.length})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </Panneau>

        <Panneau
          titre="Favoris"
          teinte="var(--chart-5)"
          compte={data._count?.favorites}
          index={5}
        >
          {!data.favorites?.length ? (
            <Vide texte="Aucune offre mise en favori." />
          ) : (
            <ul className="space-y-0.5">
              {data.favorites.map((favori) => (
                <li key={favori.id}>
                  <LigneOffre
                    id={favori.offre.id}
                    titre={favori.offre.titre}
                    type={favori.offre.typeOffre}
                    cloturee={favori.offre.estCloturee}
                    meta={[
                      favori.offre.entreprise,
                      formatRelative(favori.createdAt),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        <Panneau
          titre="Offres aimées"
          teinte="var(--chart-1)"
          compte={engagement?.likesCount}
          index={6}
        >
          {!data.likes?.length ? (
            <Vide texte="Aucune mention « j'aime »." />
          ) : (
            <ul className="space-y-0.5">
              {data.likes.map((like) => (
                <li key={like.id}>
                  <LigneOffre
                    id={like.offre.id}
                    titre={like.offre.titre}
                    type={like.offre.typeOffre}
                    meta={formatRelative(like.createdAt)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        <Panneau
          titre="Retours d'expérience"
          teinte="var(--chart-4)"
          compte={data._count?.retours}
          index={7}
        >
          {!data.retours?.length ? (
            <Vide texte="Aucun retour publié." />
          ) : (
            <ul className="space-y-3">
              {data.retours.map((retour) => (
                <li
                  key={retour.id}
                  className="border-b pb-3 last:border-0 last:pb-0"
                >
                  {retour.offre ? (
                    <Link
                      href={`/offres/${retour.offre.id}`}
                      className="truncate text-xs font-semibold hover:underline"
                    >
                      {retour.offre.titre}
                    </Link>
                  ) : null}
                  <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {retour.contenu}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {formatRelative(retour.datePublication)}
                    {retour._count?.reponses
                      ? ` · ${retour._count.reponses} réponse${retour._count.reponses > 1 ? "s" : ""}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        <Panneau
          titre="Commentaires"
          teinte="var(--chart-2)"
          compte={engagement?.commentsCount}
          index={8}
        >
          {!data.commentaires?.length ? (
            <Vide texte="Aucun commentaire publié." />
          ) : (
            <ul className="space-y-3">
              {data.commentaires.map((commentaire) => (
                <li
                  key={commentaire.id}
                  className="border-b pb-3 last:border-0 last:pb-0"
                >
                  {commentaire.offre ? (
                    <Link
                      href={`/offres/${commentaire.offre.id}`}
                      className="truncate text-xs font-semibold hover:underline"
                    >
                      {commentaire.offre.titre}
                    </Link>
                  ) : null}
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {commentaire.contenu}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {formatRelative(commentaire.datePublication)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        <Panneau
          titre="Signalements déposés"
          teinte="var(--chart-5)"
          compte={engagement?.feedbacksCount}
          index={9}
        >
          {!data.feedbacks?.length ? (
            <Vide texte="Aucun signalement." />
          ) : (
            <ul className="space-y-2">
              {data.feedbacks.map((signalement) => (
                <li key={signalement.id}>
                  <Link
                    href={`/admin/feedback/${signalement.id}`}
                    className="group block rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <p className="truncate text-sm group-hover:underline">
                      {signalement.titre}
                    </p>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <ConsolePastille
                        libelle={FEEDBACK_STATUS_LABELS[signalement.statut]}
                        teinte={TEINTE_STATUT_SIGNALEMENT[signalement.statut]}
                        discret={!TEINTE_STATUT_SIGNALEMENT[signalement.statut]}
                      />
                      <ConsolePastille
                        libelle={FEEDBACK_PRIORITY_LABELS[signalement.priorite]}
                        teinte={TEINTE_PRIORITE[signalement.priorite]}
                        discret={!TEINTE_PRIORITE[signalement.priorite]}
                      />
                      <span className="text-xs text-muted-foreground">
                        {FEEDBACK_CATEGORY_LABELS[signalement.categorie]} ·{" "}
                        {formatRelative(signalement.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        <Panneau
          titre="Alertes configurées"
          teinte="var(--chart-4)"
          compte={engagement?.alertsCount}
          index={10}
        >
          {!data.alerts?.length ? (
            <Vide texte="Aucune alerte." />
          ) : (
            <ul className="space-y-2.5">
              {data.alerts.map((alerte) => {
                const criteres = Object.entries(alerte.criteria ?? {}).filter(
                  ([, valeur]) =>
                    valeur !== null && valeur !== undefined && valeur !== "",
                );

                return (
                  <li key={alerte.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      {alerte.isActive ? (
                        <ConsolePastille
                          libelle="Active"
                          teinte="var(--success)"
                        />
                      ) : (
                        <ConsolePastille libelle="Suspendue" discret />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {alerte.lastSent
                          ? `Envoyée ${formatRelative(alerte.lastSent)}`
                          : "Jamais envoyée"}
                      </span>
                    </div>

                    {criteres.length === 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Aucun critère : toutes les nouvelles offres.
                      </p>
                    ) : (
                      <dl className="mt-2 flex flex-wrap gap-1.5">
                        {criteres.map(([cle, valeur]) => (
                          <div
                            key={cle}
                            className="rounded-md bg-muted px-2 py-0.5 text-xs"
                          >
                            <dt className="inline text-muted-foreground">
                              {cle} :{" "}
                            </dt>
                            <dd className="inline font-medium">
                              {String(valeur)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panneau>

        <Panneau
          titre="Dernières notifications"
          teinte="var(--chart-1)"
          compte={engagement?.notificationsCount}
          index={11}
        >
          {!data.dernieresNotifications?.length ? (
            <Vide texte="Aucune notification envoyée." />
          ) : (
            <ul className="space-y-2.5">
              {data.dernieresNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className="border-b pb-2.5 last:border-0 last:pb-0"
                >
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {!notification.isRead ? (
                      <span
                        aria-label="Non lue"
                        className="size-1.5 shrink-0 rounded-full bg-primary"
                      />
                    ) : null}
                    <span className="min-w-0 truncate">{notification.title}</span>
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    {formatRelative(notification.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        {data.offres?.length ? (
          <Panneau
            titre="Offres publiées"
            teinte="var(--chart-3)"
            compte={data._count?.offres}
            index={12}
            className="lg:col-span-2"
          >
            <ul className="grid gap-0.5 sm:grid-cols-2">
              {data.offres.map((offre) => (
                <li key={offre.id}>
                  <LigneOffre
                    id={offre.id}
                    titre={offre.titre}
                    type={offre.typeOffre}
                    cloturee={offre.estCloturee}
                    meta={[
                      formatDateShort(offre.datePublication),
                      offre._count?.retours
                        ? `${offre._count.retours} retour${offre._count.retours > 1 ? "s" : ""}`
                        : null,
                      offre._count?.commentaires
                        ? `${offre._count.commentaires} comm.`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                </li>
              ))}
            </ul>
          </Panneau>
        ) : null}
      </div>
    </>
  );
}
