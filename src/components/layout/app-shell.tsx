"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bell,
  BellOff,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Handshake,
  Home,
  Loader2,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
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
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { GardeCgu } from "@/components/legal/garde-cgu";
import { EcoutePush } from "@/components/notifications/ecoute-push";
import { LignePush } from "@/components/notifications/invite-push";
import { ConsoleConfirmationProvider } from "@/components/admin/console-kit";
import { useAuth } from "@/hooks/use-auth";
import {
  fileUrl,
  messagingApi,
  notificationsApi,
  partenaireApi,
  tokenStore,
} from "@/lib/api";
import {
  ACTIONS_RAPIDES,
  TEINTE_DEFAUT,
  TEINTE_PARTENAIRES,
  navItemActif,
  visibleSections,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Role, User } from "@/lib/types";

/** Fond de la barre latérale : le même que la console, dans les deux thèmes. */
const FOND_LATERAL =
  "linear-gradient(180deg, oklch(0.23 0.025 255) 0%, oklch(0.19 0.02 255) 100%)";

const CLE_REPLI = "noken-espace-replie";

const teinteDe = (item?: NavItem) => item?.teinte ?? TEINTE_DEFAUT;

/**
 * Menu complet de l'utilisateur : sections de son rôle, plus les types de
 * partenaires créés dans la console (une entrée chacun, sans déploiement).
 */
function useSections(role?: Role): NavSection[] {
  const { data: typesPartenaires = [] } = useQuery({
    queryKey: ["partenaires", "types"],
    queryFn: partenaireApi.types,
    staleTime: 10 * 60_000,
  });

  const sections = visibleSections(role);
  if (typesPartenaires.length > 0) {
    const partenaires: NavSection = {
      label: "Partenaires",
      items: typesPartenaires.map((type) => ({
        label: type.nom,
        href: `/partenaires?type=${encodeURIComponent(type.slug)}`,
        icon: Handshake,
        teinte: TEINTE_PARTENAIRES,
        resume: `Annuaire : ${type.nom.toLowerCase()}`,
      })),
    };
    const apres = sections.findIndex((section) => section.label === "Explorer");
    sections.splice(apres >= 0 ? apres + 1 : sections.length, 0, partenaires);
  }
  return sections;
}

function useCompteurs(actif: boolean) {
  const { data: messages } = useQuery({
    queryKey: ["messaging", "unread"],
    queryFn: messagingApi.unreadCount,
    enabled: actif,
    refetchInterval: 60_000,
  });
  const { data: notifications } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: notificationsApi.unreadCount,
    enabled: actif,
    refetchInterval: 60_000,
  });
  return {
    messages: messages?.unreadCount ?? 0,
    notifications: notifications?.count ?? 0,
  };
}

type Compteurs = ReturnType<typeof useCompteurs>;

const compteDe = (item: NavItem, compteurs: Compteurs) =>
  item.badge === "messages"
    ? compteurs.messages
    : item.badge === "notifications"
      ? compteurs.notifications
      : 0;

/**
 * Coquille de l'espace connecté — membres et partenaires.
 *
 * Elle reprend la console : barre latérale sombre, une teinte par rubrique,
 * repliable sur grand écran et ouverte en tiroir sur téléphone ; barre
 * supérieure avec fil d'Ariane, palette de commandes (Ctrl + K),
 * notifications et compte. Sous `lg`, la barre basse reste l'accès au pouce.
 *
 * La garde est côté client : ce n'est pas un contrôle de sécurité — chaque
 * route de l'API est protégée indépendamment — mais un aiguillage
 * d'expérience utilisateur.
 */
export function AppShell({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: Role;
}) {
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
  // lui-même dès que l'adresse change.
  const [tiroirOuvertSur, setTiroirOuvertSur] = useState<string | null>(null);
  const tiroir = tiroirOuvertSur === pathname;
  const setTiroir = (ouvert: boolean) => setTiroirOuvertSur(ouvert ? pathname : null);
  const [palette, setPalette] = useState(false);

  const hasToken = typeof window !== "undefined" && Boolean(tokenStore.access);
  const denied = Boolean(user && requiredRole && user.role !== requiredRole);
  const sections = useSections(user?.role);
  const compteurs = useCompteurs(Boolean(user));

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
   * Publie la hauteur réelle de la barre supérieure : les éléments collants
   * (`--console-entete`) et les écrans pleine hauteur (`.ecran-plein`) s'y
   * calent, même si elle passe sur deux lignes.
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
    if (denied) {
      router.replace("/dashboard");
      return;
    }
    if (hasToken && (isLoading || user)) return;

    // La destination demandée est transmise à la connexion. Elle est lue sur
    // `window` : `useSearchParams` imposerait une frontière Suspense et
    // casserait le prérendu de toutes les pages de l'espace connecté.
    const destination = window.location.pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(destination)}`);
  }, [hasToken, isLoading, user, denied, router]);

  if (isLoading || !user || denied) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-3">
          <span className="relative grid size-14 place-items-center rounded-2xl bg-card shadow-lg ring-1 ring-border">
            <Image src="/noken-logo.png" alt="" width={32} height={32} className="size-8 object-contain" />
            <span className="absolute -inset-1 animate-ping rounded-2xl border border-primary/30" />
          </span>
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <span className="sr-only">Chargement…</span>
        </div>
      </div>
    );
  }

  const tousItems = sections.flatMap((section) => section.items);
  const actif = navItemActif(pathname, tousItems);
  const sectionActive = sections.find((section) =>
    section.items.some((item) => item.href === actif?.href),
  );
  const partenaire = user.role === "PARTENAIRE";

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
      <ConsoleConfirmationProvider>
        {/* Barre latérale fixe — grand écran. Toute la coquille disparaît à
            l'impression : sur un CV, elle ne serait qu'un bandeau parasite. */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden flex-col text-white shadow-xl shadow-black/10 transition-[width] duration-300 lg:flex print:hidden",
            replie ? "w-[4.75rem]" : "w-[17rem]",
          )}
          style={{ background: FOND_LATERAL }}
        >
          <ContenuLateral
            user={user}
            sections={sections}
            actif={actif}
            replie={replie}
            compteurs={compteurs}
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
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <ContenuLateral
              user={user}
              sections={sections}
              actif={actif}
              replie={false}
              compteurs={compteurs}
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
              className="absolute inset-x-0 top-0 h-[2px] transition-colors duration-500"
              style={{ background: teinteDe(actif) }}
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
                {replie ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
              </Button>

              {/* Fil d'Ariane */}
              <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-1.5 text-sm">
                <Link
                  href="/dashboard"
                  className="hidden shrink-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground sm:flex"
                >
                  <Home className="size-4" aria-hidden />
                  Mon espace
                </Link>
                {sectionActive?.label ? (
                  <>
                    <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/50 sm:block" aria-hidden />
                    <span className="hidden shrink-0 text-muted-foreground md:inline">
                      {sectionActive.label}
                    </span>
                  </>
                ) : null}
                {actif && actif.href !== "/dashboard" ? (
                  <>
                    <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/50 sm:block" aria-hidden />
                    <Link href={actif.href} className="flex min-w-0 items-center gap-2 font-semibold">
                      <span
                        className="grid size-6 shrink-0 place-items-center rounded-md"
                        style={{
                          background: `color-mix(in oklch, ${teinteDe(actif)} 16%, transparent)`,
                          color: teinteDe(actif),
                        }}
                      >
                        <actif.icon className="size-3.5" aria-hidden />
                      </span>
                      <span className="truncate">{actif.label}</span>
                    </Link>
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

                <Notifications compte={compteurs.notifications} />
                <ThemeToggle className="rounded-xl" />
                <MenuCompte user={user} partenaire={partenaire} onDeconnexion={seDeconnecter} />
              </div>
            </div>
          </header>

          {/* pb-20 laisse la place à la navigation basse mobile */}
          <main
            id="contenu"
            className="mx-auto w-full max-w-[100rem] flex-1 px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pb-10 print:max-w-none print:p-0"
          >
            {children}
          </main>
        </div>

        <div className="print:hidden">
          <MobileNav />
        </div>

        <PaletteCommandes
          ouverte={palette}
          onOpenChange={setPalette}
          sections={sections}
          role={user.role}
          estAdmin={user.role === "ADMIN"}
          compteurs={compteurs}
          onDeconnexion={seDeconnecter}
        />
        <GardeCgu />
        <EcoutePush />
      </ConsoleConfirmationProvider>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function initiale(user: User) {
  return (user.firstName?.[0] ?? user.username[0] ?? "?").toUpperCase();
}

function nomComplet(user: User) {
  return user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.username;
}

function libelleRole(role: Role) {
  if (role === "ADMIN") return "Administrateur";
  if (role === "PARTENAIRE") return "Structure partenaire";
  return "Membre";
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
  sections,
  actif,
  replie,
  compteurs,
  onRecherche,
  onDeconnexion,
}: {
  user: User;
  sections: NavSection[];
  actif?: NavItem;
  replie: boolean;
  compteurs: Compteurs;
  onRecherche: () => void;
  onDeconnexion: () => void;
}) {
  const partenaire = user.role === "PARTENAIRE";

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Halos de couleur : de la profondeur sans gêner la lecture. Le halo
          du haut prend la teinte de la rubrique ouverte. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full opacity-20 blur-3xl transition-colors duration-700"
        style={{ background: teinteDe(actif) }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-20 size-56 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--c-sky)" }}
      />

      {/* Marque */}
      <Link
        href="/dashboard"
        className={cn(
          "relative flex h-16 shrink-0 items-center gap-3 border-b border-white/8 outline-none focus-visible:bg-white/5",
          replie ? "justify-center px-0" : "px-5",
        )}
      >
        <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-lg shadow-black/20 transition-transform duration-300 hover:rotate-[-6deg]">
          <Image src="/noken-logo.png" alt="" width={28} height={28} className="size-7 object-contain" />
        </span>
        {!replie ? (
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight">Noken</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              {partenaire ? "Espace partenaire" : "Espace membre"}
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
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">Ctrl K</kbd>
            </>
          ) : (
            <span className="sr-only">Rechercher</span>
          )}
        </button>
      </div>

      {/* Rubriques */}
      <nav aria-label="Navigation principale" className="no-scrollbar relative flex-1 overflow-y-auto py-3">
        {sections.map((section, index) => (
          <div key={section.label ?? `section-${index}`} className="mb-3 px-3">
            {section.label ? (
              replie ? (
                <span aria-hidden className="mx-auto mb-2 mt-1 block h-px w-6 bg-white/10" />
              ) : (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                  {section.label}
                </p>
              )
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const courant = actif?.href === item.href;
                const Icone = item.icon;
                const teinte = teinteDe(item);
                const compte = compteDe(item, compteurs);

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
                          style={{ background: teinte }}
                        />
                      ) : null}
                      <span
                        className="relative grid size-7 shrink-0 place-items-center rounded-lg transition-all duration-200 group-hover:scale-110"
                        style={{
                          background: courant ? teinte : `color-mix(in oklch, ${teinte} 22%, transparent)`,
                          color: courant ? "white" : teinte,
                        }}
                      >
                        <Icone className="size-4" aria-hidden />
                        {replie ? <PastilleCompteur valeur={compte} teinte={teinte} replie /> : null}
                      </span>
                      {!replie ? (
                        <>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          <PastilleCompteur valeur={compte} teinte={teinte} />
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

      {/* Pied : console pour les administrateurs, puis le compte */}
      <div className={cn("relative shrink-0 border-t border-white/8", replie ? "p-3" : "p-4")}>
        {user.role === "ADMIN" && !replie ? (
          <Link
            href="/admin"
            className="mb-3 flex items-center gap-3 rounded-xl bg-white/8 p-3 text-white ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/12"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-white/10">
              <ShieldCheck className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-xs font-bold">Console d&apos;administration</span>
              <span className="block truncate text-[11px] text-white/75">Gérer la plateforme</span>
            </span>
            <ArrowUpRight className="size-4 shrink-0" aria-hidden />
          </Link>
        ) : null}

        <div className={cn("flex items-center gap-2.5", replie && "flex-col")}>
          <Link href="/profil" title="Mon profil" className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/40">
            <Avatar className="size-9 ring-2 ring-white/15">
              <AvatarImage src={fileUrl(user.pictureUrl)} alt="" />
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                {initiale(user)}
              </AvatarFallback>
            </Avatar>
          </Link>
          {!replie ? (
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold">{nomComplet(user)}</span>
              <span className="block text-[11px] text-white/50">{libelleRole(user.role)}</span>
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

function Notifications({ compte }: { compte: number }) {
  const queryClient = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: notificationsApi.list,
  });

  async function toutMarquerLu() {
    await notificationsApi.markAllRead();
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl"
            aria-label={`Notifications${compte ? ` (${compte} non lues)` : ""}`}
          />
        }
      >
        <Bell className="size-5" />
        {compte ? (
          <span className="absolute right-1.5 top-1.5 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--c-rose)] opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[var(--c-rose)] ring-2 ring-background" />
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-bold">
            Notifications
            {compte ? (
              <span className="rounded-full bg-[color-mix(in_oklch,var(--c-rose)_15%,transparent)] px-2 py-0.5 text-[11px] font-bold tabular-nums text-[var(--c-rose)]">
                {compte}
              </span>
            ) : null}
          </p>
          {compte ? (
            <button type="button" onClick={toutMarquerLu} className="text-xs font-semibold text-primary hover:underline">
              Tout marquer comme lu
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <span className="mx-auto mb-2 grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <BellOff className="size-5" />
            </span>
            <p className="text-sm font-semibold">Rien de neuf</p>
            <p className="text-xs text-muted-foreground">Les nouvelles offres et réponses apparaîtront ici.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto p-1">
            {items.slice(0, 12).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "items-start gap-3 rounded-lg p-2.5",
                  !notification.isRead && "bg-primary/[0.05]",
                )}
                render={<Link href={notification.link ?? "#"} />}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    notification.isRead ? "bg-transparent" : "bg-primary",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug">{notification.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                    {notification.message}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {formatRelative(notification.createdAt)}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <div className="border-t">
          <LignePush />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuCompte({
  user,
  partenaire,
  onDeconnexion,
}: {
  user: User;
  partenaire: boolean;
  onDeconnexion: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="ml-1 flex items-center gap-2 rounded-xl p-1 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 sm:pr-2.5"
            aria-label="Menu du compte"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarImage src={fileUrl(user.pictureUrl)} alt="" />
          <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
            {initiale(user)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-28 truncate text-sm font-semibold">
            {user.firstName ?? user.username}
          </span>
          <span className="block text-[11px] text-muted-foreground">
            {partenaire ? "Partenaire" : user.role === "ADMIN" ? "Admin" : "Membre"}
          </span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {/* En-tête d'identité — pas un DropdownMenuLabel, qui exigerait un
            Menu.Group parent. */}
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-semibold">{nomComplet(user)}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profil" />}>
          <UserRound className="size-4" />
          Mon profil
        </DropdownMenuItem>
        {/* Seule porte d'entrée de la console avec le pied du menu latéral. */}
        {user.role === "ADMIN" ? (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <ShieldCheck className="size-4" />
            Console d&apos;administration
          </DropdownMenuItem>
        ) : null}
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
  sections,
  role,
  estAdmin,
  compteurs,
  onDeconnexion,
}: {
  ouverte: boolean;
  onOpenChange: (ouverte: boolean) => void;
  sections: NavSection[];
  role: Role;
  estAdmin: boolean;
  compteurs: Compteurs;
  onDeconnexion: () => void;
}) {
  const router = useRouter();
  const [saisie, setSaisie] = useState("");
  const aller = (href: string) => {
    onOpenChange(false);
    setSaisie("");
    router.push(href);
  };
  const terme = saisie.trim();

  const ligne = (item: NavItem, prefixe = "") => {
    const teinte = teinteDe(item);
    const compte = compteDe(item, compteurs);
    return (
      <CommandItem
        key={`${prefixe}${item.href}`}
        value={`${prefixe}${item.label} ${item.resume ?? ""}`}
        onSelect={() => aller(item.href)}
        className="gap-3 rounded-lg py-2"
      >
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg"
          style={{ background: `color-mix(in oklch, ${teinte} 15%, transparent)`, color: teinte }}
        >
          <item.icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{item.label}</span>
          {item.resume ? (
            <span className="block truncate text-xs text-muted-foreground">{item.resume}</span>
          ) : null}
        </span>
        {compte ? (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: teinte }}>
            {compte}
          </span>
        ) : null}
      </CommandItem>
    );
  };

  return (
    <CommandDialog
      open={ouverte}
      onOpenChange={(etat) => {
        onOpenChange(etat);
        if (!etat) setSaisie("");
      }}
      title="Rechercher"
      description="Chercher une offre ou aller à une rubrique"
      className="sm:max-w-xl"
    >
      <Command>
        <CommandInput
          placeholder="Une offre, une rubrique, une action…"
          value={saisie}
          onValueChange={setSaisie}
        />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>Aucune rubrique ne correspond.</CommandEmpty>
          {/* Toujours proposée dès qu'on tape : la recherche d'offres est la
              raison d'être de la plateforme. */}
          {terme ? (
            <CommandGroup heading="Catalogue">
              <CommandItem
                value={`__offres ${terme}`}
                onSelect={() => aller(`/recherche?keyword=${encodeURIComponent(terme)}`)}
                className="gap-3 rounded-lg py-2"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklch,var(--c-emerald)_15%,transparent)] text-[var(--c-emerald)]">
                  <Search className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Rechercher « {terme} » dans les offres</span>
                  <span className="block text-xs text-muted-foreground">Emplois, formations, bourses…</span>
                </span>
              </CommandItem>
            </CommandGroup>
          ) : null}
          <CommandGroup heading="Actions rapides">
            {ACTIONS_RAPIDES.filter((item) => !item.role || item.role === role).map((item) =>
              ligne(item, "action "),
            )}
          </CommandGroup>
          {sections.map((section, index) => (
            <CommandGroup key={section.label ?? `s-${index}`} heading={section.label ?? "Accueil"}>
              {section.items.map((item) => ligne(item))}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Compte">
            {estAdmin ? (
              <CommandItem value="Console d'administration" onSelect={() => aller("/admin")} className="gap-3 rounded-lg">
                <ShieldCheck className="size-4" />
                Console d&apos;administration
              </CommandItem>
            ) : null}
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
