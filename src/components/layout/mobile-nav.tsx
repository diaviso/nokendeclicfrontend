"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { isActive, MOBILE_NAV } from "@/lib/navigation";
import { messagingApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

/**
 * Barre de navigation basse, affichée sous `lg`.
 * Cinq entrées maximum : au-delà, les cibles deviennent trop étroites au pouce.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const { data: unread } = useQuery({
    queryKey: ["messaging", "unread"],
    queryFn: messagingApi.unreadCount,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  return (
    <nav
      aria-label="Navigation rapide"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {MOBILE_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const count =
            item.badge === "messages" ? (unread?.unreadCount ?? 0) : 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* Trait de position en haut de l'onglet, comme un signet : au
                    pouce, la couleur seule ne suffit pas à repérer où l'on est. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-primary transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />

                <span
                  className={cn(
                    "relative grid size-9 place-items-center rounded-xl transition-all duration-200",
                    active ? "bg-primary/12" : "bg-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 transition-transform duration-200",
                      active && "scale-110",
                    )}
                    aria-hidden
                  />
                  {count > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                      {count > 9 ? "9+" : count}
                    </span>
                  ) : null}
                </span>
                <span className="truncate px-0.5">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
