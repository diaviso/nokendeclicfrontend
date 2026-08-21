"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  LogOut,
  Menu,
  ShieldAlert,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "./theme-toggle";
import { SidebarNav } from "./sidebar-nav";
import { Logo } from "./logo";
import { useAuth } from "@/hooks/use-auth";
import { LignePush } from "@/components/notifications/invite-push";
import { fileUrl, notificationsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";

function initials(first?: string | null, last?: string | null, username?: string) {
  const a = first?.[0] ?? username?.[0] ?? "?";
  const b = last?.[0] ?? "";
  return `${a}${b}`.toUpperCase();
}

function NotificationsMenu() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: notificationsApi.unreadCount,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: notificationsApi.list,
    enabled: Boolean(user),
  });

  const count = unread?.count ?? 0;

  async function markAll() {
    await notificationsApi.markAllRead();
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notifications${count ? ` (${count} non lues)` : ""}`}
          >
            <Bell className="size-4" />
            {count > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm font-medium">Notifications</span>
          {count > 0 ? (
            <button
              onClick={markAll}
              className="text-xs text-primary hover:underline"
            >
              Tout marquer comme lu
            </button>
          ) : null}
        </div>

        <ScrollArea className="max-h-80">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Aucune notification
            </p>
          ) : (
            <ul className="divide-y">
              {items.slice(0, 12).map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link ?? "#"}
                    className={cn(
                      "block px-3 py-2.5 transition-colors hover:bg-accent",
                      !n.isRead && "bg-primary/5",
                    )}
                  >
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatRelative(n.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="border-t">
          <LignePush />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      {/* Tiroir de navigation sous lg */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Ouvrir la navigation"
            >
              <Menu className="size-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-14 items-center border-b px-4">
            <Logo />
          </div>
          <ScrollArea className="h-[calc(100dvh-3.5rem)]">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="lg:hidden">
        <Logo showWordmark={false} />
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <NotificationsMenu />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="ml-1 h-9 gap-2 px-1.5"
                aria-label="Menu du compte"
              >
                <Avatar className="size-7">
                  <AvatarImage src={fileUrl(user?.pictureUrl)} alt="" />
                  <AvatarFallback className="text-[11px]">
                    {initials(user?.firstName, user?.lastName, user?.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-32 truncate text-sm md:inline">
                  {user?.firstName ?? user?.username}
                </span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            {/* En-tête d'identité — pas un DropdownMenuLabel : celui-ci rend
                un Menu.GroupLabel, qui exige un Menu.Group parent et ne décrit
                pas un groupe d'éléments ici. */}
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-medium">
                {user?.firstName
                  ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                  : user?.username}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profil" />}>
              <UserCircle className="size-4" />
              Mon profil
            </DropdownMenuItem>

            {/* Seule porte d'entrée de la console : elle ne figure plus dans le
                menu latéral, où elle voisinait des entrées du quotidien. */}
            {user?.role === "ADMIN" ? (
              <DropdownMenuItem render={<Link href="/admin" />}>
                <ShieldAlert className="size-4" />
                Console d&apos;administration
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} variant="destructive">
              <LogOut className="size-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
