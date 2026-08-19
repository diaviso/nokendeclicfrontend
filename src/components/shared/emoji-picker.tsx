"use client";

import { useMemo, useRef, useState } from "react";
import { Search, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CATEGORIES_EMOJIS,
  TOUS_LES_EMOJIS,
  normaliserRecherche,
} from "@/lib/emojis";
import { cn } from "@/lib/utils";

const CLE_RECENTS = "noken.emojis.recents";
const MAX_RECENTS = 16;

/** Lit les émojis récemment utilisés, en tolérant un stockage corrompu. */
function lireRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const brut = window.localStorage.getItem(CLE_RECENTS);
    const valeurs: unknown = brut ? JSON.parse(brut) : [];
    return Array.isArray(valeurs)
      ? valeurs.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    // Un JSON invalide ne doit pas empêcher d'écrire un message.
    return [];
  }
}

function memoriser(symbole: string): string[] {
  const suivants = [symbole, ...lireRecents().filter((v) => v !== symbole)].slice(
    0,
    MAX_RECENTS,
  );
  try {
    window.localStorage.setItem(CLE_RECENTS, JSON.stringify(suivants));
  } catch {
    // Stockage plein ou navigation privée : la mémoire des récents est un
    // confort, jamais une condition pour envoyer.
  }
  return suivants;
}

/**
 * Sélecteur d'émojis.
 *
 * Écrit ici plutôt qu'emprunté : les bibliothèques du domaine embarquent le
 * référentiel Unicode complet et ses images, soit près d'un mégaoctet chargé
 * pour insérer un pouce levé. Le jeu retenu (`lib/emojis.ts`) tient en quelques
 * kilooctets et couvre ce qu'on écrit réellement ici — un message, un retour
 * sur une offre, un signalement.
 *
 * Les symboles sont rendus par la police du système : c'est ce qui garantit
 * qu'ils ressemblent partout ailleurs à ce que l'utilisateur connaît de son
 * téléphone, et cela n'ajoute aucune image à charger.
 */
export function EmojiPicker({
  onChoisir,
  label = "Insérer un émoji",
  align = "start",
  className,
  disabled,
}: {
  onChoisir: (symbole: string) => void;
  label?: string;
  align?: "start" | "center" | "end";
  className?: string;
  disabled?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIES_EMOJIS[0].cle);
  // Lus à l'ouverture seulement : le stockage n'est pas réactif, et relire à
  // chaque rendu ferait clignoter la première rangée.
  const [recents, setRecents] = useState<string[]>([]);
  const champRecherche = useRef<HTMLInputElement>(null);

  const resultats = useMemo(() => {
    const requete = normaliserRecherche(recherche);
    if (!requete) return null;

    return TOUS_LES_EMOJIS.filter((emoji) =>
      emoji.mots.includes(requete),
    ).slice(0, 60);
  }, [recherche]);

  const affiches =
    resultats ??
    CATEGORIES_EMOJIS.find((c) => c.cle === categorie)?.emojis ??
    [];

  const choisir = (symbole: string) => {
    setRecents(memoriser(symbole));
    onChoisir(symbole);
  };

  return (
    <Popover
      open={ouvert}
      onOpenChange={(suivant) => {
        setOuvert(suivant);
        if (suivant) {
          setRecents(lireRecents());
          setRecherche("");
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={label}
            className={cn(
              "shrink-0 rounded-xl text-muted-foreground transition-colors hover:text-foreground",
              ouvert && "bg-accent text-foreground",
              className,
            )}
          >
            <Smile className="size-4.5" />
          </Button>
        }
      />

      <PopoverContent
        align={align}
        className="w-[19rem] gap-0 p-0"
        // Le focus va au champ de recherche plutôt qu'au premier émoji : on
        // vient presque toujours chercher un symbole précis, et la grille
        // reste atteignable à la tabulation.
        initialFocus={champRecherche}
      >
        <div className="border-b p-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              ref={champRecherche}
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher : merci, bravo, bug…"
              aria-label="Rechercher un émoji"
              className="h-8 rounded-lg border-transparent bg-muted/60 pl-8 text-sm shadow-none focus-visible:border-input focus-visible:bg-background"
            />
          </div>
        </div>

        {!resultats && recents.length > 0 ? (
          <div className="border-b px-2 py-1.5">
            <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Récents
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {recents.map((symbole) => (
                <button
                  key={`recent-${symbole}`}
                  type="button"
                  onClick={() => choisir(symbole)}
                  className="grid aspect-square place-items-center rounded-lg text-xl transition-transform duration-150 hover:scale-125 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  {symbole}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="max-h-56 overflow-y-auto p-2">
          {affiches.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun émoji pour « {recherche} ».
            </p>
          ) : (
            <div className="grid grid-cols-8 gap-0.5">
              {affiches.map((emoji) => (
                <button
                  key={emoji.symbole}
                  type="button"
                  title={emoji.mots.split(" ")[0]}
                  onClick={() => choisir(emoji.symbole)}
                  className="grid aspect-square place-items-center rounded-lg text-xl transition-transform duration-150 hover:scale-125 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  {emoji.symbole}
                </button>
              ))}
            </div>
          )}
        </div>

        {!resultats ? (
          <div
            role="tablist"
            aria-label="Catégories d'émojis"
            className="flex justify-between gap-0.5 border-t p-1"
          >
            {CATEGORIES_EMOJIS.map((c) => {
              const actif = c.cle === categorie;
              return (
                <button
                  key={c.cle}
                  type="button"
                  role="tab"
                  aria-selected={actif}
                  title={c.libelle}
                  onClick={() => setCategorie(c.cle)}
                  className={cn(
                    "relative grid size-8 place-items-center rounded-lg text-base transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    actif ? "bg-accent" : "opacity-60 hover:opacity-100",
                  )}
                >
                  {c.onglet}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-2 bottom-0.5 h-0.5 rounded-full bg-primary transition-opacity",
                      actif ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="sr-only">{c.libelle}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

/** Nombre de tentatives avant d'abandonner le repositionnement du curseur. */
const TENTATIVES_MAX = 30;

/**
 * Insère un symbole à la position du curseur dans un champ de saisie.
 *
 * Ajouter systématiquement en fin de texte serait plus simple, mais fait
 * ressortir l'émoji au mauvais endroit dès qu'on revient corriger une phrase
 * déjà écrite.
 *
 * Le curseur ne peut pas être replacé tout de suite : le champ est contrôlé,
 * et React réécrira sa valeur au prochain rendu — or affecter `value` sur un
 * champ de saisie remet le curseur en fin de texte. On attend donc que la
 * nouvelle valeur soit effectivement posée avant de le repositionner, en
 * réessayant tant qu'elle ne l'est pas : le rendu peut être différé d'une ou
 * plusieurs tâches. Le compteur borne l'attente au cas où l'appelant
 * ignorerait la valeur renvoyée.
 *
 * L'attente passe par un minuteur et non par `requestAnimationFrame` : ce
 * dernier ne s'exécute pas du tout dans un onglet masqué, et le curseur
 * resterait alors bloqué en fin de texte au retour sur l'onglet.
 */
export function insererAuCurseur(
  champ: HTMLTextAreaElement | HTMLInputElement | null,
  valeur: string,
  symbole: string,
): string {
  if (!champ) return valeur + symbole;

  const debut = champ.selectionStart ?? valeur.length;
  const fin = champ.selectionEnd ?? valeur.length;
  const suivant = valeur.slice(0, debut) + symbole + valeur.slice(fin);
  const position = debut + symbole.length;

  let restant = TENTATIVES_MAX;

  const replacer = () => {
    if (champ.value !== suivant && restant > 0) {
      restant -= 1;
      setTimeout(replacer, 0);
      return;
    }

    champ.focus();
    champ.setSelectionRange(position, position);
  };

  setTimeout(replacer, 0);

  return suivant;
}
