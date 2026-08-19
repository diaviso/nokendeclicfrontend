"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bot,
  Check,
  ChevronDown,
  Compass,
  FileText,
  Heart,
  MapPin,
  MessagesSquare,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OffreCard } from "@/components/shared/offre-card";
import { LandingBackground } from "@/components/landing/landing-background";
import { Counter, Marquee, Reveal, TiltCard } from "@/components/landing/motion";
import { SectionInstallation } from "@/components/landing/section-installation";
import { SectionPartenaires } from "@/components/landing/section-partenaires";
import { useTranslations } from "next-intl";
import { styleType } from "@/lib/type-offre";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Offre, TypeOffreDef } from "@/lib/types";
import type { PartenaireVitrine } from "@/lib/api";

export interface TypeCompte {
  type: TypeOffreDef;
  total: number;
}

/* ------------------------------------------------------------------ Données */

/**
 * Les libellés ne sont plus écrits ici mais lus dans le catalogue de
 * traductions : ces tableaux ne portent plus que ce qui ne se traduit pas —
 * l'icône, la couleur, l'adresse de destination — et la clé du texte.
 */
const ETAPES = [
  { icone: UserPlus, cle: "compte" },
  { icone: Search, cle: "chercher" },
  { icone: Zap, cle: "candidater" },
] as const;

const FONCTIONNALITES = [
  { icone: FileText, cle: "cv", couleur: "var(--chart-2)" },
  { icone: Bot, cle: "assistant", couleur: "var(--chart-5)" },
  { icone: Bell, cle: "alertes", couleur: "var(--chart-4)" },
  { icone: MessagesSquare, cle: "messagerie", couleur: "var(--chart-3)" },
  { icone: Star, cle: "retours", couleur: "var(--chart-1)" },
  { icone: Share2, cle: "partage", couleur: "var(--chart-2)" },
  { icone: Smartphone, cle: "installable", couleur: "var(--chart-3)" },
  { icone: ShieldCheck, cle: "donnees", couleur: "var(--chart-5)" },
] as const;

const PUBLICS = [
  {
    icone: Users,
    cle: "cherche",
    href: "/login?mode=register",
    mise_en_avant: true,
  },
  { icone: TrendingUp, cle: "recrute", href: "/feedback", mise_en_avant: false },
  { icone: Compass, cle: "accompagne", href: "/feedback", mise_en_avant: false },
] as const;

/** Douze pastilles décoratives : les libellés sont dans le catalogue. */
const SECTEURS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

const QUESTIONS = ["1", "2", "3", "4", "5", "6"] as const;

const ANCRAGE = [
  { icone: MapPin, cle: "casamance" },
  { icone: Users, cle: "structures" },
  { icone: ShieldCheck, cle: "relues" },
] as const;

const ATOUTS_MOBILE = [
  { icone: Smartphone, cle: "installation" },
  { icone: Zap, cle: "rapidite" },
  { icone: Bell, cle: "notifications" },
  { icone: MapPin, cle: "proximite" },
] as const;

/* ---------------------------------------------------------------- Fragments */

/** Titre de section : surtitre discret, titre large, phrase d'appui. */
function TitreSection({
  surtitre,
  titre,
  texte,
  centre = true,
}: {
  surtitre: string;
  titre: React.ReactNode;
  texte?: string;
  centre?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", centre && "mx-auto text-center")}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {surtitre}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-bold sm:text-4xl">{titre}</h2>
      {texte ? (
        <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
          {texte}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Visuel du héros : une photographie, surmontée de cartes portant les chiffres
 * réels du catalogue.
 *
 * Les compteurs sont rendus en HTML plutôt qu'incrustés dans l'image : gravés
 * dans le visuel, ils se périmeraient dès la publication suivante et
 * afficheraient un chiffre contredit par le reste de la page.
 */
function VisuelHeros({ comptes }: { comptes: TypeCompte[] }) {
  const t = useTranslations("accueil.heros");

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <TiltCard intensite={5}>
        <div className="relative aspect-square overflow-hidden rounded-3xl border bg-muted/30 shadow-2xl shadow-primary/10">
          {/* Cadrage simple : la photographie ne porte ni texte ni maquette
              d'interface, elle n'a donc pas à être resserrée pour éviter un
              doublon. Le point de cadrage suit le sujet, légèrement à droite
              du centre. */}
          <Image
            src="/illustrations/heros-photo.webp"
            alt={t("photoAlt")}
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 512px"
            className="object-cover"
            /* Cadré à droite du centre : plus à gauche, le sigle Noken de
               l'illustration serait coupé en deux par le bord du cadre. */
            style={{ objectPosition: "76% 42%" }}
          />

          {/* Dégradé bas : assure le contraste des cartes posées par-dessus,
              quelle que soit la zone de l'image qui s'y trouve. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
            style={{
              background:
                "linear-gradient(to top, color-mix(in oklch, var(--background) 88%, transparent), transparent)",
            }}
            aria-hidden
          />
        </div>
      </TiltCard>

      {/* Chiffres du catalogue, en direct. */}
      <div className="absolute inset-x-4 bottom-4 z-10 grid grid-cols-2 gap-2 sm:inset-x-5 sm:bottom-5">
        {comptes.slice(0, 4).map(({ type, total }) => {
          const style = styleType(type);
          const Icone = style.icone;
          return (
            <div
              key={type.id}
              className="flex items-center gap-2.5 rounded-xl border bg-card/85 px-3 py-2.5 shadow-sm backdrop-blur"
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg border",
                  style.badge,
                )}
              >
                <Icone className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold leading-none">
                  {formatNumber(total)}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {type.libelle}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Pastilles flottantes, du côté droit : c'est le seul espace réellement
          libre. À gauche, elles empiéteraient sur la colonne de texte. */}
      <div
        className="anim-float-b absolute left-full top-12 z-10 hidden -translate-x-12 whitespace-nowrap rounded-xl border bg-card px-3 py-2 shadow-lg xl:block"
        style={{ "--dur": "11s" } as React.CSSProperties & Record<string, string>}
      >
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary/10">
            <Bell className="size-3.5 text-primary" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold leading-none">
              {t("pastilleEcheance")}
            </p>
            <p className="mt-1 text-[11px] leading-none text-muted-foreground">
              {t("pastilleEcheanceDetail")}
            </p>
          </div>
        </div>
      </div>

      <div
        className="anim-float-b absolute top-1/2 left-full z-10 hidden -translate-x-16 whitespace-nowrap rounded-xl border bg-card px-3 py-2 shadow-lg xl:block"
        style={
          { "--dur": "14s", "--delay": "1.5s" } as React.CSSProperties &
            Record<string, string>
        }
      >
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-chart-5/10">
            <Bot className="size-3.5" style={{ color: "var(--chart-5)" }} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold leading-none">
              {t("pastilleAssistant")}
            </p>
            <p className="mt-1 text-[11px] leading-none text-muted-foreground">
              {t("pastilleAssistantDetail")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- Landing */

export function Landing({
  offres,
  total,
  comptes,
  partenaires,
}: {
  offres: Offre[];
  total: number;
  comptes: TypeCompte[];
  partenaires: PartenaireVitrine[];
}) {
  const t = useTranslations("accueil");
  const nbTypes = comptes.length;

  return (
    <>
      {/* ─────────────────────────────────────────────────────── Héros */}
      <section className="relative isolate overflow-hidden border-b">
        <LandingBackground />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div className="text-center lg:text-left">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur">
                  <span className="relative flex size-2">
                    <span className="anim-pulse-ring absolute inline-flex size-2 rounded-full border border-primary" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  {t("heros.badge")}
                </span>
              </Reveal>

              <Reveal delay={0.08}>
                <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
                  {t("heros.titreDebut")}{" "}
                  <span className="text-gradient">{t("heros.titreAccent")}</span>
                  <br className="hidden sm:block" /> {t("heros.titreFin")}
                </h1>
              </Reveal>

              <Reveal delay={0.16}>
                <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:mx-0 lg:text-xl">
                  {t("heros.sousTitre")}{" "}
                  {total > 0
                    ? t("heros.compteur", { total: formatNumber(total) })
                    : ""}
                </p>
              </Reveal>

              <Reveal delay={0.24}>
                <form
                  action="/recherche"
                  className="mx-auto mt-8 flex max-w-xl flex-col gap-2.5 sm:flex-row lg:mx-0"
                >
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      name="keyword"
                      placeholder={t("heros.champRecherche")}
                      className="h-13 rounded-xl pl-11 text-base shadow-sm"
                      aria-label={t("heros.libelleRecherche")}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="shine relative h-13 overflow-hidden rounded-xl px-7 text-base"
                  >
                    {t("heros.rechercher")}
                    <ArrowRight className="size-4.5" />
                  </Button>
                </form>
              </Reveal>

              <Reveal delay={0.32}>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <span className="text-sm text-muted-foreground">
                    {t("heros.recherchesFrequentes")}
                  </span>
                  {comptes.slice(0, 4).map(({ type }) => (
                    <Link
                      key={type.id}
                      href={`/recherche?typeOffre=${type.code}`}
                      className="rounded-full border bg-background/70 px-3 py-1 text-sm text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      {type.libelle}
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.2} y={40}>
              <VisuelHeros comptes={comptes} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── Bandeau des secteurs */}
      <section className="border-b bg-muted/25 py-6">
        <Marquee duree="52s">
          {SECTEURS.map((rang) => (
            <span
              key={rang}
              className="whitespace-nowrap rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground"
            >
              {t(`secteurs.${rang}`)}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ─────────────────────────────────────────────────────── Chiffres */}
      <section className="border-b">
        {/* Les séparateurs sont posés par `divide-x` sur la grille elle-même :
            un `gap` coloré laisserait apparaître la couleur de séparation dans
            les marges latérales du conteneur. */}
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 md:grid-cols-3 md:divide-x">
          {[
            {
              valeur: total,
              libelle: t("chiffres.opportunites"),
              texte: t("chiffres.opportunitesTexte"),
            },
            {
              valeur: nbTypes,
              libelle: t("chiffres.types"),
              texte: t("chiffres.typesTexte"),
            },
            {
              valeur: 14,
              libelle: t("chiffres.regions"),
              texte: t("chiffres.regionsTexte"),
            },
          ].map((stat, i) => (
            <Reveal key={stat.libelle} delay={i * 0.08}>
              <div className="px-2 py-10 text-center md:px-6">
                <p className="text-5xl font-extrabold tracking-tight text-foreground">
                  <Counter to={stat.valeur} />
                </p>
                <p className="mt-2 text-base font-semibold">{stat.libelle}</p>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                  {stat.texte}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────── Types d'opportunités */}
      {comptes.length > 0 ? (
        <section className="border-b py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <TitreSection
                surtitre={t("types.surtitre")}
                titre={t("types.titre")}
                texte={t("types.texte")}
              />
            </Reveal>

            {/* Grille auto-adaptative : le nombre de types est décidé par
                l'administrateur. Un nombre fixe de colonnes laisserait une
                rangée orpheline dès qu'un type est ajouté ou retiré. */}
            <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4">
              {comptes.map(({ type, total: nombre }, i) => {
                const style = styleType(type);
                const Icone = style.icone;
                return (
                  <Reveal key={type.id} delay={i * 0.06}>
                    <TiltCard>
                      <Link
                        href={`/recherche?typeOffre=${type.code}`}
                        className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                      >
                        <div
                          className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                          style={{ background: style.chart }}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "relative grid size-12 place-items-center rounded-xl border",
                            style.badge,
                          )}
                        >
                          <Icone className="size-6" aria-hidden />
                        </span>

                        <p className="relative mt-5 text-4xl font-extrabold tracking-tight">
                          <Counter to={nombre} />
                        </p>
                        <h3 className="relative mt-1 text-xl font-bold">
                          {type.libelle}
                        </h3>
                        {type.description ? (
                          <p className="relative mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                            {type.description}
                          </p>
                        ) : null}

                        <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                          {t("types.voirLesOffres")}
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </Link>
                    </TiltCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ────────────────────────────────────────────── Comment ça marche */}
      <section className="relative overflow-hidden border-b bg-muted/25 py-20 sm:py-24">
        <div className="pattern-grid fade-edges pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <TitreSection
              surtitre={t("etapes.surtitre")}
              titre={t("etapes.titre")}
              texte={t("etapes.texte")}
            />
          </Reveal>

          <ol className="relative mt-14 grid gap-8 md:grid-cols-3">
            {/* Fil conducteur entre les étapes, masqué sur mobile où la
                disposition est verticale. */}
            <span
              className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
              aria-hidden
            />

            {ETAPES.map((etape, i) => {
              const Icone = etape.icone;
              return (
                <Reveal key={etape.cle} delay={i * 0.12}>
                  <li className="relative text-center">
                    <span className="relative z-10 mx-auto grid size-14 place-items-center rounded-2xl border bg-background shadow-sm">
                      <Icone className="size-6 text-primary" aria-hidden />
                      <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                    </span>
                    <h3 className="mt-5 text-xl font-bold">
                      {t(`etapes.${etape.cle}Titre`)}
                    </h3>
                    <p className="mx-auto mt-2 max-w-xs text-base leading-relaxed text-muted-foreground">
                      {t(`etapes.${etape.cle}Texte`)}
                    </p>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ───────────────────────────────────────────────── Fonctionnalités */}
      <section className="border-b py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <TitreSection
              surtitre={t("fonctionnalites.surtitre")}
              titre={t("fonctionnalites.titre")}
              texte={t("fonctionnalites.texte")}
            />
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FONCTIONNALITES.map((f, i) => {
              const Icone = f.icone;
              return (
                <Reveal key={f.cle} delay={(i % 4) * 0.06}>
                  <div className="group h-full rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20">
                    <span
                      className="grid size-11 place-items-center rounded-xl transition-transform duration-300 group-hover:-translate-y-0.5"
                      style={{
                        background: `color-mix(in oklch, ${f.couleur} 14%, transparent)`,
                        color: f.couleur,
                      }}
                    >
                      <Icone className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-lg font-bold">
                      {t(`fonctionnalites.${f.cle}Titre`)}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t(`fonctionnalites.${f.cle}Texte`)}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── Assistant IA */}
      <section className="relative overflow-hidden border-b bg-muted/25 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <div>
              <TitreSection
                centre={false}
                surtitre={t("assistant.surtitre")}
                titre={
                  <>
                    {t("assistant.titreDebut")}{" "}
                    <span className="text-gradient">
                      {t("assistant.titreAccent")}
                    </span>
                  </>
                }
                texte={t("assistant.texte")}
              />

              <ul className="mt-7 space-y-3">
                {(["point1", "point2", "point3", "point4"] as const).map((cle) => (
                  <li key={cle} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/12">
                      <Check className="size-3 text-primary" aria-hidden />
                    </span>
                    <span className="text-base text-muted-foreground">
                      {t(`assistant.${cle}`)}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className="mt-8 rounded-xl"
                render={<Link href="/login?next=/assistant" />}
              >
                <Sparkles className="size-4.5" />
                {t("assistant.essayer")}
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.15} y={40}>
            <TiltCard className="mx-auto w-full max-w-md" intensite={6}>
              <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
                <div className="flex items-center gap-2.5 border-b px-4 py-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary/12">
                    <Bot className="size-4 text-primary" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-none">
                      {t("assistant.nom")}
                    </p>
                    <p className="mt-1 text-xs leading-none text-muted-foreground">
                      {t("assistant.enLigne")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
                    {t("assistant.question")}
                  </div>

                  <div className="max-w-[88%] rounded-2xl rounded-bl-sm border bg-background px-3.5 py-2.5 text-sm">
                    <p>{t("assistant.reponse")}</p>
                    <div className="mt-3 space-y-2">
                      {comptes.slice(0, 2).map(({ type }) => {
                        const style = styleType(type);
                        const Icone = style.icone;
                        return (
                          <div
                            key={type.id}
                            className="flex items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2"
                          >
                            <span
                              className={cn(
                                "grid size-7 shrink-0 place-items-center rounded-md border",
                                style.badge,
                              )}
                            >
                              <Icone className="size-3.5" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block h-2 w-4/5 rounded-full bg-muted-foreground/25" />
                              <span className="mt-1.5 block h-2 w-3/5 rounded-full bg-muted-foreground/15" />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Indicateur de frappe */}
                  <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm border bg-background px-3.5 py-3">
                    {[0, 0.2, 0.4].map((d) => (
                      <span
                        key={d}
                        className="anim-drift size-1.5 rounded-full bg-muted-foreground"
                        style={
                          {
                            "--op": 0.35,
                            "--dur": "1.4s",
                            "--delay": `${d}s`,
                            "--dx": "0px",
                            "--dy": "-4px",
                          } as React.CSSProperties & Record<string, string | number>
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* ────────────────────────────────────── Dernières opportunités */}
      {offres.length > 0 ? (
        <section className="border-b py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <TitreSection
                  centre={false}
                  surtitre={t("recentes.surtitre")}
                  titre={t("recentes.titre")}
                  texte={t("recentes.texte")}
                />
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                  render={<Link href="/recherche" />}
                >
                  {t("recentes.toutVoir")}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </Reveal>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offres.map((offre, i) => (
                <Reveal key={offre.id} delay={(i % 3) * 0.07}>
                  <OffreCard
                    offre={offre}
                    href={`/offres/${offre.id}`}
                    className="h-full"
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ──────────────────────────────────── Vitrine des partenaires */}
      <SectionPartenaires partenaires={partenaires} />

      {/* ────────────────────────────────────────────── Ancrage local */}
      <section className="border-b py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal y={36}>
            <figure className="overflow-hidden rounded-3xl border shadow-xl">
              <Image
                src="/illustrations/communaute.webp"
                alt={t("ancrage.photoAlt")}
                width={1536}
                height={1024}
                sizes="(max-width: 1024px) 92vw, 576px"
                className="h-auto w-full"
              />
            </figure>
          </Reveal>

          <Reveal delay={0.12}>
            <div>
              <TitreSection
                centre={false}
                surtitre={t("ancrage.surtitre")}
                titre={
                  <>
                    {t("ancrage.titreDebut")}{" "}
                    <span className="text-gradient">
                      {t("ancrage.titreAccent")}
                    </span>
                  </>
                }
                texte={t("ancrage.texte")}
              />

              <div className="mt-8 space-y-4">
                {ANCRAGE.map((item) => {
                  const Icone = item.icone;
                  return (
                    <div key={item.cle} className="flex items-start gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border bg-card">
                        <Icone className="size-4.5 text-primary" aria-hidden />
                      </span>
                      <div>
                        <p className="text-base font-semibold">
                          {t(`ancrage.${item.cle}Titre`)}
                        </p>
                        <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                          {t(`ancrage.${item.cle}Texte`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────── Mobile et installation */}
      <section className="relative overflow-hidden border-b bg-muted/25 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal y={40}>
            <div className="scene-3d relative mx-auto w-[248px]">
              <div
                className="anim-float-b overflow-hidden rounded-[2rem] border-4 border-foreground/85 bg-card shadow-2xl"
                style={
                  { "--dur": "16s" } as React.CSSProperties & Record<string, string>
                }
              >
                {/* Encoche */}
                <div className="relative h-6 bg-foreground/85">
                  <span className="absolute left-1/2 top-1 h-3.5 w-20 -translate-x-1/2 rounded-full bg-foreground" />
                </div>

                <div className="space-y-3 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">
                      {t("mobile.apercuOffres")}
                    </span>
                    <span className="size-7 rounded-full bg-muted" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border px-2.5 py-2">
                    <Search className="size-3.5 text-muted-foreground" aria-hidden />
                    <span className="h-2 w-20 rounded-full bg-muted-foreground/20" />
                  </div>

                  {comptes.slice(0, 3).map(({ type }) => {
                    const style = styleType(type);
                    const Icone = style.icone;
                    return (
                      <div key={type.id} className="rounded-lg border p-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "grid size-6 place-items-center rounded-md border",
                              style.badge,
                            )}
                          >
                            <Icone className="size-3" aria-hidden />
                          </span>
                          <span className="text-[11px] font-medium">
                            {type.libelle}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-4/5 rounded-full bg-muted-foreground/20" />
                        <div className="mt-1.5 h-2 w-3/5 rounded-full bg-muted-foreground/12" />
                      </div>
                    );
                  })}

                  {/* Barre de navigation basse */}
                  <div className="flex items-center justify-around border-t pt-2.5">
                    {[Search, Heart, Bot, MessagesSquare].map((Icone, i) => (
                      <Icone
                        key={i}
                        className={cn(
                          "size-4",
                          i === 0 ? "text-primary" : "text-muted-foreground/50",
                        )}
                        aria-hidden
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="anim-breathe absolute -inset-8 -z-10 rounded-full"
                style={
                  {
                    background:
                      "radial-gradient(circle, var(--primary) 0%, transparent 68%)",
                    filter: "blur(40px)",
                    "--op": 0.16,
                    "--dur": "8s",
                  } as React.CSSProperties & Record<string, string | number>
                }
              />
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div>
              <TitreSection
                centre={false}
                surtitre={t("mobile.surtitre")}
                titre={
                  <>
                    {t("mobile.titreDebut")}{" "}
                    <span className="text-gradient">
                      {t("mobile.titreAccent")}
                    </span>
                  </>
                }
                texte={t("mobile.texte")}
              />

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {ATOUTS_MOBILE.map((item) => {
                  const Icone = item.icone;
                  return (
                    <div
                      key={item.cle}
                      className="flex items-start gap-3 rounded-xl border bg-card p-4"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10">
                        <Icone className="size-4 text-primary" aria-hidden />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">
                          {t(`mobile.${item.cle}Titre`)}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {t(`mobile.${item.cle}Texte`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────────────────────────────── Bande campagne */}
      <section className="border-b py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal y={32}>
            <figure className="overflow-hidden rounded-3xl border shadow-xl">
              {/* Visuel de campagne. Le texte qu'il porte est repris dans
                  l'attribut `alt` : il est incrusté dans l'image et resterait
                  sinon inaccessible aux lecteurs d'écran comme aux moteurs. */}
              <Image
                src="/illustrations/campagne-noken.webp"
                alt={t("campagneAlt")}
                width={1536}
                height={1024}
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="h-auto w-full"
              />
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────── Pour qui */}
      <section className="border-b py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <TitreSection
              surtitre={t("publics.surtitre")}
              titre={t("publics.titre")}
              texte={t("publics.texte")}
            />
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PUBLICS.map((p, i) => {
              const Icone = p.icone;
              return (
                <Reveal key={p.cle} delay={i * 0.08}>
                  <div
                    className={cn(
                      "relative flex h-full flex-col rounded-2xl border bg-card p-6",
                      p.mise_en_avant && "border-primary/40 shadow-lg shadow-primary/5",
                    )}
                  >
                    {p.mise_en_avant ? (
                      <Badge className="absolute -top-2.5 left-6 h-5 px-2 text-[11px]">
                        {t("publics.leplusCourant")}
                      </Badge>
                    ) : null}

                    <span className="grid size-11 place-items-center rounded-xl bg-primary/10">
                      <Icone className="size-5 text-primary" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-xl font-bold">
                      {t(`publics.${p.cle}Titre`)}
                    </h3>

                    <ul className="mt-4 flex-1 space-y-2.5">
                      {(["P1", "P2", "P3", "P4"] as const).map((rang) => (
                        <li key={rang} className="flex items-start gap-2.5">
                          <Check
                            className="mt-1 size-4 shrink-0 text-primary"
                            aria-hidden
                          />
                          <span className="text-sm text-muted-foreground">
                            {t(`publics.${p.cle}${rang}`)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={p.mise_en_avant ? "default" : "outline"}
                      className="mt-6 w-full rounded-xl"
                      render={<Link href={p.href} />}
                    >
                      {p.cle === "cherche"
                        ? t("publics.chercheCta")
                        : t("publics.contact")}
                    </Button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────── Installation mobile */}
      <SectionInstallation />

      {/* ───────────────────────────────────────────────────────── FAQ */}
      <section className="border-b bg-muted/25 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal>
            <TitreSection
              surtitre={t("faq.surtitre")}
              titre={t("faq.titre")}
            />
          </Reveal>

          <div className="mt-12 space-y-3">
            {QUESTIONS.map((rang, i) => (
              <Reveal key={rang} delay={i * 0.05}>
                {/* `<details>` natif : l'accordéon fonctionne sans JavaScript et
                    reste accessible au clavier et aux lecteurs d'écran. */}
                <details className="group rounded-xl border bg-card px-5 open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-semibold [&::-webkit-details-marker]:hidden">
                    {t(`faq.q${rang}`)}
                    <ChevronDown
                      className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="pb-5 text-base leading-relaxed text-muted-foreground">
                    {t(`faq.r${rang}`)}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────── Appel à l'action */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div
          className="anim-breathe pointer-events-none absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={
            {
              background:
                "radial-gradient(circle, var(--primary) 0%, transparent 66%)",
              filter: "blur(70px)",
              "--op": 0.12,
              "--dur": "10s",
            } as React.CSSProperties & Record<string, string | number>
          }
          aria-hidden
        />
        <div className="pattern-dots fade-edges pointer-events-none absolute inset-0 opacity-60" />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="text-balance text-4xl font-extrabold sm:text-5xl">
              {t("appel.titreDebut")}{" "}
              <span className="text-gradient">{t("appel.titreAccent")}</span>
              {t("appel.titreFin")}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
              {t("appel.texte")}
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="shine relative h-13 w-full overflow-hidden rounded-xl px-8 text-base sm:w-auto"
                render={<Link href="/login?mode=register" />}
              >
                {t("appel.creer")}
                <ArrowRight className="size-4.5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-13 w-full rounded-xl px-8 text-base sm:w-auto"
                render={<Link href="/login" />}
              >
                {t("appel.dejaCompte")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
