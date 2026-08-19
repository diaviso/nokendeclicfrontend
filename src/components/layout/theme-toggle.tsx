"use client";

import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Sélecteur de thème, partagé par l'espace connecté, les pages publiques et
 * l'authentification.
 *
 * Les deux icônes du déclencheur sont présentes dans le balisage et
 * l'affichage se joue en CSS (`dark:hidden`) plutôt que sur la valeur du thème.
 * C'est ce qui évite une divergence d'hydratation : au rendu serveur, le thème
 * effectif n'est pas connu — il dépend du stockage local et de la préférence
 * système du visiteur.
 */
const OPTIONS = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={className}
            aria-label="Changer de thème"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => setTheme(option.value)}>
            <option.icon className="size-4" />
            {option.label}
            {theme === option.value ? (
              <Check className="ml-auto size-3.5 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
