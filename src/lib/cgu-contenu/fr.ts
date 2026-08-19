/**
 * Conditions générales d'utilisation — version française.
 *
 * ⚠️ Ce texte est une base de travail rédigée par l'équipe technique. Il doit
 * être relu par un juriste avant mise en ligne, en particulier au regard de la
 * loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des données à
 * caractère personnel et des obligations déclaratives auprès de la Commission
 * de Protection des Données Personnelles (CDP).
 */
import type { ArticleCgu } from "../cgu";

export const ARTICLES_FR: ArticleCgu[] = [
  {
    id: "objet",
    titre: "1. Objet et acceptation",
    contenu: [
      "Les présentes conditions générales d'utilisation (les « Conditions ») régissent l'accès et l'usage de la plateforme Noken Declic (la « Plateforme »), accessible par navigateur web et sous forme d'application installable.",
      "La Plateforme met en relation des personnes en recherche d'opportunités (emploi, formation, bourse, volontariat, programme d'accompagnement) et les structures qui les proposent.",
      "La création d'un compte vaut acceptation pleine et entière des présentes Conditions. Toute personne qui ne les accepte pas doit renoncer à utiliser la Plateforme.",
    ],
  },
  {
    id: "definitions",
    titre: "2. Définitions",
    contenu: [
      {
        liste: [
          "« Membre » : toute personne physique disposant d'un compte, qui consulte les opportunités et peut constituer un curriculum vitae en ligne.",
          "« Partenaire » : toute structure (entreprise, association, institution, établissement de formation) dotée d'un compte lui permettant de publier des opportunités et, dans les conditions prévues à l'article 7, de consulter des profils.",
          "« Éditeur » : l'équipe Noken Declic, qui administre la Plateforme, valide les publications et assure la modération.",
          "« Opportunité » : toute annonce publiée sur la Plateforme, quelle que soit sa catégorie.",
          "« Contenu » : toute donnée déposée sur la Plateforme par un Membre ou un Partenaire (curriculum vitae, annonce, commentaire, retour d'expérience, message).",
        ],
      },
    ],
  },
  {
    id: "compte",
    titre: "3. Compte et accès",
    contenu: [
      "L'inscription est gratuite et requiert une adresse électronique valide, vérifiée par un code à six chiffres. Elle peut également s'effectuer au moyen d'un compte Google.",
      "Le Membre s'engage à fournir des informations exactes et à les tenir à jour. Il est seul responsable de la confidentialité de son mot de passe et de toute activité menée depuis son compte.",
      "L'Éditeur peut suspendre ou fermer un compte en cas de manquement aux présentes Conditions, notamment en cas de fausse déclaration, d'usurpation d'identité ou de comportement portant atteinte à autrui.",
      "Le Membre peut fermer son compte à tout moment depuis son espace personnel ou sur simple demande adressée à l'Éditeur.",
    ],
  },
  {
    id: "usage",
    titre: "4. Règles d'usage",
    contenu: [
      "Chacun s'engage à faire de la Plateforme un usage loyal. Sont notamment interdits :",
      {
        liste: [
          "la publication de contenus faux, trompeurs, diffamatoires, injurieux, haineux ou discriminatoires ;",
          "la publication d'offres frauduleuses, ou subordonnant une candidature au versement d'une somme d'argent au bénéfice de l'annonceur ;",
          "la collecte automatisée de données (aspiration, extraction massive) par quelque moyen que ce soit ;",
          "l'usurpation de l'identité d'une personne ou d'une structure ;",
          "toute tentative d'atteinte à la sécurité ou au fonctionnement de la Plateforme.",
        ],
      },
      "Tout manquement peut entraîner le retrait du contenu concerné et la fermeture du compte, sans préjudice des poursuites que l'Éditeur ou les personnes lésées jugeraient utiles.",
    ],
  },
  {
    id: "offres",
    titre: "5. Publication des opportunités et modération",
    contenu: [
      "Les opportunités sont publiées soit par l'Éditeur, soit par un Partenaire. Toute annonce déposée par un Partenaire est relue par l'Éditeur avant sa mise en ligne ; elle peut être refusée, auquel cas son auteur en reçoit le motif et peut la corriger.",
      "Toute modification apportée par un Partenaire à une annonce déjà publiée entraîne un nouvel examen avant remise en ligne.",
      "L'Éditeur n'est ni l'employeur ni l'organisateur des opportunités publiées par des tiers. Il ne garantit ni leur exactitude, ni leur disponibilité, ni l'issue d'une candidature. Il appartient à chacun de vérifier auprès de la structure concernée les informations déterminantes avant de s'engager, en particulier lorsqu'un versement est demandé.",
      "Toute annonce paraissant frauduleuse peut être signalée depuis la Plateforme ; l'Éditeur s'engage à l'examiner dans les meilleurs délais.",
    ],
  },
  {
    id: "cv",
    titre: "6. Curriculum vitae et visibilité",
    contenu: [
      "Le Membre peut constituer un curriculum vitae sur la Plateforme, le saisir directement ou l'importer depuis un document, et le modifier ou le supprimer à tout moment.",
      "Ce curriculum vitae est privé par défaut. Il n'est visible d'aucun Partenaire tant que le Membre n'a pas activé lui-même le réglage de visibilité prévu à cet effet.",
      "Le Membre peut retirer cette visibilité à tout moment, d'un simple réglage. Son profil cesse alors d'apparaître dans les recherches des Partenaires.",
    ],
  },
  {
    id: "partage",
    titre: "7. Partage des données avec les Partenaires",
    saillant: true,
    contenu: [
      "En rendant son curriculum vitae visible aux recruteurs, le Membre accepte expressément que les données qu'il y a renseignées soient communiquées aux Partenaires de la Plateforme, dans le seul cadre de la mise en relation professionnelle et du traitement des opportunités publiées.",
      "Les données ainsi communiquées comprennent notamment le parcours professionnel, les formations, les compétences, les langues, la région ou la ville déclarée et le statut professionnel.",
      "Les coordonnées directes du Membre — numéro de téléphone, adresse postale, adresse électronique — ne sont pas transmises aux Partenaires. La prise de contact s'effectue par la messagerie interne de la Plateforme, et le Membre demeure libre de ne pas y répondre.",
      "Ce partage repose sur le consentement du Membre. Son retrait, par la désactivation de la visibilité, met fin à toute nouvelle communication de ses données aux Partenaires.",
    ],
  },
  {
    id: "partenaires-obligations",
    titre: "8. Obligations des Partenaires quant aux données consultées",
    saillant: true,
    contenu: [
      "Le Partenaire qui accède aux profils des Membres s'engage à n'utiliser les données consultées que dans le cadre des opportunités publiées sur la Plateforme, c'est-à-dire aux seules fins d'identifier des candidats et de les contacter au sujet d'un poste, d'une formation ou d'un programme déterminé.",
      "Il est en conséquence interdit au Partenaire :",
      {
        liste: [
          "d'utiliser ces données à des fins de prospection commerciale, de démarchage ou d'envoi de communications sans rapport avec une opportunité ;",
          "de les céder, louer, revendre ou communiquer à un tiers, à titre gratuit ou onéreux ;",
          "de les conserver au-delà de la durée nécessaire au traitement de la candidature ou du recrutement concerné ;",
          "de les extraire massivement ou de les intégrer à un fichier constitué en dehors de la Plateforme ;",
          "de fonder une décision sur un critère discriminatoire au sens de la loi.",
        ],
      },
      "Le Partenaire demeure responsable du traitement qu'il opère sur les données auxquelles il accède et doit se conformer, pour son propre compte, à la réglementation applicable en matière de protection des données à caractère personnel.",
      "Tout manquement au présent article entraîne la suspension immédiate de l'accès aux profils, sans préjudice de la fermeture du compte et des suites judiciaires que l'Éditeur ou les Membres concernés estimeraient devoir donner.",
    ],
  },
  {
    id: "donnees",
    titre: "9. Données à caractère personnel",
    contenu: [
      "Les traitements mis en œuvre par la Plateforme sont soumis à la loi n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel et relèvent du contrôle de la Commission de Protection des Données Personnelles (CDP).",
      "Les données collectées servent à la création et à la gestion des comptes, à la mise en relation prévue aux articles 6 et 7, à l'amélioration des recommandations proposées, et à l'établissement de statistiques d'usage.",
      "Certaines informations — sexe, tranche d'âge, situation de handicap, région — sont collectées à des fins de suivi statistique de l'action menée. Elles ne sont exploitées que sous forme agrégée et ne sont jamais communiquées aux Partenaires.",
      "Conformément à la loi, chacun dispose d'un droit d'accès, de rectification, d'opposition et de suppression sur les données le concernant. Ces droits s'exercent depuis l'espace personnel ou par demande adressée à l'Éditeur, qui y répond dans les délais légaux.",
      "Les données sont conservées le temps de la vie du compte, puis supprimées ou anonymisées. Les fichiers déposés (photographies, documents) sont hébergés chez un prestataire d'infrastructure et protégés par des accès restreints.",
    ],
  },
  {
    id: "propriete",
    titre: "10. Propriété intellectuelle",
    contenu: [
      "La Plateforme, sa structure, ses interfaces et ses éléments graphiques sont protégés et demeurent la propriété de l'Éditeur.",
      "Chacun conserve la propriété des contenus qu'il dépose. En les publiant, il concède à l'Éditeur le droit de les héberger, de les afficher et de les diffuser sur la Plateforme, pour les seuls besoins du service et pendant la durée de leur publication.",
    ],
  },
  {
    id: "responsabilite",
    titre: "11. Responsabilité et disponibilité",
    contenu: [
      "L'Éditeur met en œuvre les moyens raisonnables pour assurer la disponibilité de la Plateforme, sans garantir une continuité absolue. L'accès peut être interrompu pour maintenance ou pour une cause indépendante de sa volonté.",
      "L'Éditeur ne saurait être tenu responsable des contenus publiés par des tiers, ni des conséquences d'une candidature, d'un recrutement ou d'une démarche entreprise à la suite d'une opportunité consultée sur la Plateforme.",
    ],
  },
  {
    id: "modification",
    titre: "12. Modification des Conditions",
    contenu: [
      "L'Éditeur peut faire évoluer les présentes Conditions. Toute modification substantielle donne lieu à une nouvelle version, portée à la connaissance des utilisateurs, dont l'acceptation est demandée à la connexion suivante.",
      "La poursuite de l'utilisation après acceptation vaut adhésion à la version en vigueur.",
    ],
  },
  {
    id: "droit",
    titre: "13. Droit applicable et différends",
    contenu: [
      "Les présentes Conditions sont régies par le droit sénégalais.",
      "En cas de différend, les parties s'efforcent de trouver une solution amiable. À défaut, le litige est porté devant les juridictions compétentes de Dakar.",
    ],
  },
];

/** Résumé affiché dans la boîte d'acceptation, avant l'accord. */
export const POINTS_CLES_FR = [
  "Votre curriculum vitae reste privé tant que vous n'activez pas vous-même sa visibilité aux recruteurs.",
  "Si vous l'activez, vos données de parcours sont communiquées aux partenaires, uniquement dans le cadre des opportunités publiées.",
  "Vos coordonnées directes ne leur sont jamais transmises : le contact passe par la messagerie de la plateforme.",
  "Les partenaires ne peuvent utiliser ces données que pour leurs recrutements, et ni les revendre ni les réutiliser ailleurs.",
  "Vous pouvez retirer cette visibilité, corriger ou supprimer vos données à tout moment.",
];
