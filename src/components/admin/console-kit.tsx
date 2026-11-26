"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ImageUp, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

/**
 * Kit des écrans de la console : dialogues d'édition, sections et champs de
 * formulaire, interrupteurs, actions de ligne, confirmation, panneaux.
 *
 * Toutes les pages CRUD s'en servent, pour que créer, modifier ou supprimer
 * se présente partout de la même façon.
 */

/* ------------------------------------------------------------ Dialogue */

const LARGEURS = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

/**
 * Dialogue d'édition : en-tête teinté avec icône, corps qui défile, pied
 * collé en bas avec les boutons. Le pied reste visible même sur un long
 * formulaire, ce qui évite de chercher « Enregistrer » en bas de page.
 */
export function ConsoleDialogue({
  ouvert = true,
  onFermer,
  titre,
  description,
  icone: Icone,
  teinte = "var(--primary)",
  taille = "md",
  pied,
  onSubmit,
  children,
}: {
  ouvert?: boolean;
  onFermer: () => void;
  titre: React.ReactNode;
  description?: React.ReactNode;
  icone?: LucideIcon;
  teinte?: string;
  taille?: keyof typeof LARGEURS;
  /** Boutons du pied (Annuler / Enregistrer…). */
  pied?: React.ReactNode;
  /** Fourni : le corps devient un formulaire, et Entrée l'envoie. */
  onSubmit?: () => void;
  children: React.ReactNode;
}) {
  const corps = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {children}
      </div>
      {pied ? (
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          {pied}
        </div>
      ) : null}
    </>
  );

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0",
          LARGEURS[taille],
        )}
      >
        <div className="relative shrink-0 overflow-hidden border-b px-5 pb-4 pt-5 pr-12 sm:px-6">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(120deg, color-mix(in oklch, ${teinte} 11%, transparent), transparent 70%)`,
            }}
          />
          <div className="relative flex items-start gap-3.5">
            {Icone ? (
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${teinte}, color-mix(in oklch, ${teinte} 70%, black))`,
                }}
              >
                <Icone className="size-5" aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold leading-tight">
                {titre}
              </DialogTitle>
              {description ? (
                <DialogDescription className="mt-1 text-sm leading-relaxed">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
          </div>
        </div>

        {onSubmit ? (
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            {corps}
          </form>
        ) : (
          corps
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------- Sections et champs */

/** Bloc de formulaire titré, avec une grille de deux colonnes sur desktop. */
export function ConsoleSection({
  titre,
  description,
  icone: Icone,
  colonnes = 2,
  className,
  children,
}: {
  titre?: string;
  description?: string;
  icone?: LucideIcon;
  colonnes?: 1 | 2 | 3;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("[&+&]:mt-6 [&+&]:border-t [&+&]:pt-6", className)}>
      {titre ? (
        <header className="mb-4 flex items-start gap-2.5">
          {Icone ? (
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Icone className="size-3.5" aria-hidden />
            </span>
          ) : null}
          <div>
            <h3 className="text-sm font-bold">{titre}</h3>
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </header>
      ) : null}
      <div
        className={cn(
          "grid gap-4",
          colonnes === 2 && "sm:grid-cols-2",
          colonnes === 3 && "sm:grid-cols-3",
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** Libellé, contrôle, aide et erreur — dans cet ordre, partout. */
export function ConsoleChamp({
  id,
  libelle,
  aide,
  erreur,
  requis,
  large,
  className,
  children,
}: {
  id?: string;
  libelle: string;
  aide?: React.ReactNode;
  erreur?: string;
  requis?: boolean;
  /** Occupe toute la largeur de la grille. */
  large?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", large && "sm:col-span-full", className)}>
      <Label htmlFor={id} className="text-[13px] font-semibold">
        {libelle}
        {requis ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {erreur ? (
        <p className="text-xs font-medium text-destructive">{erreur}</p>
      ) : aide ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{aide}</p>
      ) : null}
    </div>
  );
}

/** Option oui / non présentée en ligne, avec son explication. */
export function ConsoleInterrupteur({
  libelle,
  description,
  coche,
  onChange,
  icone: Icone,
  disabled,
  large = true,
}: {
  libelle: string;
  description?: string;
  coche: boolean;
  onChange: (coche: boolean) => void;
  icone?: LucideIcon;
  disabled?: boolean;
  large?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/60",
        coche && "border-primary/30 bg-primary/[0.04]",
        disabled && "cursor-not-allowed opacity-60",
        large && "sm:col-span-full",
      )}
    >
      {Icone ? (
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
            coche ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icone className="size-4" aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{libelle}</span>
        {description ? (
          <span className="block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <Switch
        checked={coche}
        onCheckedChange={(valeur) => onChange(Boolean(valeur))}
        disabled={disabled}
      />
    </label>
  );
}

/* ------------------------------------------------------- Choix d'image */

/**
 * Choix d'une image (logo, illustration) avec aperçu immédiat, glisser-déposer
 * et retrait. Ne fait aucun envoi : il rend le fichier choisi à l'appelant.
 */
export function ConsoleChoixImage({
  actuelle,
  fichier,
  onChange,
  libelle = "Image",
  aide = "PNG, JPG ou WebP.",
  forme = "carre",
  icone: Icone = ImageUp,
  onRetirer,
}: {
  /** Adresse de l'image déjà enregistrée. */
  actuelle?: string | null;
  fichier: File | null;
  onChange: (fichier: File | null) => void;
  libelle?: string;
  aide?: string;
  forme?: "carre" | "large";
  icone?: LucideIcon;
  /** Fourni : propose de retirer l'image enregistrée. */
  onRetirer?: () => void;
}) {
  const champ = useRef<HTMLInputElement>(null);
  const [survol, setSurvol] = useState(false);
  const apercu = useMemo(
    () => (fichier ? URL.createObjectURL(fichier) : actuelle ?? null),
    [fichier, actuelle],
  );

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setSurvol(true);
      }}
      onDragLeave={() => setSurvol(false)}
      onDrop={(event) => {
        event.preventDefault();
        setSurvol(false);
        const depose = event.dataTransfer.files?.[0];
        if (depose?.type.startsWith("image/")) onChange(depose);
      }}
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-dashed p-3 transition-colors sm:col-span-full",
        survol ? "border-primary bg-primary/5" : "bg-muted/20",
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden rounded-xl border bg-background",
          forme === "carre" ? "size-16" : "h-16 w-28",
        )}
      >
        {apercu ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={apercu} alt="" className="size-full object-contain p-1" />
        ) : (
          <Icone className="size-6 text-muted-foreground" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{libelle}</p>
        <p className="truncate text-xs text-muted-foreground">
          {fichier ? fichier.name : aide}
          {" · "}
          <span className="hidden sm:inline">glissez-déposez ou </span>
          choisissez un fichier
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <input
            ref={champ}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 rounded-lg text-xs"
            onClick={() => champ.current?.click()}
          >
            <ImageUp className="size-3.5" />
            {apercu ? "Remplacer" : "Choisir"}
          </Button>
          {fichier ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 rounded-lg text-xs"
              onClick={() => onChange(null)}
            >
              <X className="size-3.5" />
              Annuler
            </Button>
          ) : actuelle && onRetirer ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 rounded-lg text-xs text-destructive"
              onClick={onRetirer}
            >
              <Trash2 className="size-3.5" />
              Retirer
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Actions de ligne */

/** Rangée de boutons d'action, alignée à droite d'une ligne de tableau. */
export function ConsoleActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-end gap-0.5", className)}
      // Une action ne doit pas déclencher le clic de la ligne qui la porte.
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}

/**
 * Bouton d'action en icône, avec infobulle. Le ton colore le survol : neutre,
 * primaire (modifier), succès (publier) ou danger (supprimer).
 */
export function ConsoleAction({
  libelle,
  icone: Icone,
  onClick,
  href,
  cible,
  ton = "neutre",
  disabled,
  enCours,
}: {
  libelle: string;
  icone: LucideIcon;
  onClick?: () => void;
  /** Lien plutôt que bouton. */
  href?: string;
  cible?: "_blank";
  ton?: "neutre" | "primaire" | "succes" | "danger";
  disabled?: boolean;
  enCours?: boolean;
}) {
  const classes = cn(
    "grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-40",
    ton === "neutre" && "hover:bg-muted hover:text-foreground",
    ton === "primaire" && "hover:bg-primary/10 hover:text-primary",
    ton === "succes" &&
      "hover:bg-[color-mix(in_oklch,var(--success)_14%,transparent)] hover:text-[var(--success)]",
    ton === "danger" && "hover:bg-destructive/10 hover:text-destructive",
  );
  const contenu = enCours ? (
    <Loader2 className="size-4 animate-spin" aria-hidden />
  ) : (
    <Icone className="size-4" aria-hidden />
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          href ? (
            <a
              href={href}
              target={cible}
              rel={cible ? "noopener noreferrer" : undefined}
              aria-label={libelle}
              className={classes}
            />
          ) : (
            <button
              type="button"
              aria-label={libelle}
              className={classes}
              disabled={disabled || enCours}
              onClick={onClick}
            />
          )
        }
      >
        {contenu}
      </TooltipTrigger>
      <TooltipContent>{libelle}</TooltipContent>
    </Tooltip>
  );
}

/* --------------------------------------------------------- Confirmation */

interface DemandeConfirmation {
  titre: string;
  message?: React.ReactNode;
  /** Libellé du bouton de validation. */
  confirmer?: string;
  /** Action destructrice : bouton rouge et icône d'alerte. */
  danger?: boolean;
}

type Confirmer = (demande: DemandeConfirmation) => Promise<boolean>;

const ContexteConfirmation = createContext<Confirmer | null>(null);

/**
 * Remplace `window.confirm` par un dialogue de la console. Monté une fois par
 * la coquille ; les pages appellent `useConfirmation()`.
 */
export function ConsoleConfirmationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [demande, setDemande] = useState<DemandeConfirmation | null>(null);
  const resolution = useRef<((reponse: boolean) => void) | null>(null);

  const confirmer = useCallback<Confirmer>((nouvelle) => {
    resolution.current?.(false);
    setDemande(nouvelle);
    return new Promise<boolean>((resoudre) => {
      resolution.current = resoudre;
    });
  }, []);

  const repondre = (reponse: boolean) => {
    resolution.current?.(reponse);
    resolution.current = null;
    setDemande(null);
  };

  return (
    <ContexteConfirmation.Provider value={confirmer}>
      {children}
      <Dialog open={Boolean(demande)} onOpenChange={(o) => !o && repondre(false)}>
        <DialogContent className="gap-0 p-0 sm:max-w-md" showCloseButton={false}>
          <div className="flex items-start gap-4 p-6">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-full",
                demande?.danger
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              {demande?.danger ? (
                <AlertTriangle className="size-5" aria-hidden />
              ) : (
                <AlertTriangle className="size-5" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold">
                {demande?.titre}
              </DialogTitle>
              {demande?.message ? (
                <DialogDescription className="mt-1.5 text-sm leading-relaxed">
                  {demande.message}
                </DialogDescription>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t bg-muted/40 px-6 py-3.5 sm:flex-row sm:justify-end">
            <Button variant="outline" className="rounded-lg" onClick={() => repondre(false)}>
              Annuler
            </Button>
            <Button
              variant={demande?.danger ? "destructive" : "default"}
              className="rounded-lg"
              autoFocus
              onClick={() => repondre(true)}
            >
              {demande?.confirmer ?? "Confirmer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ContexteConfirmation.Provider>
  );
}

/**
 * Demande de confirmation. Hors de la console (fournisseur absent), retombe
 * sur `window.confirm` pour ne jamais exécuter une action sans accord.
 */
export function useConfirmation(): Confirmer {
  const contexte = useContext(ContexteConfirmation);
  return useCallback<Confirmer>(
    async (demande) => {
      if (contexte) return contexte(demande);
      const texte = typeof demande.message === "string" ? `\n\n${demande.message}` : "";
      return window.confirm(`${demande.titre}${texte}`);
    },
    [contexte],
  );
}

/* ------------------------------------------------------------- Panneaux */

/** Carte titrée pour les pages de détail et les formulaires en pleine page. */
export function ConsolePanneau({
  titre,
  description,
  icone: Icone,
  teinte = "var(--primary)",
  actions,
  className,
  corpsClassName,
  children,
}: {
  titre?: string;
  description?: string;
  icone?: LucideIcon;
  teinte?: string;
  actions?: React.ReactNode;
  className?: string;
  corpsClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-sm",
        className,
      )}
    >
      {titre ? (
        <header className="flex items-center gap-3 border-b px-5 py-3.5">
          {Icone ? (
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg"
              style={{
                background: `color-mix(in oklch, ${teinte} 14%, transparent)`,
                color: teinte,
              }}
            >
              <Icone className="size-4" aria-hidden />
            </span>
          ) : (
            <span
              aria-hidden
              className="h-4 w-1 shrink-0 rounded-full"
              style={{ background: teinte }}
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold">{titre}</h2>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={cn("p-5", corpsClassName)}>{children}</div>
    </section>
  );
}

/** Petite tuile chiffrée, pour les pages de détail. */
export function ConsoleChiffre({
  libelle,
  valeur,
  icone: Icone,
  teinte = "var(--primary)",
  note,
}: {
  libelle: string;
  valeur: number | string;
  icone?: LucideIcon;
  teinte?: string;
  note?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      {Icone ? (
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{
            background: `color-mix(in oklch, ${teinte} 14%, transparent)`,
            color: teinte,
          }}
        >
          <Icone className="size-5" aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-xl font-extrabold leading-none tabular-nums">
          {typeof valeur === "number" ? formatNumber(valeur) : valeur}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{libelle}</p>
        {note ? (
          <p className="truncate text-[11px] text-muted-foreground/80">{note}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Liste « libellé : valeur » des fiches de détail. */
export function ConsoleProprietes({
  lignes,
  className,
}: {
  lignes: { libelle: string; valeur: React.ReactNode; icone?: LucideIcon }[];
  className?: string;
}) {
  return (
    <dl className={cn("divide-y", className)}>
      {lignes.map(({ libelle, valeur, icone: Icone }) => (
        <div key={libelle} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
          <dt className="flex w-36 shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground">
            {Icone ? <Icone className="size-3.5" aria-hidden /> : null}
            {libelle}
          </dt>
          <dd className="min-w-0 flex-1 break-words text-sm">{valeur ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
