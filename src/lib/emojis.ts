/**
 * Jeu d'émojis proposé à la saisie.
 *
 * Une sélection écrite à la main plutôt qu'un jeu complet chargé depuis une
 * bibliothèque : le référentiel Unicode complet pèse près d'un mégaoctet une
 * fois indexé pour la recherche, pour un usage — ponctuer un message, réagir à
 * une offre — que trois cents symboles couvrent largement. Sur une connexion
 * mobile sénégalaise, ce mégaoctet se paie à chaque premier chargement.
 *
 * Les mots-clés sont en français, sans accent : la recherche compare des
 * chaînes déjà normalisées, et personne ne tape « café » avec l'accent quand il
 * cherche vite.
 */
export interface CategorieEmojis {
  cle: string;
  libelle: string;
  /** Émoji servant d'onglet. */
  onglet: string;
  emojis: { symbole: string; mots: string }[];
}

export const CATEGORIES_EMOJIS: CategorieEmojis[] = [
  {
    cle: "frequents",
    libelle: "Fréquents",
    onglet: "⭐",
    emojis: [
      { symbole: "👍", mots: "pouce bien ok daccord super" },
      { symbole: "🙏", mots: "merci priere svp sil vous plait" },
      { symbole: "🙂", mots: "sourire content" },
      { symbole: "😊", mots: "sourire timide content heureux" },
      { symbole: "😂", mots: "rire mdr lol drole" },
      { symbole: "❤️", mots: "coeur amour aime" },
      { symbole: "🔥", mots: "feu top excellent" },
      { symbole: "✅", mots: "valide fait coche ok termine" },
      { symbole: "🎉", mots: "fete bravo felicitations celebration" },
      { symbole: "💪", mots: "courage force motivation" },
      { symbole: "👏", mots: "bravo applaudissements felicitations" },
      { symbole: "🚀", mots: "fusee lancement demarrage rapide" },
    ],
  },
  {
    cle: "visages",
    libelle: "Visages",
    onglet: "😊",
    emojis: [
      { symbole: "😀", mots: "sourire content joie" },
      { symbole: "😃", mots: "sourire joie content" },
      { symbole: "😄", mots: "rire content joie" },
      { symbole: "😁", mots: "sourire dents content" },
      { symbole: "😆", mots: "rire fort drole" },
      { symbole: "🤣", mots: "rire mdr ptdr par terre" },
      { symbole: "😅", mots: "rire gene sueur ouf" },
      { symbole: "😉", mots: "clin doeil complice" },
      { symbole: "😍", mots: "amour coeur yeux adore" },
      { symbole: "🥰", mots: "amour tendresse coeurs" },
      { symbole: "😘", mots: "bisou baiser" },
      { symbole: "😎", mots: "lunettes cool classe" },
      { symbole: "🤩", mots: "etoiles emerveille wow" },
      { symbole: "🤔", mots: "reflexion question hmm pense" },
      { symbole: "🤗", mots: "calin accueil bienvenue" },
      { symbole: "😇", mots: "ange innocent sage" },
      { symbole: "🙃", mots: "envers ironie" },
      { symbole: "😴", mots: "dort fatigue sommeil" },
      { symbole: "😐", mots: "neutre sans avis" },
      { symbole: "😕", mots: "perplexe confus" },
      { symbole: "😔", mots: "triste decu abattu" },
      { symbole: "😢", mots: "pleure triste larme" },
      { symbole: "😭", mots: "pleure fort triste" },
      { symbole: "😮", mots: "surpris etonne oh" },
      { symbole: "😱", mots: "peur choc effraye" },
      { symbole: "😤", mots: "enerve determine" },
      { symbole: "😡", mots: "colere fache enerve" },
      { symbole: "🥺", mots: "supplie sil te plait yeux" },
      { symbole: "😬", mots: "grimace gene malaise" },
      { symbole: "🤐", mots: "silence bouche cousue secret" },
      { symbole: "😷", mots: "masque malade" },
      { symbole: "🤒", mots: "malade fievre" },
      { symbole: "🥳", mots: "fete anniversaire celebration" },
      { symbole: "🤝", mots: "poignee main accord partenariat deal" },
    ],
  },
  {
    cle: "gestes",
    libelle: "Gestes",
    onglet: "👍",
    emojis: [
      { symbole: "👋", mots: "salut bonjour au revoir coucou" },
      { symbole: "👌", mots: "parfait ok nickel" },
      { symbole: "✌️", mots: "paix victoire" },
      { symbole: "🤞", mots: "doigts croises chance espoir" },
      { symbole: "👉", mots: "pointe droite ici regarde" },
      { symbole: "👈", mots: "pointe gauche" },
      { symbole: "👇", mots: "pointe bas dessous" },
      { symbole: "☝️", mots: "pointe haut attention important" },
      { symbole: "👎", mots: "pouce bas non desaccord" },
      { symbole: "✊", mots: "poing courage solidarite" },
      { symbole: "🙌", mots: "mains levees bravo hourra" },
      { symbole: "🤲", mots: "mains ouvertes offre demande" },
      { symbole: "✍️", mots: "ecrit note redaction" },
      { symbole: "🫶", mots: "coeur mains amour merci" },
    ],
  },
  {
    cle: "travail",
    libelle: "Travail",
    onglet: "💼",
    emojis: [
      { symbole: "💼", mots: "emploi travail mallette poste job" },
      { symbole: "📄", mots: "document page cv fichier" },
      { symbole: "📑", mots: "documents dossier onglets" },
      { symbole: "📝", mots: "note redaction candidature ecrire" },
      { symbole: "📋", mots: "presse papier liste checklist" },
      { symbole: "📌", mots: "punaise epingle important" },
      { symbole: "📎", mots: "trombone piece jointe" },
      { symbole: "🗓️", mots: "calendrier date echeance planning" },
      { symbole: "⏰", mots: "reveil heure delai urgent" },
      { symbole: "⏳", mots: "sablier attente delai" },
      { symbole: "📞", mots: "telephone appel contact" },
      { symbole: "📧", mots: "email courriel message" },
      { symbole: "💻", mots: "ordinateur informatique numerique" },
      { symbole: "🖥️", mots: "ecran bureau poste" },
      { symbole: "📱", mots: "telephone mobile portable" },
      { symbole: "🏢", mots: "entreprise bureau immeuble societe" },
      { symbole: "🏛️", mots: "administration institution ministere" },
      { symbole: "🎓", mots: "diplome formation etudes universite bourse" },
      { symbole: "📚", mots: "livres etudes formation apprentissage" },
      { symbole: "🔍", mots: "recherche loupe chercher trouver" },
      { symbole: "📊", mots: "graphique statistiques donnees resultats" },
      { symbole: "📈", mots: "hausse progression croissance" },
      { symbole: "📉", mots: "baisse recul chute" },
      { symbole: "💰", mots: "argent salaire remuneration budget" },
      { symbole: "🏆", mots: "trophee reussite gagne premier" },
      { symbole: "🥇", mots: "medaille or premier gagnant" },
      { symbole: "🎯", mots: "cible objectif but precis" },
      { symbole: "🧑‍💼", mots: "cadre employe professionnel" },
      { symbole: "👩‍💻", mots: "developpeuse informatique technicienne" },
      { symbole: "👨‍🔧", mots: "technicien reparation metier" },
      { symbole: "🩺", mots: "sante medical infirmier medecin" },
      { symbole: "🚜", mots: "agriculture ferme tracteur" },
      { symbole: "🛠️", mots: "outils artisanat reparation btp" },
      { symbole: "⚖️", mots: "justice juridique droit avocat" },
    ],
  },
  {
    cle: "signaux",
    libelle: "Signaux",
    onglet: "⚠️",
    emojis: [
      { symbole: "✅", mots: "valide fait coche resolu ok" },
      { symbole: "☑️", mots: "coche case valide" },
      { symbole: "❌", mots: "croix non erreur refuse" },
      { symbole: "⚠️", mots: "attention avertissement danger prudence" },
      { symbole: "🚨", mots: "alerte urgence gyrophare critique" },
      { symbole: "🐛", mots: "bug anomalie insecte probleme" },
      { symbole: "🔧", mots: "reparation correction cle outil" },
      { symbole: "💡", mots: "idee suggestion amelioration ampoule" },
      { symbole: "❓", mots: "question interrogation" },
      { symbole: "❗", mots: "important exclamation attention" },
      { symbole: "🔒", mots: "verrou securite ferme prive" },
      { symbole: "🔓", mots: "ouvert deverrouille acces" },
      { symbole: "🔔", mots: "notification cloche alerte rappel" },
      { symbole: "📢", mots: "annonce megaphone information" },
      { symbole: "🔄", mots: "actualiser rafraichir recharger" },
      { symbole: "⭐", mots: "etoile favori important note" },
      { symbole: "🚫", mots: "interdit bloque non" },
      { symbole: "🆕", mots: "nouveau nouveaute" },
    ],
  },
  {
    cle: "objets",
    libelle: "Objets",
    onglet: "🎁",
    emojis: [
      { symbole: "🎁", mots: "cadeau surprise" },
      { symbole: "🎈", mots: "ballon fete" },
      { symbole: "🎊", mots: "confettis fete celebration" },
      { symbole: "☕", mots: "cafe pause boisson" },
      { symbole: "🍵", mots: "the ataya boisson" },
      { symbole: "🍽️", mots: "repas manger restaurant" },
      { symbole: "🚗", mots: "voiture transport deplacement" },
      { symbole: "🚌", mots: "bus transport commun" },
      { symbole: "✈️", mots: "avion voyage etranger depart" },
      { symbole: "🏠", mots: "maison logement domicile teletravail" },
      { symbole: "🌍", mots: "monde terre afrique international" },
      { symbole: "📍", mots: "lieu position localisation adresse" },
      { symbole: "🗺️", mots: "carte plan region" },
      { symbole: "☀️", mots: "soleil beau temps journee" },
      { symbole: "🌙", mots: "lune nuit soir" },
      { symbole: "🌱", mots: "pousse debut croissance nouveau" },
      { symbole: "🌟", mots: "etoile brillante reussite" },
      { symbole: "💧", mots: "eau goutte" },
    ],
  },
  {
    cle: "coeurs",
    libelle: "Cœurs",
    onglet: "❤️",
    emojis: [
      { symbole: "❤️", mots: "coeur rouge amour" },
      { symbole: "🧡", mots: "coeur orange" },
      { symbole: "💛", mots: "coeur jaune" },
      { symbole: "💚", mots: "coeur vert" },
      { symbole: "💙", mots: "coeur bleu" },
      { symbole: "💜", mots: "coeur violet" },
      { symbole: "🖤", mots: "coeur noir" },
      { symbole: "🤍", mots: "coeur blanc" },
      { symbole: "💖", mots: "coeur brillant amour" },
      { symbole: "💯", mots: "cent parfait total daccord" },
      { symbole: "✨", mots: "etincelles brillant nouveau magique" },
      { symbole: "🌈", mots: "arc en ciel espoir diversite" },
    ],
  },
];

/** Retire les diacritiques et met en minuscules, pour comparer des saisies. */
export function normaliserRecherche(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Tous les émojis à plat, pour la recherche. */
export const TOUS_LES_EMOJIS = CATEGORIES_EMOJIS.flatMap(
  (categorie) => categorie.emojis,
);
