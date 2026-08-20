import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Bot, FileText, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { offresServerApi } from "@/lib/api/offres";
import { typesOffresServerApi } from "@/lib/api/types-offres";
import { formatNumber } from "@/lib/format";

/**
 * Cadre des pages d'authentification : formulaire à gauche, panneau illustré à
 * droite.
 *
 * Le panneau affiche des chiffres réels plutôt que des valeurs écrites en dur —
 * le nombre de types d'offres est décidé au back-office, l'inscrire ici le
 * rendrait faux au premier ajout. En cas d'API indisponible, les chiffres
 * disparaissent et le panneau reste présentable.
 */
async function getChiffres() {
  try {
    const [offres, types] = await Promise.all([
      offresServerApi.list({ limit: 1 }),
      typesOffresServerApi.list(),
    ]);
    return { offres: offres.total, types: types.length };
  } catch {
    return null;
  }
}

const ATOUTS = [
  { icone: FileText, texte: "Un CV en ligne, réutilisable à chaque candidature" },
  { icone: Bot, texte: "Un assistant qui connaît le catalogue" },
  { icone: ShieldCheck, texte: "Des offres relues, avec leur source officielle" },
];

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const chiffres = await getChiffres();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,44%)]">
      {/* ───────────────────────────────────────────── Colonne formulaire */}
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between gap-2">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Retour
            </Link>
          </div>
        </div>

        <main
          id="contenu"
          className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10"
        >
          {children}
        </main>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Noken
        </p>
      </div>

      {/* ────────────────────────────────────────────── Panneau illustré */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/illustrations/heros-photo.webp"
          alt=""
          aria-hidden
          fill
          sizes="44vw"
          className="object-cover"
          style={{ objectPosition: "70% 40%" }}
        />

        {/* Voile de marque : il porte le contraste du texte posé dessus, et non
            l'inverse — sans lui, la lisibilité dépendrait de la zone de la
            photographie située derrière chaque ligne.

            Les couleurs sont écrites en clair plutôt que reprises de
            `--primary` : ce jeton s'éclaircit en thème sombre, et son pendant
            `--primary-foreground` s'assombrit. Le panneau serait alors du texte
            sombre sur un bleu clair — le contraste s'effondrerait. Le bleu de
            marque, lui, ne change pas avec le thème. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(200deg, oklch(0.649 0.193 252 / 0.28) 0%, oklch(0.60 0.19 252 / 0.72) 38%, oklch(0.45 0.17 252 / 0.95) 74%, oklch(0.30 0.11 252) 100%)",
          }}
          aria-hidden
        />

        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <blockquote className="max-w-md">
            <p className="text-balance text-3xl font-bold leading-tight tracking-tight">
              L&apos;emploi, la formation et les bourses réunis au même endroit.
            </p>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-white/85">
              Une plateforme pensée pour le Sénégal, avec une attention
              particulière à la Casamance : Ziguinchor, Kolda, Sédhiou,
              Oussouye.
            </p>
          </blockquote>

          <ul className="mt-9 space-y-3">
            {ATOUTS.map((atout) => {
              const Icone = atout.icone;
              return (
                <li key={atout.texte} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/15 backdrop-blur">
                    <Icone className="size-4" aria-hidden />
                  </span>
                  <span className="text-base text-white/90">
                    {atout.texte}
                  </span>
                </li>
              );
            })}
          </ul>

          {chiffres ? (
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/20 pt-8">
              {[
                { valeur: formatNumber(chiffres.offres), libelle: "opportunités" },
                { valeur: String(chiffres.types), libelle: "types d'offres" },
                { valeur: "14", libelle: "régions couvertes" },
              ].map((item) => (
                <div key={item.libelle}>
                  <dt className="text-3xl font-bold tabular-nums">{item.valeur}</dt>
                  <dd className="mt-1 text-sm text-white/75">
                    {item.libelle}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
