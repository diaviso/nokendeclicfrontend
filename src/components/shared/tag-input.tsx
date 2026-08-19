"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Saisie de liste (compétences, langues, certifications, centres d'intérêt).
 * Validation à Entrée ou à la virgule ; Retour arrière sur un champ vide
 * retire la dernière étiquette — comportement attendu de ce type de champ.
 */
export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  max = 50,
  className,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const entry = raw.trim();
    if (!entry) return;
    if (value.length >= max) return;
    // Comparaison insensible à la casse pour éviter « React » et « react ».
    if (value.some((v) => v.toLowerCase() === entry.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, entry]);
    setDraft("");
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-md border p-1.5",
          "focus-within:ring-2 focus-within:ring-ring/40",
        )}
      >
        {value.map((tag, index) => (
          <Badge key={`${tag}-${index}`} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              aria-label={`Retirer ${tag}`}
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}

        <Input
          id={id}
          value={draft}
          placeholder={value.length === 0 ? placeholder : undefined}
          onChange={(e) => {
            const v = e.target.value;
            if (v.endsWith(",")) add(v.slice(0, -1));
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => add(draft)}
          className="h-7 min-w-32 flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Entrée ou virgule pour valider · {value.length}/{max}
      </p>
    </div>
  );
}
