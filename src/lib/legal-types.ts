/**
 * Forme commune aux documents légaux (conditions d'utilisation, politique de
 * confidentialité).
 *
 * Le contenu vit dans des modules de données plutôt que dans le JSX : un
 * juriste doit pouvoir relire et corriger le texte sans lire de balises, et le
 * même document alimente la page publique et les encarts de l'application.
 */
export interface ArticleLegal {
  id: string;
  titre: string;
  /** Paragraphes et listes, dans l'ordre de lecture. */
  contenu: (string | { liste: string[] })[];
  /** Mis en évidence : les points que le lecteur doit vraiment avoir lus. */
  saillant?: boolean;
}
