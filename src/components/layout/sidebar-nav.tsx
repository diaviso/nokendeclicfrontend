"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { isActive, visibleSections, type NavItem } from "@/lib/navigation";
import { messagingApi, notificationsApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

function Compteur({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold tabular-nums text-primary-foreground shadow-sm shadow-primary/40">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * Navigation latérale.
 *
 * L'entrée active est portée par un fond teinté et une pastille d'icône
 * colorée, pas seulement par un filet de 2 pixels : sur une liste de douze
 * entrées grises, un filet seul se repère mal, surtout sur un écran de
 * téléphone tenu à bout de bras.
 *
 * Les icônes glissent légèrement au survol. Le mouvement est court et sans
 * rebond — il confirme la cible sans attirer l'attention à lui seul.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const sections = visibleSections(user?.role);

  const { data: unreadMessages } = useQuery({
    queryKey: ["messaging", "unread"],
    queryFn: messagingApi.unreadCount,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  const { data: unreadNotifications } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: notificationsApi.unreadCount,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  const compteur = (item: NavItem) => {
    if (item.badge === "messages") return unreadMessages?.unreadCount ?? 0;
    if (item.badge === "notifications") return unreadNotifications?.count ?? 0;
    return 0;
  };

  return (
    <nav
      className="flex flex-col gap-7 px-3 py-5"
      aria-label="Navigation principale"
    >
      {sections.map((section, index) => (
        <div
          key={section.label ?? `section-${index}`}
          className="flex flex-col gap-1"
        >
          {section.label ? (
            <h2 className="mb-1 flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
              {section.label}
              <span className="h-px flex-1 bg-border" aria-hidden />
            </h2>
          ) : null}

          {section.items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  active
                    ? "bg-primary/10 font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                )}
              >
                {/* Filet vertical, ancré à gauche de la pastille. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200",
                    active ? "h-6 opacity-100" : "h-0 opacity-0",
                  )}
                />

                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "bg-transparent group-hover:bg-background",
                  )}
                >
                  <Icon
                    className="size-4 transition-transform duration-200 group-hover:scale-110"
                    aria-hidden
                  />
                </span>

                <span className="truncate">{item.label}</span>
                <Compteur count={compteur(item)} />
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
