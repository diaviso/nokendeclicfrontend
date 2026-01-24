import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getImageUrl } from "@/services/api";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquare,
  Bot,
  Heart,
  Settings,
  Users,
  BarChart3,
  LogOut,
  ChevronLeft,
  Menu,
  Moon,
  Sun,
  Mail,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Offres", href: "/offres", icon: Briefcase },
  { name: "Mon CV", href: "/cv", icon: FileText },
  { name: "Messagerie", href: "/messagerie", icon: Mail },
  { name: "Mes Retours", href: "/retours", icon: MessageSquare },
  { name: "Favoris", href: "/favoris", icon: Heart },
  { name: "Assistant IA", href: "/chatbot", icon: Bot },
];

const adminNavigation = [
  { name: "Statistiques", href: "/admin", icon: BarChart3 },
  { name: "Utilisateurs", href: "/admin/users", icon: Users },
  { name: "Offres", href: "/admin/offres", icon: Briefcase },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
        collapsed ? "lg:w-16" : "lg:w-64",
        "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b dark:border-gray-700">
          {!collapsed && (
            <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">Noken</span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            {/* Close button for mobile */}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {/* Collapse button for desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 hidden lg:flex"
            >
              {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>

          {isAdmin && (
            <>
              <div className="my-4 px-3">
                {!collapsed && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administration
                  </p>
                )}
                <div className="mt-2 border-t border-gray-200" />
              </div>
              <ul className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>

        {/* User & Logout */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {!collapsed && user && (
            <div className="mb-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                {user.pictureUrl ? (
                  <img src={getImageUrl(user.pictureUrl)} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-primary">
                    {user.firstName?.[0] || user.username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.firstName || user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={cn("px-2", collapsed && "w-full")}
              title={theme === "light" ? "Mode sombre" : "Mode clair"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Link to="/profile" className="flex-1">
              <Button variant="outline" size="sm" className={cn("w-full", collapsed && "px-2")}>
                <Settings className="h-4 w-4" />
                {!collapsed && <span className="ml-2">Profil</span>}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className={cn("text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20", collapsed && "px-2")}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
