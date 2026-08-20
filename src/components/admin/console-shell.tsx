"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CONSOLE_NAV, consoleItemActif } from "@/lib/console-nav";
import { useAuth } from "@/hooks/use-auth";
import { fileUrl, tokenStore } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Coquille de la console d'administration.
 *
 * La console est délibérément un autre lieu. L'espace membre est clair, rond et
 * coloré ; la console s'ouvre sur un bandeau d'encre, dense, identique dans les
 * deux thèmes. On sait au premier coup d'œil qu'on n'y publie pas son CV mais
 * qu'on y supprime des comptes — et la barre de retour est toujours visible.
 *
 * Le bandeau reste sombre en thème clair : c'est le seul repère qui ne dépende
 * ni de la mémoire ni de la lecture d'un titre.
 *
 * La garde de rôle est un aiguillage d'expérience, pas un contrôle de sécurité :
 * chaque route `/api/admin/*` est protégée côté serveur par RolesGuard. Masquer
 * l'interface évite simplement d'afficher une page vide de 403.
 */
export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const hasToken = typeof window !== "undefined" && Boolean(tokenStore.access);
  const refuse = Boolean(user && user.role !== "ADMIN");

  /**
   * Publie la hauteur réelle de l'en-tête dans `--console-entete`.
   *
   * Les en-têtes de tableau s'y collent. Une valeur écrite en dur suffirait
   * tant que la barre garde exactement sa hauteur — mais elle se replie sur
   * deux lignes dès qu'un libellé s'allonge ou qu'une rubrique s'ajoute, et
   * l'en-tête du tableau se retrouverait alors à recouvrir une ligne de
   * données. La mesure est écrite directement sur le nœud plutôt que rangée
   * dans un état : un `setState` déclencherait un second rendu à chaque
   * redimensionnement, pour une valeur que seul le CSS consomme.
   */
  const mesurerEntete = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;

    const entete = element.querySelector("header");
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

    // Même raisonnement que dans la coquille membre : l'adresse est lue sur
    // `window` plutôt que via `useSearchParams`, qui imposerait une frontière
    // Suspense et casserait le prérendu de toutes les pages de la console.
    const destination = window.location.pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(destination)}`);
  }, [hasToken, isLoading, user, refuse, router]);

  if (isLoading || !user || refuse) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[oklch(0.17_0.018_265)]">
        <Loader2 className="size-5 animate-spin text-white/60" />
        <span className="sr-only">Vérification des droits…</span>
      </div>
    );
  }

  const actif = consoleItemActif(pathname);

  return (
    <div
      ref={mesurerEntete}
      className="min-h-dvh bg-muted/40"
      // Valeur de départ, remplacée par la mesure réelle : 3.5rem de barre +
      // 2.75rem d'onglets + les deux filets d'1px. Elle sert le temps du
      // premier rendu, avant que l'observateur ne prenne le relais.
      style={{ "--console-entete": "calc(6.25rem + 2px)" } as React.CSSProperties}
    >
      {/* Le bandeau et les onglets ne s'impriment pas : sur un document
          destiné à circuler, une barre de navigation n'est qu'une bande
          noire en haut de la première page. */}
      <header className="sticky top-0 z-40 bg-[oklch(0.17_0.018_265)] text-white print:hidden">
        {/* Trame de fond : elle donne de la matière au bandeau sans ajouter de
            bruit visible sur les libellés, qui restent posés au-dessus. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(oklch(1 0 0 / 0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative mx-auto flex h-14 max-w-[100rem] items-center gap-3 px-4 sm:px-6">
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/15">
              <ShieldAlert className="size-4.5 text-white" aria-hidden />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[13px] font-bold tracking-tight">
                Noken
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Console
              </span>
            </span>
          </Link>

          <span
            aria-hidden
            className="hidden h-6 w-px bg-white/12 sm:block"
          />

          {/* Rappel de la rubrique courante, utile quand la barre d'onglets a
              défilé hors de vue sur un petit écran. */}
          {actif ? (
            <span className="hidden min-w-0 items-center gap-2 text-sm font-semibold text-white/85 sm:flex">
              <actif.icon className="size-4 shrink-0 text-white/50" aria-hidden />
              <span className="truncate">{actif.label}</span>
            </span>
          ) : null}

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <span className="hidden items-center gap-2 rounded-full bg-white/8 py-1 pl-1 pr-3 ring-1 ring-inset ring-white/10 md:flex">
              <Avatar className="size-6">
                <AvatarImage src={fileUrl(user.pictureUrl)} alt="" />
                <AvatarFallback className="bg-white/15 text-[10px] text-white">
                  {(user.firstName?.[0] ?? user.username[0] ?? "?").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-32 truncate text-xs font-medium text-white/85">
                {user.firstName ?? user.username}
              </span>
            </span>

            <div className="text-white [&_button]:text-white [&_button:hover]:bg-white/10">
              <ThemeToggle />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-white/75 hover:bg-white/10 hover:text-white"
              render={<Link href="/dashboard" />}
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Quitter</span>
            </Button>
          </div>
        </div>

        {/* Onglets — dans le bandeau sombre, pour que la console n'ait qu'un
            seul en-tête et non deux barres empilées. */}
        <nav
          aria-label="Rubriques de la console"
          className="relative border-t border-white/8"
        >
          <ul className="no-scrollbar mx-auto flex max-w-[100rem] gap-0.5 overflow-x-auto px-2 sm:px-4">
            {CONSOLE_NAV.map((item) => {
              const courant = actif?.href === item.href;
              const Icone = item.icon;

              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={courant ? "page" : undefined}
                    className={cn(
                      // Hauteur fixe : l'en-tête de la console doit mesurer une
                      // hauteur connue pour que les en-têtes de tableau
                      // puissent s'y coller (voir `--console-entete`).
                      "group relative flex h-11 items-center gap-2 whitespace-nowrap px-3 text-sm transition-colors duration-200",
                      "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50",
                      courant
                        ? "font-semibold text-white"
                        : "text-white/55 hover:text-white/90",
                    )}
                  >
                    <Icone
                      className="size-4 transition-transform duration-200 group-hover:scale-110"
                      aria-hidden
                    />
                    {item.label}

                    {/* Le soulignement prend la teinte de la rubrique : la même
                        qui colore ensuite l'en-tête et les accents de la page,
                        ce qui relie l'onglet à ce qu'il ouvre. */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-2 bottom-0 h-[3px] rounded-t-full transition-all duration-300",
                        courant ? "opacity-100" : "opacity-0",
                      )}
                      style={{ background: item.teinte }}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Filet de marque : ferme le bandeau et le détache du contenu. */}
        <span
          aria-hidden
          className="block h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--chart-1), var(--chart-5) 45%, var(--chart-2))",
          }}
        />
      </header>

      <main className="mx-auto max-w-[100rem] px-4 pb-16 pt-6 sm:px-6 print:max-w-none print:p-0">
        {children}
      </main>

      <footer className="mx-auto max-w-[100rem] px-4 pb-8 sm:px-6">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Console d&apos;administration — les actions menées ici s&apos;appliquent
          à l&apos;ensemble de la plateforme.
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-0.5 font-medium text-foreground hover:underline"
          >
            Espace membre
            <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        </p>
      </footer>
    </div>
  );
}
