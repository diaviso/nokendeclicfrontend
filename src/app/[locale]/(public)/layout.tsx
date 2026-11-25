import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PublicActions } from "@/components/layout/public-actions";
import { SelecteurLangue } from "@/components/layout/selecteur-langue";
import { Link } from "@/i18n/navigation";

export default async function PublicLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  // Chaque gabarit et chaque page fixent la langue : ils sont rendus
  // séparément, et sans cet appel next-intl la chercherait dans les en-têtes,
  // ce qui rendrait la page dynamique.
  setRequestLocale((await params).locale);
  const t = await getTranslations("entete");
  const p = await getTranslations("pied");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Logo />

          <nav
            aria-label={t("navigation")}
            className="ml-4 hidden items-center gap-1 sm:flex"
          >
            <Link
              href="/offres"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("offres")}
            </Link>
            <Link
              href="/offres?typeOffre=FORMATION"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("formations")}
            </Link>
            <Link
              href="/offres?typeOffre=BOURSE"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("bourses")}
            </Link>
            <Link
              href="/partenaires"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("partenaires")}
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* `useSearchParams` impose une frontière Suspense au prérendu. */}
            <Suspense fallback={<span className="w-14" />}>
              <SelecteurLangue />
            </Suspense>
            <ThemeToggle />
            <PublicActions />
          </div>
        </div>
      </header>

      <main id="contenu" className="flex-1">
        {children}
      </main>

      <footer className="border-t">
        {/* Porteur et bailleur du projet : une mention pleine largeur, lisible
            sans chercher, et non une ligne grise noyée parmi les liens. */}
        <div className="border-b bg-primary/5">
          <p className="mx-auto max-w-6xl px-4 py-4 text-center text-sm font-medium text-foreground sm:px-6 sm:text-base">
            {p("porteDebut")}{" "}
            <a
              href="https://www.declicsud.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              {p("porteLien")}
            </a>{" "}
            {p("soutienDebut")}{" "}
            <a
              href="https://www.giz.de"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              {p("soutienLien")}
            </a>
          </p>
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1">
            <p>{p("droits", { annee: new Date().getFullYear() })}</p>
          </div>
          {/* Cinq liens ne tiennent pas sur une ligne de téléphone : sans retour à
              la ligne, le dernier dépassait de l'écran et toute la page
              défilait de côté. */}
          <nav
            aria-label={p("navigation")}
            className="flex flex-wrap gap-x-4 gap-y-2"
          >
            <Link href="/offres" className="hover:text-foreground">
              {p("toutesLesOffres")}
            </Link>
            <Link href="/partenaires" className="hover:text-foreground">
              {p("annuaire")}
            </Link>
            <Link href="/login" className="hover:text-foreground">
              {p("espaceMembre")}
            </Link>
            <Link href="/installer" className="hover:text-foreground">
              {p("installer")}
            </Link>
            <Link href="/cgu" className="hover:text-foreground">
              {p("conditions")}
            </Link>
            <Link
              href="/politique-confidentialite"
              className="hover:text-foreground"
            >
              {p("confidentialite")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
