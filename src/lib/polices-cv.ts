import { Fraunces, Space_Grotesk } from "next/font/google";

/**
 * Polices propres aux modèles de CV.
 *
 * Déclarées à part de celles de l'application : elles n'habillent qu'un
 * document, et `next/font` ne télécharge un fichier que si du texte l'utilise
 * réellement. Les autres pages n'en portent donc pas le poids.
 *
 * Le sous-ensemble latin étendu est demandé explicitement — sans lui, les
 * caractères accentués d'un CV français retomberaient sur la police système au
 * milieu d'un mot.
 */

/** Serif à contraste marqué, pour le modèle « Éditorial ». */
export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--police-editorial",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

/** Grotesque géométrique aux terminaisons franches, pour « Prisme ». */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--police-prisme",
  display: "swap",
});

/** Classe à poser sur la feuille pour rendre les deux familles disponibles. */
export const CLASSE_POLICES_CV = `${fraunces.variable} ${spaceGrotesk.variable}`;
