/**
 * Politique de confidentialité — version française.
 *
 * ⚠️ Ce texte est une base de travail rédigée par l'équipe technique à partir
 * de ce que l'application fait réellement : les données listées correspondent
 * aux champs effectivement enregistrés, et les prestataires cités sont ceux
 * effectivement appelés. Il doit être relu par un juriste avant mise en ligne,
 * au regard de la loi sénégalaise n° 2008-12 du 25 janvier 2008 et des
 * obligations déclaratives auprès de la Commission de Protection des Données
 * Personnelles (CDP).
 */
import type { ArticleLegal } from "../legal-types";

export const ARTICLES_FR: ArticleLegal[] = [
  {
    id: "responsable",
    titre: "1. Responsable du traitement et objet",
    contenu: [
      "Noken Declic (la « Plateforme ») met en relation des personnes en recherche d'opportunités et les structures qui en proposent. Son exploitation implique le traitement de données à caractère personnel.",
      "La présente politique explique quelles données sont collectées, pourquoi, combien de temps elles sont conservées, qui peut y accéder, et comment exercer vos droits. Elle complète les conditions générales d'utilisation, qui restent le document contractuel.",
      "Les traitements sont soumis à la loi n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel et relèvent du contrôle de la Commission de Protection des Données Personnelles (CDP).",
    ],
  },
  {
    id: "donnees",
    titre: "2. Données collectées",
    contenu: [
      "Nous ne collectons que ce que vous nous fournissez et ce que le fonctionnement du service impose.",
      "Données de compte, à l'inscription :",
      {
        liste: [
          "adresse électronique, nom d'utilisateur, mot de passe (conservé sous forme chiffrée, jamais en clair) ;",
          "prénom et nom, photographie de profil si vous en déposez une ;",
          "statut professionnel, pays, région, département, commune ;",
          "date de naissance, sexe, situation de handicap et sa nature : ces informations sont facultatives et servent au suivi statistique décrit à l'article 3 ;",
          "numéro de téléphone et adresse postale, si vous les renseignez.",
        ],
      },
      "Données de curriculum vitae, si vous en constituez un :",
      {
        liste: [
          "titre professionnel, résumé, expériences, formations, compétences, langues, certifications, centres d'intérêt ;",
          "liens vers vos profils publics (site personnel, LinkedIn, dépôt de code) ;",
          "le document que vous importez, le cas échéant, dont les informations sont extraites automatiquement.",
        ],
      },
      "Données d'activité, produites par votre usage :",
      {
        liste: [
          "opportunités mises en favori, opportunités aimées, alertes créées ;",
          "retours d'expérience et commentaires que vous publiez ;",
          "messages échangés par la messagerie interne ;",
          "échanges avec l'assistant, conservés pour vous permettre de reprendre une conversation ;",
          "signalements adressés à l'équipe.",
        ],
      },
      "Données techniques : les journaux du serveur enregistrent les requêtes reçues, avec l'horodatage et un identifiant de corrélation, à des fins de sécurité et de diagnostic.",
      "La Plateforme n'utilise aucun outil de mesure d'audience tiers et ne pratique aucun suivi publicitaire.",
    ],
  },
  {
    id: "finalites",
    titre: "3. Finalités et bases juridiques",
    contenu: [
      {
        liste: [
          "Créer et gérer votre compte, vous authentifier, sécuriser l'accès — nécessaire à l'exécution du service que vous demandez.",
          "Afficher les opportunités, gérer vos favoris et vos alertes — nécessaire à l'exécution du service.",
          "Vous mettre en relation avec les structures partenaires lorsque vous rendez votre curriculum vitae visible — sur la base de votre consentement, retirable à tout moment (article 4).",
          "Vous adresser les messages liés au service : vérification d'adresse, réinitialisation de mot de passe, notifications, rappels d'échéance — nécessaire à l'exécution du service.",
          "Améliorer les recommandations qui vous sont proposées et faire fonctionner l'assistant — intérêt légitime à fournir un service utile.",
          "Produire des statistiques d'usage et de composition du public, exploitées uniquement sous forme agrégée — intérêt légitime au suivi et au compte rendu de l'action menée.",
          "Prévenir la fraude, les publications abusives et les atteintes à la sécurité — intérêt légitime à protéger les utilisateurs.",
        ],
      },
      "Les informations facultatives — sexe, date de naissance, situation de handicap — servent exclusivement au suivi statistique. Elles ne sont jamais communiquées aux partenaires, ni exploitées individuellement, et ne conditionnent en rien l'accès au service.",
    ],
  },
  {
    id: "partenaires",
    titre: "4. Partage avec les structures partenaires",
    saillant: true,
    contenu: [
      "Votre curriculum vitae est privé par défaut. Aucun partenaire n'y a accès tant que vous n'avez pas activé vous-même le réglage de visibilité prévu à cet effet.",
      "Lorsque vous l'activez, les partenaires peuvent consulter votre parcours professionnel, vos formations, vos compétences, vos langues, votre statut professionnel et la ville ou la région que vous avez déclarées.",
      "Vos coordonnées directes — numéro de téléphone, adresse postale, adresse électronique — ne leur sont jamais transmises. La prise de contact passe par la messagerie interne, et vous restez libre de ne pas répondre.",
      "Les partenaires ne peuvent utiliser ces données que dans le cadre des opportunités publiées. Il leur est interdit de les revendre, de les céder, de les réutiliser à des fins de démarchage ou de les extraire hors de la Plateforme. Ces obligations figurent aux articles 7 et 8 des conditions générales d'utilisation.",
      "Retirer la visibilité met fin à toute nouvelle communication de vos données. Un partenaire qui vous avait mis de côté conserve son annotation privée, mais votre fiche cesse de lui être consultable.",
    ],
  },
  {
    id: "prestataires",
    titre: "5. Prestataires techniques",
    contenu: [
      "La Plateforme s'appuie sur des prestataires qui interviennent pour son compte et selon ses instructions :",
      {
        liste: [
          "Railway — hébergement de l'application et de la base de données ;",
          "Cloudflare R2 — stockage des fichiers déposés : photographies de profil, documents joints aux opportunités, logos des structures ;",
          "OpenAI — traitement des requêtes adressées à l'assistant et extraction des informations d'un curriculum vitae importé. Seul le contenu nécessaire à la demande en cours est transmis ;",
          "Google — uniquement si vous choisissez de vous connecter avec un compte Google, pour vérifier votre identité auprès de ce fournisseur ;",
          "un service d'acheminement de courrier électronique, pour les messages liés au service.",
        ],
      },
      "Aucun de ces prestataires n'est autorisé à exploiter vos données pour son propre compte au titre de notre service.",
      "En dehors d'eux et des partenaires dans le cadre décrit à l'article 4, vos données ne sont communiquées à personne — sauf réquisition d'une autorité judiciaire ou administrative habilitée.",
    ],
  },
  {
    id: "conservation",
    titre: "6. Durées de conservation",
    contenu: [
      {
        liste: [
          "Compte et curriculum vitae : conservés tant que le compte existe, puis supprimés ou rendus anonymes.",
          "Messages privés et échanges avec l'assistant : conservés tant que le compte existe ; vous pouvez supprimer une conversation à tout moment.",
          "Commentaires et retours d'expérience : conservés tant qu'ils sont publiés ; vous pouvez les supprimer.",
          "Fichiers déposés : supprimés en même temps que l'élément auquel ils sont rattachés.",
          "Journaux techniques : conservés pour une durée limitée, à des fins de sécurité et de diagnostic.",
          "Statistiques agrégées : conservées sans limite de durée, puisqu'elles ne permettent plus d'identifier quiconque.",
        ],
      },
      "La fermeture du compte entraîne la suppression des données qui s'y rattachent, sous réserve de ce que la loi impose de conserver.",
    ],
  },
  {
    id: "securite",
    titre: "7. Sécurité",
    contenu: [
      "Les échanges avec la Plateforme sont chiffrés en transit. Les mots de passe sont conservés sous forme d'empreinte cryptographique et ne peuvent être relus, ni par l'équipe ni par personne d'autre.",
      "L'accès aux données est restreint aux membres de l'équipe qui en ont besoin pour administrer le service, et les fichiers déposés ne sont accessibles que par les adresses délivrées par la Plateforme.",
      "Aucun dispositif n'écarte tout risque. En cas de violation de données susceptible de vous porter préjudice, vous en serez informé et l'autorité compétente sera saisie.",
    ],
  },
  {
    id: "droits",
    titre: "8. Vos droits",
    saillant: true,
    contenu: [
      "Conformément à la loi n° 2008-12, vous disposez des droits suivants sur les données qui vous concernent :",
      {
        liste: [
          "droit d'accès : savoir quelles données sont détenues et en obtenir copie ;",
          "droit de rectification : corriger une information inexacte ou incomplète ;",
          "droit de suppression : demander l'effacement de vos données, ce que la fermeture du compte réalise ;",
          "droit d'opposition : vous opposer à un traitement fondé sur l'intérêt légitime ;",
          "retrait du consentement : désactiver à tout moment la visibilité de votre curriculum vitae, sans que cela remette en cause ce qui a été fait auparavant.",
        ],
      },
      "La plupart de ces droits s'exercent directement depuis votre espace personnel : votre profil et votre curriculum vitae sont modifiables à tout loisir, la visibilité se règle d'un geste, et la fermeture du compte est accessible depuis vos paramètres.",
      "Pour toute autre demande, écrivez-nous depuis l'espace « Signalements » de votre compte, ou par les coordonnées indiquées sur la page d'accueil. Une réponse vous est adressée dans les délais légaux.",
    ],
  },
  {
    id: "cookies",
    titre: "9. Cookies et stockage local",
    contenu: [
      "La Plateforme ne dépose aucun cookie publicitaire ni de mesure d'audience. Elle n'utilise que ce qui est nécessaire à son fonctionnement :",
      {
        liste: [
          "un cookie « NEXT_LOCALE », qui retient la langue d'affichage choisie ;",
          "dans le stockage local de votre navigateur : vos jetons de connexion, les émojis récemment utilisés, et la date à laquelle vous avez écarté la proposition d'installer l'application ;",
          "un cache de pages, géré par l'application installable, qui permet de consulter hors connexion ce que vous avez déjà ouvert.",
        ],
      },
      "Ces éléments ne servent à aucun suivi. Vider les données du site depuis votre navigateur les supprime ; vous serez alors déconnecté.",
    ],
  },
  {
    id: "transferts",
    titre: "10. Transferts hors du Sénégal",
    contenu: [
      "Les prestataires cités à l'article 5 opèrent des infrastructures situées hors du Sénégal. Vos données peuvent donc être hébergées ou traitées à l'étranger.",
      "Ces transferts s'effectuent dans le cadre des engagements contractuels pris par ces prestataires en matière de protection des données, et sous réserve des formalités requises par la loi n° 2008-12.",
    ],
  },
  {
    id: "mineurs",
    titre: "11. Personnes mineures",
    contenu: [
      "La Plateforme s'adresse à des personnes en âge de travailler ou de suivre une formation. Un compte ouvert par une personne mineure relève de l'autorisation de ses représentants légaux, qui peuvent en demander la fermeture.",
    ],
  },
  {
    id: "modification",
    titre: "12. Modification de la politique",
    contenu: [
      "La présente politique peut évoluer, notamment si le service change ou si un nouveau prestataire intervient. Toute modification substantielle est portée à la connaissance des utilisateurs, et la version en vigueur est toujours celle publiée sur cette page.",
    ],
  },
  {
    id: "reclamation",
    titre: "13. Réclamation",
    contenu: [
      "Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la Commission de Protection des Données Personnelles (CDP), autorité de contrôle au Sénégal.",
    ],
  },
];
