"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Accessibility,
  Activity,
  ArrowLeft,
  Ban,
  Bell,
  BellRing,
  Bot,
  Briefcase,
  Cake,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  GraduationCap,
  Heart,
  KeyRound,
  Layers,
  LayoutGrid,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Phone,
  ShieldCheck,
  Star,
  ThumbsUp,
  UserCog,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConsolePastille } from "@/components/admin/console-ui";
import {
  ConsoleChiffre,
  ConsolePanneau,
  useConfirmation,
} from "@/components/admin/console-kit";
import { DefinirMotDePasse } from "@/components/admin/definir-mot-de-passe";
import { adminApi, errorMessage, fileUrl } from "@/lib/api";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_STATUS_LABELS,
  ROLE_LABELS,
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
  ADMIN: "var(--c-rose)",
  PARTENAIRE: "var(--c-orange)",
  MEMBRE: "var(--c-blue)",
};

const TEINTE_STATUT_SIGNALEMENT: Record<FeedbackStatus, string | undefined> = {
  OUVERT: "var(--c-sky)",
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
  teinte = "var(--primary)",
  icone,
  compte,
  index = 0,
  className,
  children,
}: {
  titre: string;
  teinte?: string;
  icone?: typeof Mail;
  /** Total réel, quand la liste affichée n'en montre qu'un extrait. */
  compte?: number;
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ "--i": index } as React.CSSProperties}
      className={cn("entree", className)}
    >
      <ConsolePanneau
        titre={titre}
        icone={icone}
        teinte={teinte}
        className="h-full"
        actions={
          compte !== undefined && compte > 0 ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {compte}
            </span>
          ) : undefined
        }
      >
        {children}
      </ConsolePanneau>
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

/** Onglet avec compteur facultatif. */
function Onglet({
  valeur,
  icone: Icone,
  libelle,
  compte,
}: {
  valeur: string;
  icone: typeof Mail;
  libelle: string;
  compte?: number;
}) {
  return (
    <TabsTrigger
      value={valeur}
      className="h-9 flex-none gap-2 rounded-lg px-3.5 data-active:shadow-sm"
    >
      <Icone className="size-4" aria-hidden />
      {libelle}
      {compte ? (
        <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold tabular-nums text-muted-foreground">
          {compte}
        </span>
      ) : null}
    </TabsTrigger>
  );
}

export default function AdminUserDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const userId = Number(id);
  const queryClient = useQueryClient();
  const confirmer = useConfirmation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => adminApi.userById<FicheUtilisateur>(userId),
    enabled: Number.isInteger(userId),
  });

  const rafraichir = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const changerRole = useMutation({
    mutationFn: (role: Role) => adminApi.setUserRole(userId, role),
    onSuccess: async () => {
      await rafraichir();
      toast.success("Rôle modifié");
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  const basculerActif = useMutation({
    mutationFn: (isActive: boolean) => adminApi.toggleUserActive(userId, isActive),
    onSuccess: async (_donnees, isActive) => {
      await rafraichir();
      toast.success(isActive ? "Compte réactivé" : "Compte désactivé");
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-44 rounded-3xl bg-muted" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="shimmer h-20 rounded-2xl bg-muted" />
          ))}
        </div>
        <span className="sr-only">Chargement de la fiche…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={UserRound}
        couleur="var(--c-blue)"
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

  const desactiver = async () => {
    if (
      data.isActive &&
      !(await confirmer({
        titre: `Désactiver le compte de ${fullName(data)} ?`,
        message:
          "La personne ne pourra plus se connecter. Ses données sont conservées et le compte peut être réactivé à tout moment.",
        confirmer: "Désactiver",
        danger: true,
      }))
    ) {
      return;
    }
    basculerActif.mutate(!data.isActive);
  };

  const activite =
    (data._count?.favorites ?? 0) +
    (engagement?.likesCount ?? 0) +
    (data._count?.retours ?? 0) +
    (engagement?.commentsCount ?? 0) +
    (data._count?.offres ?? 0);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 rounded-lg text-muted-foreground"
        render={<Link href="/admin/utilisateurs" />}
      >
        <ArrowLeft className="size-4" />
        Utilisateurs
      </Button>

      {/* En-tête de profil */}
      <header className="entree relative mb-5 overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div
          aria-hidden
          className="relative h-28 sm:h-32"
          style={{
            background: `linear-gradient(120deg, color-mix(in oklch, ${teinte} 22%, var(--card)), color-mix(in oklch, ${teinte} 6%, var(--card)) 60%, var(--card))`,
          }}
        >
          <span
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `radial-gradient(color-mix(in oklch, ${teinte} 30%, transparent) 1px, transparent 1px)`,
              backgroundSize: "18px 18px",
              maskImage: "linear-gradient(90deg, transparent, black)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, black)",
            }}
          />
        </div>

        <div className="relative -mt-14 flex flex-col gap-5 px-5 pb-5 sm:px-6 lg:flex-row lg:items-end">
          <div className="relative w-fit">
            <Avatar className="size-24 shrink-0 border-4 border-card shadow-md sm:size-28">
              <AvatarImage src={fileUrl(data.pictureUrl)} alt="" />
              <AvatarFallback
                className="text-3xl font-bold"
                style={{
                  background: `color-mix(in oklch, ${teinte} 15%, var(--card))`,
                  color: teinte,
                }}
              >
                {(data.firstName?.[0] ?? data.username[0] ?? "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              aria-label={data.isActive ? "Compte actif" : "Compte désactivé"}
              className={cn(
                "absolute bottom-2 right-2 size-4 rounded-full ring-4 ring-card",
                data.isActive ? "bg-[var(--success)]" : "bg-muted-foreground",
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
              {fullName(data)}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>@{data.username}</span>
              <a
                href={`mailto:${data.email}`}
                className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
              >
                <Mail className="size-3.5" aria-hidden />
                {data.email}
              </a>
              {data.telephone ? (
                <a
                  href={`tel:${data.telephone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                >
                  <Phone className="size-3.5" aria-hidden />
                  {data.telephone}
                </a>
              ) : null}
              <span className="font-mono text-xs">#{data.id}</span>
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
                <ConsolePastille libelle="Email non vérifié" teinte="var(--warning)" />
              ) : null}
              {cv?.estPublic ? (
                <ConsolePastille libelle="CV public" teinte="var(--c-emerald)" />
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                render={<a href={`mailto:${data.email}`} />}
              >
                <Mail className="size-4" />
                Écrire
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={changerRole.isPending}
                    >
                      {changerRole.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <UserCog className="size-4" />
                      )}
                      Rôle
                      <ChevronDown className="size-3.5 opacity-60" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs">Changer le rôle</DropdownMenuLabel>
                    {(Object.keys(ROLE_LABELS) as Role[]).map((valeur) => (
                      <DropdownMenuItem
                        key={valeur}
                        disabled={data.role === valeur || changerRole.isPending}
                        onClick={() => changerRole.mutate(valeur)}
                      >
                        <span
                          aria-hidden
                          className="size-2 rounded-full"
                          style={{ background: TEINTE_ROLE[valeur] }}
                        />
                        {ROLE_LABELS[valeur]}
                        {data.role === valeur ? (
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            actuel
                          </span>
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DefinirMotDePasse utilisateurId={data.id} nomUtilisateur={data.username} />

              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-lg",
                  data.isActive
                    ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                    : "text-[var(--success)]",
                )}
                disabled={basculerActif.isPending}
                onClick={desactiver}
              >
                {basculerActif.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : data.isActive ? (
                  <Ban className="size-4" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {data.isActive ? "Désactiver" : "Réactiver"}
              </Button>
            </div>

            <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground lg:justify-end">
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden />
                <dt>Inscrit le</dt>
                <dd className="font-semibold text-foreground">{formatDate(data.createdAt)}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="size-3.5" aria-hidden />
                <dt>Dernière activité</dt>
                <dd className="font-semibold text-foreground">
                  {data.derniereActivite ? formatRelative(data.derniereActivite) : "aucune"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {/* Chiffres clés */}
      <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
        <ConsoleChiffre
          libelle="Offres publiées"
          valeur={data._count?.offres ?? 0}
          icone={Briefcase}
          teinte="var(--c-emerald)"
        />
        <ConsoleChiffre
          libelle="Retours"
          valeur={data._count?.retours ?? 0}
          icone={Star}
          teinte="var(--c-orange)"
        />
        <ConsoleChiffre
          libelle="Favoris"
          valeur={data._count?.favorites ?? 0}
          icone={Heart}
          teinte="var(--c-rose)"
        />
        <ConsoleChiffre
          libelle="J'aime"
          valeur={engagement?.likesCount ?? 0}
          icone={ThumbsUp}
          teinte="var(--c-sky)"
        />
        <ConsoleChiffre
          libelle="Commentaires"
          valeur={engagement?.commentsCount ?? 0}
          icone={MessageSquare}
          teinte="var(--c-indigo)"
        />
        <ConsoleChiffre
          libelle="Signalements"
          valeur={engagement?.feedbacksCount ?? 0}
          icone={MessageCircle}
          teinte="var(--c-rose)"
        />
        <ConsoleChiffre
          libelle="Alertes"
          valeur={engagement?.alertsCount ?? 0}
          icone={Bell}
          teinte="var(--c-amber)"
        />
        <ConsoleChiffre
          libelle="Questions à l'assistant"
          valeur={data.aiChatStats?.userMessages ?? 0}
          icone={Bot}
          teinte="var(--c-teal)"
          note={
            data.aiChatStats?.totalConversations
              ? `${data.aiChatStats.totalConversations} conversation${data.aiChatStats.totalConversations > 1 ? "s" : ""}`
              : undefined
          }
        />
      </section>

      <Tabs defaultValue="profil" className="gap-4">
        <TabsList className="no-scrollbar h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border bg-card p-1 shadow-sm">
          <Onglet valeur="profil" icone={LayoutGrid} libelle="Profil" />
          <Onglet valeur="cv" icone={FileText} libelle="CV" />
          <Onglet valeur="activite" icone={Activity} libelle="Activité" compte={activite} />
          <Onglet
            valeur="suivi"
            icone={ShieldCheck}
            libelle="Signalements et alertes"
            compte={(engagement?.feedbacksCount ?? 0) + (engagement?.alertsCount ?? 0)}
          />
        </TabsList>

        {/* ----------------------------------------------------- Profil */}
        <TabsContent value="profil" className="grid gap-4 lg:grid-cols-2">
        <Panneau titre="Identité et coordonnées" icone={UserRound} teinte="var(--c-blue)" index={0}>
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

        <Panneau titre="Localisation" icone={MapPin} teinte="var(--c-teal)" index={1}>
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

        <Panneau titre="Compte et accès" icone={KeyRound} teinte="var(--c-rose)" index={2}>
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

        <Panneau titre="Échanges" icone={MessagesSquare} teinte="var(--c-indigo)" index={3}>
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
        </TabsContent>

        {/* --------------------------------------------------------- CV */}
        <TabsContent value="cv">
        <Panneau
          titre="Curriculum vitæ"
          icone={FileText}
          teinte="var(--c-emerald)"
          index={4}
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
        </TabsContent>

        {/* --------------------------------------------------- Activité */}
        <TabsContent value="activite" className="grid gap-4 lg:grid-cols-2">
        <Panneau
          titre="Favoris"
          icone={Heart}
          teinte="var(--c-rose)"
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
          icone={ThumbsUp}
          teinte="var(--c-sky)"
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
          icone={Star}
          teinte="var(--c-orange)"
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
          icone={MessageSquare}
          teinte="var(--c-indigo)"
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

        {data.offres?.length ? (
          <Panneau
            titre="Offres publiées"
            icone={Briefcase}
            teinte="var(--c-emerald)"
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
        </TabsContent>

        {/* ------------------------------------ Signalements et alertes */}
        <TabsContent value="suivi" className="grid gap-4 lg:grid-cols-2">
        <Panneau
          titre="Signalements déposés"
          icone={MessageCircle}
          teinte="var(--c-rose)"
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
          icone={Bell}
          teinte="var(--c-amber)"
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
          icone={BellRing}
          teinte="var(--c-indigo)"
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

        </TabsContent>
      </Tabs>
    </>
  );
}
