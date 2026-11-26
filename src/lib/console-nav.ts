import {
  BarChart3,
  Bot,
  Briefcase,
  Eye,
  FilePlus2,
  Gauge,
  Images,
  Layers,
  Megaphone,
  MessageCircle,
  QrCode,
  School,
  ShieldCheck,
  Star,
  Store,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Rubriques de la console d'administration.
 *
 * Elles vivent à part de `lib/navigation.ts` : l'administration n'est pas une
 * section du menu de l'espace membre mais un espace distinct, avec sa propre
 * barre latérale. Chaque rubrique porte une teinte franche, reprise par
 * l'en-tête de la page, ses tuiles et ses tableaux.
 */
export interface ConsoleNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Teinte propre à la rubrique, reprise par les en-têtes et les tableaux. */
  teinte: string;
  /** Phrase courte, affichée dans la palette de commandes. */
  resume?: string;
  /** Clé du compteur « à traiter » affiché en pastille dans le menu. */
  compteur?: "validation" | "signalements";
}

export interface ConsoleNavGroupe {
  titre: string;
  items: ConsoleNavItem[];
}

export const CONSOLE_GROUPES: ConsoleNavGroupe[] = [
  {
    titre: "Pilotage",
    items: [
      {
        label: "Vue d'ensemble",
        href: "/admin",
        icon: Gauge,
        teinte: "var(--c-indigo)",
        resume: "Tableau de bord et activité récente",
      },
      {
        label: "Statistiques",
        href: "/admin/statistiques",
        icon: BarChart3,
        teinte: "var(--c-blue)",
        resume: "Rapport d'activité détaillé et exports",
      },
      {
        label: "Consultations",
        href: "/admin/consultations",
        icon: Eye,
        teinte: "var(--c-sky)",
        resume: "Qui consulte quelles offres",
      },
    ],
  },
  {
    titre: "Contenus",
    items: [
      {
        label: "Offres",
        href: "/admin/offres",
        icon: Briefcase,
        teinte: "var(--c-emerald)",
        resume: "Catalogue complet des offres",
      },
      {
        label: "Validation",
        href: "/admin/moderation",
        icon: ShieldCheck,
        teinte: "var(--c-amber)",
        resume: "Offres déposées en attente de décision",
        compteur: "validation",
      },
      {
        label: "Annonces",
        href: "/admin/annonces",
        icon: Megaphone,
        teinte: "var(--c-orange)",
        resume: "Annonces diffusées aux membres",
      },
      {
        label: "Médiathèque",
        href: "/admin/mediatheque",
        icon: Images,
        teinte: "var(--c-cyan)",
        resume: "Images et fichiers déposés",
      },
      {
        label: "Types d'offres",
        href: "/admin/types-offres",
        icon: Layers,
        teinte: "var(--c-teal)",
        resume: "Catégories, champs et couleurs",
      },
    ],
  },
  {
    titre: "Communauté",
    items: [
      {
        label: "Utilisateurs",
        href: "/admin/utilisateurs",
        icon: Users,
        teinte: "var(--c-blue)",
        resume: "Comptes, rôles et accès",
      },
      {
        label: "Partenaires",
        href: "/admin/vitrine",
        icon: Store,
        teinte: "var(--c-lime)",
        resume: "Structures partenaires et vitrine",
      },
      {
        label: "Centres de formation",
        href: "/admin/centres",
        icon: School,
        teinte: "var(--c-teal)",
        resume: "Centres et formations dispensées",
      },
      {
        label: "Retours",
        href: "/admin/retours",
        icon: Star,
        teinte: "var(--c-orange)",
        resume: "Retours des structures sur les offres",
      },
      {
        label: "Signalements",
        href: "/admin/feedback",
        icon: MessageCircle,
        teinte: "var(--c-rose)",
        resume: "Anomalies et suggestions des membres",
        compteur: "signalements",
      },
    ],
  },
  {
    titre: "Outils",
    items: [
      {
        label: "Agents IA",
        href: "/admin/agents-ia",
        icon: Bot,
        teinte: "var(--c-violet)",
        resume: "Assistants, scénarios et réglages",
      },
    ],
  },
];

/** Liste à plat, pour les recherches de rubrique active. */
export const CONSOLE_NAV: ConsoleNavItem[] = CONSOLE_GROUPES.flatMap(
  (groupe) => groupe.items,
);

/**
 * Actions rapides : les sous-pages qui n'ont pas de place dans le menu mais
 * qu'on veut pouvoir ouvrir d'un geste (palette de commandes, tableau de bord).
 */
export const CONSOLE_ACTIONS: ConsoleNavItem[] = [
  {
    label: "Créer une offre",
    href: "/admin/offres/nouvelle",
    icon: FilePlus2,
    teinte: "var(--c-emerald)",
    resume: "Publier une nouvelle offre",
  },
  {
    label: "Nouveau type d'offre",
    href: "/admin/types-offres/nouveau",
    icon: Layers,
    teinte: "var(--c-teal)",
    resume: "Ajouter une catégorie d'offres",
  },
  {
    label: "Importer des utilisateurs",
    href: "/admin/utilisateurs/import",
    icon: Upload,
    teinte: "var(--c-violet)",
    resume: "Créer des comptes depuis un fichier",
  },
  {
    label: "Affiche QR d'inscription",
    href: "/admin/utilisateurs/affiche-qr",
    icon: QrCode,
    teinte: "var(--c-indigo)",
    resume: "Imprimer l'affiche d'inscription",
  },
];

/**
 * Rubrique active.
 *
 * `/admin` est le préfixe de toutes les autres : la correspondance la plus
 * longue l'emporte, sinon la vue d'ensemble resterait allumée partout.
 */
export function consoleItemActif(pathname: string): ConsoleNavItem | undefined {
  return CONSOLE_NAV.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

/** Action rapide correspondant à l'adresse, pour le fil d'Ariane. */
export function consoleActionActive(pathname: string): ConsoleNavItem | undefined {
  return CONSOLE_ACTIONS.find((action) => pathname === action.href);
}
