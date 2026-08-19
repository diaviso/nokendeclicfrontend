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
}

export interface NavSection {
  /** Libellé en petites capitales, à la manière du tableau de bord Cloudflare. */
  label?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Explorer",
    items: [
      // Le catalogue connecté est sur /recherche : /offres est la page publique
      // rendue côté serveur pour l'indexation, et deux pages ne peuvent pas
      // occuper le même chemin. Le détail d'une offre reste unique
      // (/offres/[id]) — une seule URL canonique à indexer et à partager.
      { label: "Rechercher", href: "/recherche", icon: Briefcase },
      { label: "Favoris", href: "/favoris", icon: Heart },
      { label: "Mes retours", href: "/retours", icon: Star },
    ],
  },
  {
    label: "Mes outils",
    items: [
      { label: "Mon CV", href: "/cv", icon: FileText },
      { label: "Assistant IA", href: "/assistant", icon: Bot },
      {
        label: "Messagerie",
        href: "/messagerie",
        icon: MessagesSquare,
        badge: "messages",
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
      },
      {
        label: "Rechercher un profil",
        href: "/partenaire/profils",
        icon: UserSearch,
        role: "PARTENAIRE",
      },
      {
        label: "Candidats retenus",
        href: "/partenaire/favoris",
        icon: BookmarkCheck,
        role: "PARTENAIRE",
      },
      {
        label: "Ma structure",
        href: "/partenaire/entreprise",
        icon: Store,
        role: "PARTENAIRE",
      },
    ],
  },
  {
    label: "Compte",
    items: [
      { label: "Profil", href: "/profil", icon: UserCircle },
      { label: "Signalements", href: "/feedback", icon: MessageCircle },
    ],
  },
  // L'administration n'apparaît pas ici : c'est un espace distinct, avec sa
  // propre coquille et sa propre barre de rubriques (`lib/console-nav.ts`). On
  // y entre par le menu du compte, et le bandeau d'encre de la console indique
  // sans ambiguïté qu'on a quitté l'espace membre.
];

/** Navigation basse mobile : cinq entrées maximum, les plus fréquentes. */
export const MOBILE_NAV: NavItem[] = [
  { label: "Accueil", href: "/dashboard", icon: LayoutDashboard },
  { label: "Offres", href: "/recherche", icon: Briefcase },
  { label: "Favoris", href: "/favoris", icon: Heart },
  { label: "Assistant", href: "/assistant", icon: Bot },
  { label: "Messages", href: "/messagerie", icon: MessagesSquare, badge: "messages" },
];

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
