"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CalendarDays,
  FileText,
  Heart,
  MessagesSquare,
  Sparkles,
  Star,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { InvitePush } from "@/components/notifications/invite-push";
import { InviteInstallation } from "@/components/pwa/invite-installation";
import { DiaporamaPublicites } from "@/components/dashboard/diaporama-publicites";
import { Button } from "@/components/ui/button";
import { OffreCard } from "@/components/shared/offre-card";
import { OffresGrilleSkeleton } from "@/components/shared/offre-card-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { dashboardApi, offresApi, typesOffresApi } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { styleType } from "@/lib/type-offre";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { completionProfil } from "@/lib/profil";

/** Salutation selon l'heure locale : le tableau de bord s'ouvre sur une adresse, pas sur un titre. */
function salutation(): string {
  const heure = new Date().getHours();
  if (heure < 5 || heure >= 18) return "Bonsoir";
  if (heure < 13) return "Bonjour";
  return "Bon après-midi";
}

const RACCOURCIS = [
  {
    href: "/cv",
    icon: FileText,
    titre: "Mon CV",
    texte: "Créez-le en ligne ou importez un PDF, l'assistant le relit.",
    couleur: "var(--c-blue)",
  },
  {
    href: "/assistant",
    icon: Bot,
    titre: "Assistant carrière",
    texte: "Posez vos questions, obtenez des pistes tirées du catalogue.",
    couleur: "var(--c-violet)",
  },
  {
    href: "/messagerie",
    icon: MessagesSquare,
    titre: "Messagerie",
    texte: "Échangez avec les structures qui publient les offres.",
    couleur: "var(--c-sky)",
  },
];

/** Tuile de mesure, au format de la console : pastille en dégradé, grand chiffre, lien. */
function TuileMesure({
  label,
  valeur,
  icone: Icone,
  teinte,
  href,
  index,
  note,
}: {
  label: string;
  valeur: number;
  icone: LucideIcon;
  teinte: string;
  href: string;
  index: number;
  note: string;
}) {
  return (
    <Link
      href={href}
      style={{ "--i": index } as React.CSSProperties}
      className="entree group relative block overflow-hidden rounded-3xl border bg-card p-5 shadow-sm outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: teinte }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: teinte }}
      />
      <span
        className="relative grid size-11 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${teinte}, color-mix(in oklch, ${teinte} 60%, black))`,
          boxShadow: `0 8px 20px -8px color-mix(in oklch, ${teinte} 80%, transparent)`,
        }}
      >
        <Icone className="size-5" aria-hidden />
      </span>
      <div className="relative mt-4">
        <p className="text-3xl font-extrabold leading-none tracking-tight tabular-nums sm:text-4xl">
          {formatNumber(valeur)}
        </p>
        <p className="mt-1.5 truncate text-sm font-medium text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/80">{note}</p>
      </div>
      <span className="absolute bottom-4 right-4 grid size-7 place-items-center rounded-full bg-background/80 text-muted-foreground shadow-sm ring-1 ring-border backdrop-blur transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground">
        <ArrowRight className="size-3.5" aria-hidden />
      </span>
    </Link>
  );
}

function TuileSquelette() {
  return (
    <div aria-hidden className="rounded-3xl border bg-card p-5">
      <div className="shimmer size-11 rounded-2xl bg-muted" />
      <div className="shimmer mt-4 h-9 w-24 rounded bg-muted" />
      <div className="shimmer mt-2 h-3 w-28 rounded bg-muted" />
    </div>
  );
}

/** Anneau de progression : le pourcentage se lit d'un coup d'œil. */
function Anneau({ valeur }: { valeur: number }) {
  const rayon = 22;
  const perimetre = 2 * Math.PI * rayon;
  return (
    <span className="relative grid size-14 shrink-0 place-items-center">
      <svg
        viewBox="0 0 52 52"
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        <circle
          cx="26"
          cy="26"
          r={rayon}
          fill="none"
          strokeWidth="5"
          className="stroke-muted"
        />
        <circle
          cx="26"
          cy="26"
          r={rayon}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke="var(--c-fuchsia)"
          strokeDasharray={perimetre}
          strokeDashoffset={perimetre * (1 - valeur / 100)}
          className="transition-[stroke-dashoffset] duration-1000"
        />
      </svg>
      <span className="text-xs font-extrabold tabular-nums">{valeur}%</span>
    </span>
  );
}

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
  const aujourdhui = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      {/* ────────────────────────────────────────────── Bandeau d'accueil */}
      <section className="entree relative mb-6 overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-black/5 sm:p-8">
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(125deg, oklch(0.32 0.07 265) 0%, oklch(0.42 0.12 262) 55%, oklch(0.5 0.13 235) 100%)",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(oklch(1 0 0 / 0.25) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            maskImage: "linear-gradient(90deg, transparent 30%, black)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 30%, black)",
          }}
        />
        <span
          aria-hidden
          className="anim-breathe absolute -right-10 -top-20 size-72 rounded-full bg-white blur-3xl"
          style={
            { "--op": 0.1, "--dur": "10s" } as React.CSSProperties &
              Record<string, string | number>
          }
        />
        <span
          aria-hidden
          className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-[var(--c-sky)] opacity-20 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-medium capitalize text-white/80">
              <CalendarDays className="size-4" aria-hidden />
              {aujourdhui}
            </p>
            <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              {salutation()}
              {prenom ? `, ${prenom}` : ""}
            </h1>
            <p className="mt-2 text-pretty text-white/85">
              {stats?.totalOffres ? (
                <>
                  <strong>{formatNumber(stats.totalOffres)}</strong> opportunité
                  {stats.totalOffres > 1
                    ? "s vous attendent"
                    : " vous attend"}{" "}
                  sur la plateforme. Voici votre activité.
                </>
              ) : (
                <>
                  Voici votre activité et les dernières opportunités publiées.
                </>
              )}
            </p>
            <p className="mt-4 inline-block rounded-2xl bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-inset ring-white/15 backdrop-blur">
              Plateforme Noken développée par{" "}
              <a
                href="https://www.declicsud.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:underline"
              >
                DECLIC
              </a>{" "}
              et soutenue par la{" "}
              <a
                href="https://www.giz.de"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:underline"
              >
                GIZ
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/assistant"
              className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-semibold ring-1 ring-inset ring-white/25 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/25"
            >
              <Sparkles className="size-4" aria-hidden />
              Assistant
            </Link>
            <Link
              href="/cv"
              className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-semibold ring-1 ring-inset ring-white/25 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/25"
            >
              <FileText className="size-4" aria-hidden />
              Mon CV
            </Link>
            <Link
              href="/recherche"
              className="shine relative flex items-center gap-2 overflow-hidden rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-[oklch(0.38_0.1_262)] shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Briefcase className="size-4" aria-hidden />
              Explorer les offres
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────── Installation, puis notifications ────── */}
      {/* Cet ordre n'est pas cosmétique : sur iPhone, la seconde dépend de la
          première. */}
      <InviteInstallation />
      <InvitePush />

      {/* ─────────────────────────────────────── Annonces des partenaires */}
      <DiaporamaPublicites className="mb-6" />

      {/* ───────────────────────────────────────── Complétion du profil */}
      {completion < 100 ? (
        <section
          className="entree relative mb-6 overflow-hidden rounded-3xl border bg-card shadow-sm"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(115deg, color-mix(in oklch, var(--c-fuchsia) 12%, transparent) 0%, transparent 60%)",
            }}
          />
          <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Anneau valeur={completion} />
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <UserCircle
                    className="size-5 text-[var(--c-fuchsia)]"
                    aria-hidden
                  />
                  Votre profil est complété à {completion} %
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Un profil complet permet à l&apos;assistant de vous proposer
                  des offres réellement adaptées.
                </p>
              </div>
            </div>
            <Button
              className="shrink-0 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--c-fuchsia), color-mix(in oklch, var(--c-fuchsia) 60%, black))",
                color: "white",
              }}
              render={<Link href="/profil" />}
            >
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
            <TuileSquelette />
            <TuileSquelette />
            <TuileSquelette />
          </>
        ) : (
          <>
            <TuileMesure
              index={0}
              label="Opportunités publiées"
              valeur={stats?.totalOffres ?? 0}
              icone={Briefcase}
              teinte="var(--c-emerald)"
              href="/recherche"
              note="Tout le catalogue"
            />
            <TuileMesure
              index={1}
              label="Mes favoris"
              valeur={stats?.totalFavorites ?? 0}
              icone={Heart}
              teinte="var(--c-rose)"
              href="/favoris"
              note="Offres gardées de côté"
            />
            <TuileMesure
              index={2}
              label="Mes retours"
              valeur={stats?.totalRetours ?? 0}
              icone={Star}
              teinte="var(--c-amber)"
              href="/retours"
              note="Avis laissés sur les offres"
            />
          </>
        )}
      </section>

      {/* ──────────────────────────────────────── Parcourir par catégorie */}
      {types.length ? (
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2.5">
            <span
              aria-hidden
              className="h-5 w-1 rounded-full bg-[var(--c-emerald)]"
            />
            <h2 className="text-lg font-bold">Parcourir par catégorie</h2>
          </div>
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
                  className="entree group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ "--i": index } as React.CSSProperties}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
                    style={{ background: style.teinte }}
                  />
                  <span
                    className="relative grid size-11 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${style.teinte}, color-mix(in oklch, ${style.teinte} 60%, black))`,
                      boxShadow: `0 8px 18px -8px color-mix(in oklch, ${style.teinte} 80%, transparent)`,
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
            className="entree group relative flex items-start gap-3.5 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            style={{ "--i": index } as React.CSSProperties}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: `linear-gradient(115deg, color-mix(in oklch, ${item.couleur} 10%, transparent), transparent 70%)`,
              }}
            />
            <span
              className="relative grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
              style={{
                background: `color-mix(in oklch, ${item.couleur} 14%, transparent)`,
                color: item.couleur,
              }}
            >
              <item.icon className="size-5" aria-hidden />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-base font-bold">{item.titre}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                {item.texte}
              </span>
            </span>
            <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
          </Link>
        ))}
      </section>

      {/* ────────────────────────────────────────── Dernières opportunités */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-1 h-5 w-1 rounded-full bg-[var(--c-indigo)]"
            />
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Dernières opportunités
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Publiées récemment sur la plateforme
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl"
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
