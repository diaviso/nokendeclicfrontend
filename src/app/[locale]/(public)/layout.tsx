import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PublicActions } from "@/components/layout/public-actions";
import { SelecteurLangue } from "@/components/layout/selecteur-langue";
import { Link } from "@/i18n/navigation";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{p("droits", { annee: new Date().getFullYear() })}</p>
          <nav aria-label={p("navigation")} className="flex gap-4">
            <Link href="/offres" className="hover:text-foreground">
              {p("toutesLesOffres")}
            </Link>
            <Link href="/login" className="hover:text-foreground">
              {p("espaceMembre")}
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
