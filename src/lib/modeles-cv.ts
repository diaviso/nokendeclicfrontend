/**
 * Catalogue des modèles de CV.
 *
 * Séparé des composants qui les dessinent : ceux-ci portent « use client », et
 * une valeur simple exportée depuis un module client n'est pas lisible depuis un
 * composant serveur — elle y arrive sous forme de référence, pas de tableau.
 * Le catalogue vit donc ici, où les deux mondes peuvent le lire.
 */
export const MODELES = [
  {
    cle: "sobre",
    nom: "Sobre",
    description:
      "Une colonne, sans couleur, filets fins. Le format attendu par les administrations et les cabinets classiques.",
  },
  {
    cle: "moderne",
    nom: "Moderne",
    description:
      "Bandeau d'en-tête et colonne latérale. Met en avant le titre, les compétences et les langues.",
  },
  {
    cle: "compact",
    nom: "Compact",
    description:
      "Dense et resserré, pensé pour tenir sur une seule page même avec un parcours fourni.",
  },
  {
    cle: "editorial",
    nom: "Éditorial",
    description:
      "Titrage en serif contrasté sur papier crème, accents terre cuite. Une allure de revue, pour les métiers où la présentation compte.",
  },
  {
    cle: "prisme",
    nom: "Prisme",
    description:
      "Bandeau en dégradé, grotesque géométrique et chronologie colorée. Le plus affirmé des cinq.",
  },
] as const;

export type ModeleCV = (typeof MODELES)[number]["cle"];
