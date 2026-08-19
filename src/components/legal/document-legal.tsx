import { ArrowLeft, Languages, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { ArticleLegal } from "@/lib/legal-types";

/**
 * Mise en page d'un document légal.
 *
 * Les conditions d'utilisation et la politique de confidentialité se lisent de
 * la même façon : un sommaire en tête parce qu'on y revient pour un point
 * précis, des articles ancrés pour pouvoir en citer un par son adresse, et un
 * encadré pour les passages qui engagent vraiment le lecteur.
 *
 * Une seule mise en page pour les deux : ce sont les textes qui diffèrent, pas
 * la manière de les présenter.
 */
export function DocumentLegal({
  titre,
  version,
  sousTitre,
  avisTraduction,
  articles,
  libelles,
  pied,
}: {
  titre: string;
  /** Affiché en pastille au-dessus du titre. */
  version: string;
  sousTitre: string;
  /** Présent uniquement quand le texte lu n'est pas celui qui fait foi. */
  avisTraduction?: string;
  articles: ArticleLegal[];
  libelles: { accueil: string; sommaire: string };
  pied: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2 rounded-lg"
        render={<Link href="/" />}
      >
        <ArrowLeft className="size-4" />
        {libelles.accueil}
      </Button>

      <header className="border-b pb-8">
        <span className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden />
          {version}
        </span>
        <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          {titre}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">{sousTitre}</p>

        {/* Le lecteur doit savoir, avant d'aller plus loin, que le texte qui
            l'engage n'est pas celui qu'il a sous les yeux. */}
        {avisTraduction ? (
          <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
            <Languages className="mt-0.5 size-4 shrink-0" aria-hidden />
            {avisTraduction}
          </p>
        ) : null}
      </header>

      <nav
        aria-label={libelles.sommaire}
        className="mt-8 rounded-2xl border bg-muted/25 p-5"
      >
        <p className="mb-3 text-sm font-bold">{libelles.sommaire}</p>
        <ol className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {articles.map((article) => (
            <li key={article.id}>
              <a
                href={`#${article.id}`}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {article.titre}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {articles.map((article) => (
          <section
            key={article.id}
            id={article.id}
            // `scroll-mt` compense l'en-tête collant : sans lui, une ancre
            // place le titre juste dessous, hors de vue.
            className="scroll-mt-24"
          >
            <h2 className="text-xl font-bold tracking-tight">{article.titre}</h2>

            <div
              className={
                article.saillant
                  ? "mt-3 space-y-3 rounded-2xl border-l-4 border-primary bg-primary/[0.04] py-4 pl-5 pr-4"
                  : "mt-3 space-y-3"
              }
            >
              {article.contenu.map((bloc, rang) =>
                typeof bloc === "string" ? (
                  <p
                    key={rang}
                    className="text-base leading-relaxed text-muted-foreground"
                  >
                    {bloc}
                  </p>
                ) : (
                  <ul key={rang} className="space-y-2">
                    {bloc.liste.map((element) => (
                      <li key={element} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                        />
                        <span className="text-base leading-relaxed text-muted-foreground">
                          {element}
                        </span>
                      </li>
                    ))}
                  </ul>
                ),
              )}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-14 border-t pt-8">
        <p className="text-sm text-muted-foreground">{pied}</p>
      </footer>
    </div>
  );
}
