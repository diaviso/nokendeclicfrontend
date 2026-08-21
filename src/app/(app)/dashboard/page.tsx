"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  Briefcase,
  FileText,
  Heart,
  MessagesSquare,
  Sparkles,
  Star,
  UserCircle,
} from "lucide-react";
import { InvitePush } from "@/components/notifications/invite-push";
import { InviteInstallation } from "@/components/pwa/invite-installation";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card";
import { OffreCard } from "@/components/shared/offre-card";
import { OffresGrilleSkeleton } from "@/components/shared/offre-card-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { dashboardApi, offresApi, typesOffresApi } from "@/lib/api";
import { styleType } from "@/lib/type-offre";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

/** Champs qui rendent un profil exploitable pour les recommandations. */
const CHAMPS_PROFIL: (keyof User)[] = [
  "firstName",
  "lastName",
  "telephone",
  "dateNaissance",
  "sexe",
  "region",
  "departement",
  "commune",
  "statutProfessionnel",
];

function completionProfil(user: User | null): number {
  if (!user) return 0;
  const remplis = CHAMPS_PROFIL.filter((champ) => {
    const valeur = user[champ];
    return (
      valeur !== null &&
      valeur !== undefined &&
      valeur !== "" &&
      valeur !== "NON_PRECISE"
    );
  }).length;
  return Math.round((remplis / CHAMPS_PROFIL.length) * 100);
}

/** Salutation selon l'heure locale : le tableau de bord s'ouvre sur une adresse, pas sur un titre. */
function salutation(): string {
  const heure = new Date().getHours();
  if (heure < 12) return "Bonjour";
  if (heure < 18) return "Bon après-midi";
  return "Bonsoir";
}

const RACCOURCIS = [
  {
    href: "/cv",
    icon: FileText,
    titre: "Mon CV",
    texte: "Créez-le en ligne ou importez un PDF, l'assistant le relit.",
    couleur: "var(--chart-2)",
  },
  {
    href: "/assistant",
    icon: Bot,
    titre: "Assistant carrière",
    texte: "Posez vos questions, obtenez des pistes tirées du catalogue.",
    couleur: "var(--chart-5)",
  },
  {
    href: "/messagerie",
    icon: MessagesSquare,
    titre: "Messagerie",
    texte: "Échangez avec les structures qui publient les offres.",
    couleur: "var(--chart-3)",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardApi.stats,
  });

  const { data: recentes, isLoading: recentesLoading } = useQuery({
    queryKey: ["offres", "recent"],
    queryFn: () => offresApi.list({ limit: 6 }),
  });

  const { data: types = [] } = useQuery({
    queryKey: ["types-offres"],
    queryFn: () => typesOffresApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const completion = completionProfil(user);
  const prenom = user?.firstName ?? user?.username ?? "";

  return (
    <>
      {/* ────────────────────────────────────────────── Bandeau d'accueil */}
      <section className="entree relative mb-6 overflow-hidden rounded-3xl border">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, color-mix(in oklch, var(--primary) 14%, transparent) 0%, color-mix(in oklch, var(--chart-3) 10%, transparent) 55%, transparent 100%)",
          }}
          aria-hidden
        />
        <span
          aria-hidden
          className="anim-breathe pointer-events-none absolute -right-16 -top-24 size-72 rounded-full blur-3xl"
          style={
            {
              background: "var(--primary)",
              "--op": 0.12,
              "--dur": "10s",
            } as React.CSSProperties & Record<string, string | number>
          }
        />
        <div className="pattern-dots fade-edges absolute inset-0 opacity-50" aria-hidden />

        <div className="relative flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Votre espace
            </p>
            <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              {salutation()}
              {prenom ? (
                <>
                  {" "}
                  <span className="text-gradient">{prenom}</span>
                </>
              ) : null}
            </h1>
            <p className="mt-2 max-w-lg text-base text-muted-foreground">
              Voici votre activité et les dernières opportunités publiées.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              className="shine relative overflow-hidden rounded-xl"
              render={<Link href="/recherche" />}
            >
              <Briefcase className="size-4.5" />
              Explorer les offres
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl bg-background/70 backdrop-blur"
              render={<Link href="/assistant" />}
            >
              <Sparkles className="size-4.5" />
              Assistant
            </Button>
          </div>
        </div>
      </section>

      {/* ──────────────────────── Installation, puis notifications ────── */}
      {/* Cet ordre n'est pas cosmétique : sur iPhone, la seconde dépend de la
          première. */}
      <InviteInstallation />
      <InvitePush />

      {/* ───────────────────────────────────────── Complétion du profil */}
      {completion < 100 ? (
        <section
          className="entree mb-6 overflow-hidden rounded-2xl border bg-card"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          {/* La barre est en tête du bloc, sur toute sa largeur : c'est
              l'information que l'on cherche du regard, et elle sert de repère
              avant même la lecture du texte. */}
          <div className="h-1.5 w-full bg-muted">
            <div
              className="h-full rounded-r-full transition-[width] duration-700"
              style={{
                width: `${completion}%`,
                background:
                  "linear-gradient(90deg, var(--primary), oklch(0.72 0.17 200))",
              }}
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Complétion du profil"
            />
          </div>

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
                <UserCircle className="size-5 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold">
                  Votre profil est complété à {completion} %
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Un profil complet permet à l&apos;assistant de vous proposer
                  des offres réellement adaptées.
                </p>
              </div>
            </div>

            <Button className="shrink-0 rounded-xl" render={<Link href="/profil" />}>
              Compléter
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {/* ───────────────────────────────────────────────── Statistiques */}
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Opportunités publiées"
              value={stats?.totalOffres ?? 0}
              icon={Briefcase}
              couleur="var(--chart-2)"
              href="/recherche"
              className="entree"
            />
            <StatCard
              label="Mes favoris"
              value={stats?.totalFavorites ?? 0}
              icon={Heart}
              couleur="var(--chart-4)"
              href="/favoris"
              className="entree [--i:1]"
            />
            <StatCard
              label="Mes retours"
              value={stats?.totalRetours ?? 0}
              icon={Star}
              couleur="var(--chart-3)"
              href="/retours"
              className="entree [--i:2]"
            />
          </>
        )}
      </section>

      {/* ──────────────────────────────────────── Parcourir par catégorie */}
      {types.length ? (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold">Parcourir par catégorie</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {types.map((type, index) => {
              const style = styleType(type);
              const Icone = style.icone;
              // Le décompte vient des statistiques déjà chargées pour les
              // tuiles du haut : aucune requête supplémentaire.
              const nombre = stats?.offresByType?.[type.code] ?? 0;
              return (
                <Link
                  key={type.id}
                  href={`/recherche?typeOffre=${type.code}`}
                  className="entree group relative overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
                    style={{ background: style.teinte }}
                  />
                  <span
                    className="relative grid size-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `color-mix(in oklch, ${style.teinte} 14%, transparent)`,
                      color: style.teinte,
                    }}
                  >
                    <Icone className="size-5" aria-hidden />
                  </span>
                  <p className="relative mt-3 truncate text-sm font-bold">
                    {type.libelle}
                  </p>
                  <p className="relative mt-0.5 text-sm tabular-nums text-muted-foreground">
                    {nombre} offre{nombre > 1 ? "s" : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ────────────────────────────────────────────────── Raccourcis */}
      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        {RACCOURCIS.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className="entree group relative flex items-start gap-3.5 overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            style={{ "--i": index } as React.CSSProperties}
          >
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
              style={{
                background: `color-mix(in oklch, ${item.couleur} 14%, transparent)`,
                color: item.couleur,
              }}
            >
              <item.icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold">{item.titre}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                {item.texte}
              </span>
            </span>
            <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </section>

      {/* ────────────────────────────────────────── Dernières opportunités */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Dernières opportunités
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Publiées récemment sur la plateforme
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-lg"
            render={<Link href="/recherche" />}
          >
            Tout voir
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {recentesLoading ? (
          <OffresGrilleSkeleton nombre={6} />
        ) : !recentes?.data.length ? (
          <EmptyState
            icon={Briefcase}
            title="Aucune opportunité pour le moment"
            description="De nouvelles offres sont publiées régulièrement. Revenez bientôt, ou activez les alertes depuis votre profil."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentes.data.map((offre, index) => (
              <OffreCard
                key={offre.id}
                offre={offre}
                href={`/offres/${offre.id}`}
                className={cn("entree")}
                style={{ "--i": index % 3 } as React.CSSProperties}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
