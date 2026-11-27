import {
  BookmarkCheck,
  Bot,
  Briefcase,
  Building2,
  FileText,
  Heart,
  LayoutDashboard,
  MessageCircle,
  MessagesSquare,
  Star,
  Store,
  UserCircle,
  UserSearch,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Rôle minimal requis. Absent = accessible à tout utilisateur connecté. */
  role?: Role;
  /** Clé de compteur affiché en pastille (messagerie, notifications). */
  badge?: "messages" | "notifications";
  /** Teinte de la rubrique : menu, en-tête de page, fil d'Ariane. */
  teinte?: string;
  /** Phrase courte, affichée dans la palette de commandes. */
  resume?: string;
}

export interface NavSection {
  /** Libellé en petites capitales, à la manière du tableau de bord Cloudflare. */
  label?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        label: "Tableau de bord",
        href: "/dashboard",
        icon: LayoutDashboard,
        teinte: "var(--c-indigo)",
        resume: "Votre activité et les dernières offres",
      },
    ],
  },
  {
    label: "Explorer",
    items: [
      // Le catalogue connecté est sur /recherche : /offres est la page publique
      // rendue côté serveur pour l'indexation, et deux pages ne peuvent pas
      // occuper le même chemin. Le détail d'une offre reste unique
      // (/offres/[id]) — une seule URL canonique à indexer et à partager.
      {
        label: "Rechercher",
        href: "/recherche",
        icon: Briefcase,
        teinte: "var(--c-emerald)",
        resume: "Emplois, formations, bourses et financements",
      },
      {
        label: "Favoris",
        href: "/favoris",
        icon: Heart,
        teinte: "var(--c-rose)",
        resume: "Les offres que vous avez gardées",
      },
      {
        label: "Mes retours",
        href: "/retours",
        icon: Star,
        teinte: "var(--c-amber)",
        resume: "Vos avis sur les offres",
      },
    ],
  },
  {
    label: "Mes outils",
    items: [
      {
        label: "Mon CV",
        href: "/cv",
        icon: FileText,
        teinte: "var(--c-blue)",
        resume: "Créer, importer et exporter votre CV",
      },
      {
        label: "Assistant IA",
        href: "/assistant",
        icon: Bot,
        teinte: "var(--c-violet)",
        resume: "Conseils et pistes tirées du catalogue",
      },
      {
        label: "Messagerie",
        href: "/messagerie",
        icon: MessagesSquare,
        badge: "messages",
        teinte: "var(--c-sky)",
        resume: "Conversations et groupes",
      },
    ],
  },
  {
    // Section réservée aux structures partenaires. Elle disparaît entièrement
    // pour les autres comptes : `visibleSections` écarte les entrées dont le
    // rôle ne correspond pas, puis les sections devenues vides.
    label: "Recrutement",
    items: [
      {
        label: "Mes offres",
        href: "/partenaire/offres",
        icon: Building2,
        role: "PARTENAIRE",
        teinte: "var(--c-teal)",
        resume: "Offres publiées par votre structure",
      },
      {
        label: "Rechercher un profil",
        href: "/partenaire/profils",
        icon: UserSearch,
        role: "PARTENAIRE",
        teinte: "var(--c-cyan)",
        resume: "Trouver des candidats par compétence",
      },
      {
        label: "Candidats retenus",
        href: "/partenaire/favoris",
        icon: BookmarkCheck,
        role: "PARTENAIRE",
        teinte: "var(--c-orange)",
        resume: "Les profils mis de côté",
      },
      {
        label: "Ma structure",
        href: "/partenaire/entreprise",
        icon: Store,
        role: "PARTENAIRE",
        teinte: "var(--c-lime)",
        resume: "Fiche et vitrine de votre structure",
      },
    ],
  },
  {
    label: "Compte",
    items: [
      {
        label: "Profil",
        href: "/profil",
        icon: UserCircle,
        teinte: "var(--c-fuchsia)",
        resume: "Informations, préférences et alertes",
      },
      {
        label: "Signalements",
        href: "/feedback",
        icon: MessageCircle,
        teinte: "var(--c-orange)",
        resume: "Signaler un problème, suggérer une idée",
      },
    ],
  },
  // L'administration n'apparaît pas ici : c'est un espace distinct, avec sa
  // propre coquille et sa propre barre de rubriques (`lib/console-nav.ts`). On
  // y entre par le menu du compte, et le bandeau d'encre de la console indique
  // sans ambiguïté qu'on a quitté l'espace membre.
];

/** Navigation basse mobile : cinq entrées maximum, les plus fréquentes. */
export const MOBILE_NAV: NavItem[] = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard, teinte: "var(--c-indigo)" },
  { label: "Offres", href: "/recherche", icon: Briefcase, teinte: "var(--c-emerald)" },
  { label: "Favoris", href: "/favoris", icon: Heart, teinte: "var(--c-rose)" },
  { label: "Assistant", href: "/assistant", icon: Bot, teinte: "var(--c-violet)" },
  {
    label: "Messages",
    href: "/messagerie",
    icon: MessagesSquare,
    badge: "messages",
    teinte: "var(--c-sky)",
  },
];

/** Teinte par défaut, pour une entrée qui n'en déclare pas. */
export const TEINTE_DEFAUT = "var(--primary)";

/** Teinte des entrées « Partenaires », créées depuis la console. */
export const TEINTE_PARTENAIRES = "var(--c-lime)";

/**
 * Actions rapides de la palette de commandes : ce qu'on vient faire, plutôt
 * que la page où on le fait.
 */
export const ACTIONS_RAPIDES: NavItem[] = [
  {
    label: "Explorer les offres",
    href: "/recherche",
    icon: Briefcase,
    teinte: "var(--c-emerald)",
    resume: "Parcourir tout le catalogue",
  },
  {
    label: "Mettre mon CV à jour",
    href: "/cv",
    icon: FileText,
    teinte: "var(--c-blue)",
    resume: "Le CV sert aussi à l'assistant",
  },
  {
    label: "Poser une question à l'assistant",
    href: "/assistant",
    icon: Bot,
    teinte: "var(--c-violet)",
    resume: "Une piste, une lettre, un conseil",
  },
  {
    label: "Publier une offre",
    href: "/partenaire/offres/nouvelle",
    icon: Building2,
    role: "PARTENAIRE",
    teinte: "var(--c-teal)",
    resume: "Soumise à validation avant parution",
  },
];

/**
 * Entrée du menu correspondant à l'adresse : la correspondance la plus longue
 * l'emporte (`/partenaire/offres/nouvelle` relève de « Mes offres »).
 */
export function navItemActif(
  pathname: string,
  items: NavItem[],
): NavItem | undefined {
  return items
    .filter((item) => !item.href.includes("?") && isActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function visibleSections(role: Role | undefined): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.role || item.role === role),
  })).filter((section) => section.items.length > 0);
}

/**
 * Un lien est actif s'il correspond exactement à la route, ou s'il en est le
 * préfixe segmenté. Le test sur `/` seul éviterait de marquer `/offres` actif
 * pour `/offres-archivees`.
 */
export function isActive(pathname: string, href: string): boolean {
  if (href === pathname) return true;
  return pathname.startsWith(`${href}/`);
}
