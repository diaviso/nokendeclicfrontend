"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ChevronLeft, ChevronRight, Megaphone, X } from "lucide-react";
import { fileUrl, publicitesApi, type Publicite } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Durée d'affichage d'une diapo, en millisecondes. */
const DUREE = 7000;
const CLE_MASQUE = "noken-publicites-masquees";
const CLE_VUES = "noken-publicites-vues";

/** Couleurs proposées aux annonces : la palette sobre de la plateforme. */
export const TEINTES_PUBLICITE = [
  { cle: "bleu", libelle: "Bleu", couleur: "var(--c-blue)" },
  { cle: "indigo", libelle: "Indigo", couleur: "var(--c-indigo)" },
  { cle: "emeraude", libelle: "Émeraude", couleur: "var(--c-emerald)" },
  { cle: "sarcelle", libelle: "Sarcelle", couleur: "var(--c-teal)" },
  { cle: "ambre", libelle: "Ambre", couleur: "var(--c-amber)" },
  { cle: "orange", libelle: "Orange", couleur: "var(--c-orange)" },
  { cle: "rose", libelle: "Rose", couleur: "var(--c-rose)" },
  { cle: "ardoise", libelle: "Ardoise", couleur: "oklch(0.5 0.03 255)" },
] as const;

export function teintePublicite(cle?: string | null): string {
  return (
    TEINTES_PUBLICITE.find((teinte) => teinte.cle === cle)?.couleur ??
    TEINTES_PUBLICITE[0].couleur
  );
}

const estExterne = (lien: string) => /^https?:\/\//i.test(lien);

/* ------------------------------------------------- Préférences du système */

function useMouvementReduit() {
  return useSyncExternalStore(
    (rappel) => {
      const requete = window.matchMedia("(prefers-reduced-motion: reduce)");
      requete.addEventListener("change", rappel);
      return () => requete.removeEventListener("change", rappel);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function usePageVisible() {
  return useSyncExternalStore(
    (rappel) => {
      document.addEventListener("visibilitychange", rappel);
      return () => document.removeEventListener("visibilitychange", rappel);
    },
    () => document.visibilityState === "visible",
    () => true,
  );
}

function lireSession(cle: string): string | null {
  try {
    return window.sessionStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrireSession(cle: string, valeur: string) {
  try {
    window.sessionStorage.setItem(cle, valeur);
  } catch {
    // Navigation privée ou stockage bloqué : la préférence ne durera pas.
  }
}

/** Une vue par annonce et par session : recharger la page ne gonfle pas les chiffres. */
function noterVue(id: number) {
  const vues = new Set((lireSession(CLE_VUES) ?? "").split(",").filter(Boolean));
  if (vues.has(String(id))) return;
  vues.add(String(id));
  ecrireSession(CLE_VUES, [...vues].join(","));
  publicitesApi.compterVue(id);
}

/* ------------------------------------------------------------------ Diapo */

/**
 * Une annonce. Le texte à gauche sur un lavis de sa teinte, le visuel à
 * droite fondu dans la carte ; sur téléphone, le visuel passe au-dessus.
 */
export function DiapoPublicite({
  annonce,
  active = true,
  basReserve = false,
  onClic,
}: {
  annonce: Publicite;
  active?: boolean;
  /** Laisse la place des commandes du diaporama sous le texte. */
  basReserve?: boolean;
  onClic?: () => void;
}) {
  const couleur = teintePublicite(annonce.teinte);
  // Un fichier choisi dans la console (aperçu) est déjà une adresse locale.
  const image = annonce.imageUrl?.startsWith("blob:")
    ? annonce.imageUrl
    : fileUrl(annonce.imageUrl);
  const lien = annonce.lien?.trim();
  const lienRef = useRef<HTMLAnchorElement>(null);

  const titre = lien ? (
    estExterne(lien) ? (
      <a
        href={lien}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={onClic}
        tabIndex={active ? undefined : -1}
        ref={lienRef as React.Ref<HTMLAnchorElement>}
        className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {annonce.titre}
      </a>
    ) : (
      <Link
        href={lien}
        onClick={onClic}
        tabIndex={active ? undefined : -1}
        ref={lienRef as React.Ref<HTMLAnchorElement>}
        className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {annonce.titre}
      </Link>
    )
  ) : (
    annonce.titre
  );

  return (
    <article
      className={cn(
        "group/diapo relative grid h-full min-h-[11rem] overflow-hidden sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]",
        lien && "cursor-pointer",
      )}
      // Toute la carte mène à l'annonce ; le titre reste le vrai lien, seul
      // élément atteint au clavier.
      onClick={(e) => {
        if (!lien || (e.target as HTMLElement).closest("a, button")) return;
        lienRef.current?.click();
      }}
    >
      {/* Lavis et trame : la teinte de l'annonce, sans jamais crier. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(110deg, color-mix(in oklch, ${couleur} 13%, var(--card)) 0%, color-mix(in oklch, ${couleur} 5%, var(--card)) 50%, var(--card) 100%)`,
        }}
      />
      <span
        aria-hidden
        className="pattern-dots fade-edges pointer-events-none absolute inset-0 opacity-40"
      />

      {/* Visuel. `z-[1]` : dans une grille, l'ordre de peinture suit `order` ;
          remonté en tête sur téléphone, il passait sous le lavis. */}
      <div
        aria-hidden
        className={cn(
          "relative z-[1] order-first overflow-hidden sm:order-last",
          image ? "h-32 sm:h-auto" : "hidden sm:block",
        )}
      >
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            // Aperçu de la console : fichier local, rien à optimiser.
            unoptimized={image.startsWith("blob:")}
            className={cn(
              "object-cover transition-transform duration-[7000ms] ease-out",
              "[mask-image:linear-gradient(to_bottom,black_55%,transparent)] sm:[mask-image:linear-gradient(to_right,transparent,black_38%)]",
              active ? "scale-100" : "scale-[1.06]",
            )}
          />
        ) : (
          <>
            <span
              className="absolute -right-10 top-1/2 size-56 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
              style={{ background: couleur }}
            />
            <span
              className="absolute right-10 top-1/2 grid size-24 -translate-y-1/2 place-items-center rounded-[2rem] border bg-card/60 shadow-sm backdrop-blur transition-transform duration-500 group-hover/diapo:rotate-[-4deg] group-hover/diapo:scale-105"
              style={{ color: couleur }}
            >
              <Megaphone className="size-10" strokeWidth={1.5} />
            </span>
          </>
        )}
      </div>

      {/* Texte */}
      <div
        className={cn(
          "relative z-[1] flex min-w-0 flex-col justify-center gap-2 p-5 transition-[opacity,transform] duration-700 sm:p-6",
          basReserve && "pb-12 sm:pb-11",
          active ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
        )}
      >
        <p className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
          <span className="shrink-0 rounded-full border bg-background/60 px-2 py-0.5 font-semibold uppercase tracking-[0.14em] backdrop-blur">
            Sponsorisé
          </span>
          {annonce.annonceur ? (
            <span className="truncate">
              Proposé par{" "}
              <span className="font-semibold text-foreground/80">{annonce.annonceur}</span>
            </span>
          ) : null}
        </p>

        <h3 className="line-clamp-2 text-balance text-lg font-bold leading-snug tracking-tight sm:text-xl">
          {titre}
        </h3>

        {annonce.texte ? (
          <p className="line-clamp-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {annonce.texte}
          </p>
        ) : null}

        {lien ? (
          <span
            aria-hidden
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 group-hover/diapo:gap-2.5 group-hover/diapo:shadow-md"
            style={{ background: couleur }}
          >
            {annonce.libelleBouton?.trim() || "En savoir plus"}
            <ArrowUpRight className="size-4" />
          </span>
        ) : null}
      </div>
    </article>
  );
}

/* -------------------------------------------------------------- Diaporama */

/**
 * Diaporama d'annonces du tableau de bord.
 *
 * Discret par construction : il défile seul mais s'arrête dès qu'on le
 * survole ou qu'on y navigue au clavier, ne défile pas quand l'onglet est
 * caché ni pour qui a demandé moins d'animations, et se masque d'un clic pour
 * la session.
 */
export function DiaporamaPublicites({
  annonces: fournies,
  suivi = true,
  masquable = true,
  className,
}: {
  /** Fournies : pas de chargement (aperçu de la console). */
  annonces?: Publicite[];
  /** Compte vues et clics. Désactivé pour l'aperçu. */
  suivi?: boolean;
  masquable?: boolean;
  className?: string;
}) {
  const { data: chargees = [] } = useQuery({
    queryKey: ["publicites", "diffusion"],
    queryFn: publicitesApi.enDiffusion,
    enabled: !fournies,
    staleTime: 5 * 60 * 1000,
  });
  const annonces = fournies ?? chargees;

  const [index, setIndex] = useState(0);
  const [survol, setSurvol] = useState(false);
  const [focus, setFocus] = useState(false);
  const [visible, setVisible] = useState(false);
  const [masque, setMasque] = useState(
    () => masquable && typeof window !== "undefined" && lireSession(CLE_MASQUE) === "1",
  );
  const reduit = useMouvementReduit();
  const pageVisible = usePageVisible();
  const racine = useRef<HTMLElement>(null);
  const toucher = useRef<number | null>(null);
  // Un glissement change de diapo : il ne doit pas, en plus, ouvrir l'annonce.
  const glisse = useRef(false);

  const nombre = annonces.length;
  const courant = nombre ? index % nombre : 0;
  const annonce = annonces[courant];

  // Visible à l'écran : sert au décompte des vues et à la pause hors champ.
  useEffect(() => {
    const element = racine.current;
    if (!element) return;
    const observateur = new IntersectionObserver(
      ([entree]) => setVisible(entree.isIntersecting && entree.intersectionRatio >= 0.5),
      { threshold: [0, 0.5, 1] },
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, [nombre, masque]);

  useEffect(() => {
    if (suivi && annonce && visible && pageVisible) noterVue(annonce.id);
  }, [suivi, annonce, visible, pageVisible]);

  if (!nombre || masque || !annonce) return null;

  const multiple = nombre > 1;
  const defile = multiple && !reduit;
  const enPause = survol || focus || !pageVisible || !visible;
  const aller = (cible: number) => setIndex(((cible % nombre) + nombre) % nombre);
  const couleur = teintePublicite(annonce.teinte);

  return (
    <section
      ref={racine}
      aria-roledescription="carrousel"
      aria-label="Annonces de nos partenaires"
      className={cn(
        "entree group/diaporama relative touch-pan-y overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40 hover:shadow-md",
        className,
      )}
      onPointerEnter={(e) => e.pointerType === "mouse" && setSurvol(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setSurvol(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") toucher.current = e.clientX;
      }}
      onPointerUp={(e) => {
        const depart = toucher.current;
        toucher.current = null;
        if (depart === null || !multiple) return;
        const ecart = e.clientX - depart;
        if (Math.abs(ecart) > 45) {
          glisse.current = true;
          // Sans clic consécutif, le prochain vrai clic ne doit pas être avalé.
          window.setTimeout(() => (glisse.current = false), 400);
          aller(courant + (ecart < 0 ? 1 : -1));
        }
      }}
      onClickCapture={(e) => {
        if (!glisse.current) return;
        glisse.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (!multiple) return;
        if (e.key === "ArrowRight") aller(courant + 1);
        if (e.key === "ArrowLeft") aller(courant - 1);
      }}
    >
      {/* Les diapos partagent la même cellule : la hauteur est celle de la
          plus haute, rien ne saute d'une annonce à l'autre. */}
      <div className="grid">
        {annonces.map((item, rang) => {
          const active = rang === courant;
          return (
            <div
              key={item.id}
              role="group"
              aria-roledescription="diapositive"
              aria-label={`${rang + 1} sur ${nombre}`}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "[grid-area:1/1] transition-opacity duration-700 ease-out",
                active ? "z-[1] opacity-100" : "opacity-0",
              )}
            >
              <DiapoPublicite
                annonce={item}
                active={active}
                basReserve={multiple || masquable}
                onClic={suivi ? () => publicitesApi.compterClic(item.id) : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Minuterie et pagination */}
      {multiple ? (
        <div className="absolute bottom-4 left-5 z-10 flex items-center gap-1.5 sm:left-6">
          {annonces.map((item, rang) => {
            const actif = rang === courant;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => aller(rang)}
                aria-label={`Annonce ${rang + 1} sur ${nombre}`}
                aria-current={actif ? "true" : undefined}
                className="group/point grid h-4 place-items-center"
              >
                <span
                  className={cn(
                    "relative block h-1 overflow-hidden rounded-full bg-foreground/15 transition-all duration-500 group-hover/point:bg-foreground/30",
                    actif ? "w-9" : "w-3",
                  )}
                >
                  {actif ? (
                    <span
                      key={`${courant}-${defile}`}
                      className={cn("absolute inset-0 rounded-full", defile && "diapo-progression")}
                      style={
                        {
                          background: couleur,
                          "--duree": `${DUREE}ms`,
                          animationPlayState: enPause ? "paused" : "running",
                        } as React.CSSProperties
                      }
                      onAnimationEnd={defile ? () => aller(courant + 1) : undefined}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Commandes : discrètes, révélées au survol sur ordinateur. */}
      {multiple || masquable ? (
        <div className="absolute bottom-2.5 right-3 z-10 flex items-center gap-1 transition-opacity duration-300 sm:bottom-auto sm:top-3 sm:opacity-0 sm:group-hover/diaporama:opacity-100 sm:group-focus-within/diaporama:opacity-100">
          {multiple ? (
            <>
              <BoutonRond libelle="Annonce précédente" onClick={() => aller(courant - 1)}>
                <ChevronLeft className="size-4" />
              </BoutonRond>
              <BoutonRond libelle="Annonce suivante" onClick={() => aller(courant + 1)}>
                <ChevronRight className="size-4" />
              </BoutonRond>
            </>
          ) : null}
          {masquable ? (
            <BoutonRond
              libelle="Masquer les annonces pour cette session"
              onClick={() => {
                ecrireSession(CLE_MASQUE, "1");
                setMasque(true);
              }}
            >
              <X className="size-3.5" />
            </BoutonRond>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function BoutonRond({
  libelle,
  onClick,
  children,
}: {
  libelle: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={libelle}
      title={libelle}
      className="grid size-7 place-items-center rounded-full border bg-background/75 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}
