import {
  BarChart3,
  Briefcase,
  Gauge,
  Layers,
  MessageCircle,
  ShieldCheck,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Rubriques de la console d'administration.
 *
 * Elles vivent à part de `lib/navigation.ts` : l'administration n'est plus une
 * section du menu de l'espace membre mais un espace distinct, avec sa propre
 * barre horizontale. Mélanger les deux listes revenait à faire cohabiter dans
 * un même menu « Mon CV » et « Supprimer un compte » — deux registres qui n'ont
 * ni la même fréquence d'usage ni les mêmes conséquences.
 */
export interface ConsoleNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Teinte propre à la rubrique, reprise par les en-têtes et les tableaux. */
  teinte: string;
}

export const CONSOLE_NAV: ConsoleNavItem[] = [
  {
    label: "Vue d'ensemble",
    href: "/admin",
    icon: Gauge,
    teinte: "var(--chart-1)",
  },
  {
    label: "Statistiques",
    href: "/admin/statistiques",
    icon: BarChart3,
    teinte: "var(--chart-1)",
  },
  {
    label: "Utilisateurs",
    href: "/admin/utilisateurs",
    icon: Users,
    teinte: "var(--chart-2)",
  },
  {
    label: "Offres",
    href: "/admin/offres",
    icon: Briefcase,
    teinte: "var(--chart-3)",
  },
  {
    label: "Validation",
    href: "/admin/moderation",
    icon: ShieldCheck,
    teinte: "var(--warning)",
  },
  {
    label: "Types d'offres",
    href: "/admin/types-offres",
    icon: Layers,
    teinte: "var(--chart-4)",
  },
  {
    label: "Vitrine",
    href: "/admin/vitrine",
    icon: Store,
    teinte: "var(--chart-3)",
  },
  {
    label: "Signalements",
    href: "/admin/feedback",
    icon: MessageCircle,
    teinte: "var(--chart-5)",
  },
];

/**
 * Rubrique active.
 *
 * `/admin` est le préfixe de toutes les autres : sans l'égalité stricte, la vue
 * d'ensemble resterait allumée sur chaque page de la console.
 */
export function consoleItemActif(pathname: string): ConsoleNavItem | undefined {
  return CONSOLE_NAV.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}
