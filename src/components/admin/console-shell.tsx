"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Home,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useConsoleATraiter } from "@/components/admin/use-console-a-traiter";
import {
  CONSOLE_ACTIONS,
  CONSOLE_GROUPES,
  consoleActionActive,
  consoleItemActif,
  type ConsoleNavItem,
} from "@/lib/console-nav";
import { useAuth } from "@/hooks/use-auth";
import { fileUrl, tokenStore } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

/** Fond de la barre latérale : identique dans les deux thèmes. */
const FOND_LATERAL =
  "linear-gradient(180deg, oklch(0.24 0.07 278) 0%, oklch(0.19 0.05 275) 45%, oklch(0.16 0.035 265) 100%)";

const CLE_REPLI = "noken-console-replie";

/**
 * Coquille de la console d'administration.
 *
 * Barre latérale sombre et colorée (une teinte par rubrique, des pastilles
 * pour ce qui attend une décision), repliable sur grand écran et ouverte en
 * tiroir sur téléphone ; barre supérieure avec fil d'Ariane, palette de
 * commandes (Ctrl + K), notifications et compte.
 *
 * La garde de rôle est un aiguillage d'expérience, pas un contrôle de sécurité :
 * chaque route `/api/admin/*` est protégée côté serveur par RolesGuard.
 */
export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  const [replie, setReplie] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(CLE_REPLI) === "1";
    } catch {
      return false;
    }
  });
  // Le tiroir est lié à la page où il a été ouvert : il se referme de
  // lui-même dès que la navigation change d'adresse.
  const [tiroirOuvertSur, setTiroirOuvertSur] = useState<string | null>(null);
  const tiroir = tiroirOuvertSur === pathname;
  const setTiroir = (ouvert: boolean) =>
    setTiroirOuvertSur(ouvert ? pathname : null);
  const [palette, setPalette] = useState(false);

  const hasToken = typeof window !== "undefined" && Boolean(tokenStore.access);
  const refuse = Boolean(user && user.role !== "ADMIN");
  const estAdmin = user?.role === "ADMIN";
  const aTraiter = useConsoleATraiter(estAdmin);

  const basculerRepli = () => {
    setReplie((courant) => {
      try {
        window.localStorage.setItem(CLE_REPLI, courant ? "0" : "1");
      } catch {
        // Préférence non mémorisée, sans conséquence.
      }
      return !courant;
    });
  };

  // Ctrl + K / ⌘ + K ouvre la palette de commandes.
  useEffect(() => {
    const ecouter = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((ouverte) => !ouverte);
      }
    };
    window.addEventListener("keydown", ecouter);
    return () => window.removeEventListener("keydown", ecouter);
  }, []);

  /**
   * Publie la hauteur réelle de la barre supérieure dans `--console-entete` :
   * les en-têtes de tableau et les colonnes collantes s'y calent.
   */
  const mesurerEntete = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const entete = element.querySelector<HTMLElement>("[data-console-entete]");
    if (!entete) return;

    const observateur = new ResizeObserver(() => {
      element.style.setProperty(
        "--console-entete",
        `${Math.ceil(entete.getBoundingClientRect().height)}px`,
      );
    });
    observateur.observe(entete);
    return () => observateur.disconnect();
  }, []);

  useEffect(() => {
    if (refuse) {
      router.replace("/dashboard");
      return;
    }
    if (hasToken && (isLoading || user)) return;

    // L'adresse est lue sur `window` plutôt que via `useSearchParams`, qui
    // imposerait une frontière Suspense et casserait le prérendu.
    const destination = window.location.pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(destination)}`);
  }, [hasToken, isLoading, user, refuse, router]);

  if (isLoading || !user || refuse) {
    return (
      <div
        className="grid min-h-dvh place-items-center"
        style={{ background: FOND_LATERAL }}
      >
        <div className="flex flex-col items-center gap-3 text-white/70">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-sm">Vérification des droits…</span>
        </div>
      </div>
    );
  }

  const actif = consoleItemActif(pathname);
  const action = consoleActionActive(pathname);
  const groupeActif = CONSOLE_GROUPES.find((groupe) =>
    groupe.items.some((item) => item.href === actif?.href),
  );

  const seDeconnecter = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div
      ref={mesurerEntete}
      className="min-h-dvh bg-[oklch(0.975_0.006_275)] dark:bg-background"
      style={{ "--console-entete": "calc(4rem + 1px)" } as React.CSSProperties}
    >
      {/* Barre latérale fixe — grand écran */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col text-white shadow-2xl shadow-indigo-950/20 transition-[width] duration-300 lg:flex print:hidden",
          replie ? "w-[4.75rem]" : "w-[17rem]",
        )}
        style={{ background: FOND_LATERAL }}
      >
        <ContenuLateral
          user={user}
          actif={actif}
          replie={replie}
          compteurs={aTraiter.compteurs}
          onRecherche={() => setPalette(true)}
          onDeconnexion={seDeconnecter}
        />
      </aside>

      {/* Tiroir — téléphone et tablette */}
      <Sheet open={tiroir} onOpenChange={setTiroir}>
        <SheetContent
          side="left"
          className="w-[18rem] border-0 p-0 text-white sm:max-w-[18rem]"
          style={{ background: FOND_LATERAL }}
        >
          <SheetTitle className="sr-only">Menu de la console</SheetTitle>
          <ContenuLateral
            user={user}
            actif={actif}
            replie={false}
            compteurs={aTraiter.compteurs}
            onRecherche={() => {
              setTiroir(false);
              setPalette(true);
            }}
            onDeconnexion={seDeconnecter}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding] duration-300 print:p-0",
          replie ? "lg:pl-[4.75rem]" : "lg:pl-[17rem]",
        )}
      >
        {/* Barre supérieure */}
        <header
          data-console-entete
          className="sticky top-0 z-30 border-b bg-background/75 backdrop-blur-xl print:hidden"
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, var(--c-indigo), var(--c-violet), var(--c-fuchsia), var(--c-orange), var(--c-amber), var(--c-emerald), var(--c-cyan))",
            }}
          />
          <div className="flex h-16 items-center gap-2 px-3 sm:px-5">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl lg:hidden"
              onClick={() => setTiroir(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden rounded-xl text-muted-foreground lg:inline-flex"
              onClick={basculerRepli}
              aria-label={replie ? "Déplier le menu" : "Replier le menu"}
              title={replie ? "Déplier le menu" : "Replier le menu"}
            >
              {replie ? (
                <ChevronsRight className="size-5" />
              ) : (
                <ChevronsLeft className="size-5" />
              )}
            </Button>

            {/* Fil d'Ariane */}
            <nav
              aria-label="Fil d'Ariane"
              className="flex min-w-0 items-center gap-1.5 text-sm"
            >
              <Link
                href="/admin"
                className="hidden shrink-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <Home className="size-4" aria-hidden />
                Console
              </Link>
              {groupeActif ? (
                <>
                  <ChevronRight
                    className="hidden size-3.5 shrink-0 text-muted-foreground/50 sm:block"
                    aria-hidden
                  />
                  <span className="hidden shrink-0 text-muted-foreground md:inline">
                    {groupeActif.titre}
                  </span>
                </>
              ) : null}
              {actif ? (
                <>
                  <ChevronRight
                    className="hidden size-3.5 shrink-0 text-muted-foreground/50 md:block"
                    aria-hidden
                  />
                  <Link
                    href={actif.href}
                    className="flex min-w-0 items-center gap-2 font-semibold"
                  >
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-md"
                      style={{
                        background: `color-mix(in oklch, ${actif.teinte} 16%, transparent)`,
                        color: actif.teinte,
                      }}
                    >
                      <actif.icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="truncate">{actif.label}</span>
                  </Link>
                </>
              ) : null}
              {action ? (
                <>
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground/50"
                    aria-hidden
                  />
                  <span className="truncate text-muted-foreground">
                    {action.label}
                  </span>
                </>
              ) : null}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setPalette(true)}
                className="hidden h-9 w-56 items-center gap-2 rounded-xl border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex xl:w-72"
              >
                <Search className="size-4" aria-hidden />
                <span className="flex-1 text-left">Rechercher…</span>
                <kbd className="rounded-md border bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                  Ctrl K
                </kbd>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl md:hidden"
                onClick={() => setPalette(true)}
                aria-label="Rechercher"
              >
                <Search className="size-5" />
              </Button>

              <Notifications aTraiter={aTraiter} />

              <ThemeToggle className="rounded-xl" />

              <Button
                variant="ghost"
                size="sm"
                className="hidden rounded-xl text-muted-foreground xl:inline-flex"
                render={<Link href="/" target="_blank" />}
              >
                Voir le site
                <ArrowUpRight className="size-3.5" />
              </Button>

              <MenuCompte user={user} onDeconnexion={seDeconnecter} />
            </div>
          </div>
        </header>

        <main
          id="contenu"
          className="mx-auto w-full max-w-[100rem] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8 print:max-w-none print:p-0"
        >
          {children}
        </main>

        <footer className="mx-auto w-full max-w-[100rem] px-4 pb-8 sm:px-6 lg:px-8 print:hidden">
          <div className="flex flex-col gap-2 border-t pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Console d&apos;administration Noken — les actions menées ici
              s&apos;appliquent à l&apos;ensemble de la plateforme.
            </p>
            <p className="flex items-center gap-3">
              <span>
                Développée par{" "}
                <a
                  href="https://www.declicsud.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground hover:underline"
                >
                  DECLIC
                </a>{" "}
                · soutenue par la{" "}
                <a
                  href="https://www.giz.de/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground hover:underline"
                >
                  GIZ
                </a>
              </span>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-0.5 font-medium text-foreground hover:underline"
              >
                Espace membre
                <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </p>
          </div>
        </footer>
      </div>

      <PaletteCommandes
        ouverte={palette}
        onOpenChange={setPalette}
        compteurs={aTraiter.compteurs}
        onDeconnexion={seDeconnecter}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function initiale(user: User) {
  return (user.firstName?.[0] ?? user.username[0] ?? "?").toUpperCase();
}

function PastilleCompteur({
  valeur,
  teinte,
  replie,
}: {
  valeur: number;
  teinte: string;
  replie?: boolean;
}) {
  if (!valeur) return null;
  return (
    <span
      className={cn(
        "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold tabular-nums text-white shadow-sm",
        replie && "absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[9px]",
      )}
      style={{ background: teinte }}
    >
      {valeur > 99 ? "99+" : valeur}
    </span>
  );
}

function ContenuLateral({
  user,
  actif,
  replie,
  compteurs,
  onRecherche,
  onDeconnexion,
}: {
  user: User;
  actif?: ConsoleNavItem;
  replie: boolean;
  compteurs: Record<"validation" | "signalements", number>;
  onRecherche: () => void;
  onDeconnexion: () => void;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Halos de couleur : donnent de la profondeur sans gêner la lecture. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--c-violet)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-20 size-56 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--c-cyan)" }}
      />

      {/* Marque */}
      <Link
        href="/admin"
        className={cn(
          "relative flex h-16 shrink-0 items-center gap-3 border-b border-white/8 outline-none focus-visible:bg-white/5",
          replie ? "justify-center px-0" : "px-5",
        )}
      >
        <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-lg shadow-black/20">
          <Image
            src="/noken-logo.png"
            alt=""
            width={28}
            height={28}
            className="size-7 object-contain"
          />
          <span className="absolute -bottom-1 -right-1 grid size-4.5 place-items-center rounded-full bg-[var(--c-fuchsia)] ring-2 ring-[oklch(0.24_0.07_278)]">
            <ShieldCheck className="size-2.5 text-white" aria-hidden />
          </span>
        </span>
        {!replie ? (
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight">
              Noken
            </span>
            <span className="block bg-gradient-to-r from-[var(--c-cyan)] via-[var(--c-violet)] to-[var(--c-fuchsia)] bg-clip-text text-[11px] font-bold uppercase tracking-[0.2em] text-transparent">
              Console admin
            </span>
          </span>
        ) : null}
      </Link>

      {/* Recherche */}
      <div className={cn("relative shrink-0 pt-4", replie ? "px-3" : "px-4")}>
        <button
          type="button"
          onClick={onRecherche}
          title="Rechercher (Ctrl + K)"
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-xl bg-white/8 text-sm text-white/60 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/12 hover:text-white",
            replie ? "justify-center" : "px-3",
          )}
        >
          <Search className="size-4 shrink-0" aria-hidden />
          {!replie ? (
            <>
              <span className="flex-1 text-left">Aller à…</span>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl K
              </kbd>
            </>
          ) : (
            <span className="sr-only">Rechercher</span>
          )}
        </button>
      </div>

      {/* Rubriques */}
      <nav
        aria-label="Rubriques de la console"
        className="no-scrollbar relative flex-1 overflow-y-auto py-3"
      >
        {CONSOLE_GROUPES.map((groupe) => (
          <div key={groupe.titre} className={cn("mb-3", replie ? "px-3" : "px-3")}>
            {replie ? (
              <span aria-hidden className="mx-auto mb-2 mt-1 block h-px w-6 bg-white/10" />
            ) : (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                {groupe.titre}
              </p>
            )}
            <ul className="space-y-0.5">
              {groupe.items.map((item) => {
                const courant = actif?.href === item.href;
                const Icone = item.icon;
                const compte = item.compteur ? compteurs[item.compteur] : 0;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={courant ? "page" : undefined}
                      title={replie ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl text-sm transition-all duration-200",
                        "outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                        replie ? "h-11 justify-center" : "h-10 px-2.5",
                        courant
                          ? "bg-white/12 font-semibold text-white shadow-[inset_0_0_0_1px_oklch(1_0_0/0.08)]"
                          : "text-white/65 hover:bg-white/6 hover:text-white",
                      )}
                    >
                      {courant && !replie ? (
                        <span
                          aria-hidden
                          className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full"
                          style={{
                            background: item.teinte,
                            boxShadow: `0 0 12px ${item.teinte}`,
                          }}
                        />
                      ) : null}
                      <span
                        className={cn(
                          "relative grid size-7 shrink-0 place-items-center rounded-lg transition-all duration-200 group-hover:scale-110",
                        )}
                        style={{
                          background: courant
                            ? item.teinte
                            : `color-mix(in oklch, ${item.teinte} 22%, transparent)`,
                          color: courant ? "white" : item.teinte,
                          boxShadow: courant
                            ? `0 4px 14px -2px color-mix(in oklch, ${item.teinte} 70%, transparent)`
                            : undefined,
                        }}
                      >
                        <Icone className="size-4" aria-hidden />
                        {replie ? (
                          <PastilleCompteur
                            valeur={compte}
                            teinte={item.teinte}
                            replie
                          />
                        ) : null}
                      </span>
                      {!replie ? (
                        <>
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>
                          <PastilleCompteur valeur={compte} teinte={item.teinte} />
                        </>
                      ) : (
                        <span className="sr-only">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pied : retour à l'espace membre et compte */}
      <div className={cn("relative shrink-0 border-t border-white/8", replie ? "p-3" : "p-4")}>
        {!replie ? (
          <Link
            href="/dashboard"
            className="mb-3 flex items-center gap-3 rounded-xl bg-gradient-to-br from-[var(--c-indigo)] to-[var(--c-fuchsia)] p-3 text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-white/20">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-xs font-bold">Espace membre</span>
              <span className="block truncate text-[11px] text-white/75">
                Revenir à l&apos;application
              </span>
            </span>
            <ArrowUpRight className="size-4 shrink-0" aria-hidden />
          </Link>
        ) : null}

        <div
          className={cn(
            "flex items-center gap-2.5",
            replie && "flex-col",
          )}
        >
          <Avatar className="size-9 ring-2 ring-white/15">
            <AvatarImage src={fileUrl(user.pictureUrl)} alt="" />
            <AvatarFallback className="bg-gradient-to-br from-[var(--c-violet)] to-[var(--c-cyan)] text-xs font-bold text-white">
              {initiale(user)}
            </AvatarFallback>
          </Avatar>
          {!replie ? (
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold">
                {user.firstName
                  ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                  : user.username}
              </span>
              <span className="block text-[11px] text-white/50">
                Administrateur
              </span>
            </span>
          ) : null}
          <button
            type="button"
            onClick={onDeconnexion}
            title="Se déconnecter"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="sr-only">Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function Notifications({
  aTraiter,
}: {
  aTraiter: ReturnType<typeof useConsoleATraiter>;
}) {
  const { offresEnAttente, signalementsOuverts, total } = aTraiter;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl"
            aria-label={`Notifications${total ? ` (${total} à traiter)` : ""}`}
          />
        }
      >
        <Bell className="size-5" />
        {total ? (
          <span className="absolute right-1.5 top-1.5 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--c-rose)] opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[var(--c-rose)] ring-2 ring-background" />
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-bold">À traiter</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
            {total}
          </span>
        </div>
        {total === 0 ? (
          <div className="px-4 py-8 text-center">
            <span className="mx-auto mb-2 grid size-10 place-items-center rounded-full bg-[color-mix(in_oklch,var(--c-emerald)_15%,transparent)] text-[var(--c-emerald)]">
              <ShieldCheck className="size-5" />
            </span>
            <p className="text-sm font-semibold">Tout est à jour</p>
            <p className="text-xs text-muted-foreground">
              Aucune offre ni signalement en attente.
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto p-1">
            {offresEnAttente.slice(0, 5).map((offre) => (
              <DropdownMenuItem
                key={`o-${offre.id}`}
                className="items-start gap-3 rounded-lg p-2.5"
                render={<Link href="/admin/moderation" />}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklch,var(--c-amber)_18%,transparent)] text-[var(--c-amber)]">
                  <ShieldCheck className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {offre.titre}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Offre à valider · {formatRelative(offre.datePublication)}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
            {signalementsOuverts.slice(0, 5).map((feedback) => (
              <DropdownMenuItem
                key={`f-${feedback.id}`}
                className="items-start gap-3 rounded-lg p-2.5"
                render={<Link href={`/admin/feedback/${feedback.id}`} />}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklch,var(--c-rose)_16%,transparent)] text-[var(--c-rose)]">
                  <MessageCircle className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {feedback.titre}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Signalement · {formatRelative(feedback.createdAt)}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1 border-t p-1">
          <DropdownMenuItem
            className="justify-center rounded-lg text-xs font-semibold"
            render={<Link href="/admin/moderation" />}
          >
            Validation ({offresEnAttente.length})
          </DropdownMenuItem>
          <DropdownMenuItem
            className="justify-center rounded-lg text-xs font-semibold"
            render={<Link href="/admin/feedback" />}
          >
            Signalements ({signalementsOuverts.length})
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuCompte({
  user,
  onDeconnexion,
}: {
  user: User;
  onDeconnexion: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="ml-1 flex items-center gap-2 rounded-xl p-1 pr-1 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 sm:pr-2.5"
            aria-label="Menu du compte"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarImage src={fileUrl(user.pictureUrl)} alt="" />
          <AvatarFallback className="bg-gradient-to-br from-[var(--c-violet)] to-[var(--c-cyan)] text-xs font-bold text-white">
            {initiale(user)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-28 truncate text-sm font-semibold">
            {user.firstName ?? user.username}
          </span>
          <span className="block text-[11px] text-muted-foreground">Admin</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-semibold">
            {user.firstName
              ? `${user.firstName} ${user.lastName ?? ""}`.trim()
              : user.username}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profil" />}>
          <UserRound className="size-4" />
          Mon profil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard" />}>
          <Sparkles className="size-4" />
          Espace membre
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/" target="_blank" />}>
          <ArrowUpRight className="size-4" />
          Voir le site public
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDeconnexion}>
          <LogOut className="size-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PaletteCommandes({
  ouverte,
  onOpenChange,
  compteurs,
  onDeconnexion,
}: {
  ouverte: boolean;
  onOpenChange: (ouverte: boolean) => void;
  compteurs: Record<"validation" | "signalements", number>;
  onDeconnexion: () => void;
}) {
  const router = useRouter();
  const aller = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const ligne = (item: ConsoleNavItem) => {
    const compte = item.compteur ? compteurs[item.compteur] : 0;
    return (
      <CommandItem
        key={item.href}
        value={`${item.label} ${item.resume ?? ""}`}
        onSelect={() => aller(item.href)}
        className="gap-3 rounded-lg py-2"
      >
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklch, ${item.teinte} 15%, transparent)`,
            color: item.teinte,
          }}
        >
          <item.icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{item.label}</span>
          {item.resume ? (
            <span className="block truncate text-xs text-muted-foreground">
              {item.resume}
            </span>
          ) : null}
        </span>
        {compte ? (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ background: item.teinte }}
          >
            {compte}
          </span>
        ) : null}
      </CommandItem>
    );
  };

  return (
    <CommandDialog
      open={ouverte}
      onOpenChange={onOpenChange}
      title="Aller à une rubrique"
      description="Rechercher une rubrique ou une action de la console"
      className="sm:max-w-xl"
    >
      <Command>
      <CommandInput placeholder="Rubrique, action…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Actions rapides">
          {CONSOLE_ACTIONS.map((item) => (
            ligne(item)
          ))}
        </CommandGroup>
        {CONSOLE_GROUPES.map((groupe) => (
          <CommandGroup key={groupe.titre} heading={groupe.titre}>
            {groupe.items.map((item) => (
              ligne(item)
            ))}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Compte">
          <CommandItem value="Espace membre" onSelect={() => aller("/dashboard")} className="gap-3 rounded-lg">
            <Sparkles className="size-4" />
            Espace membre
          </CommandItem>
          <CommandItem
            value="Se déconnecter"
            onSelect={() => {
              onOpenChange(false);
              onDeconnexion();
            }}
            className="gap-3 rounded-lg"
          >
            <LogOut className="size-4" />
            Se déconnecter
          </CommandItem>
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
