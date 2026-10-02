"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  ImageIcon,
  ImagePlus,
  Images,
  Loader2,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useDebounced } from "@/hooks/use-debounced";
import {
  errorMessage,
  mediasApi,
  type FiltreMedias,
  type TriMedias,
} from "@/lib/api";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/types";

/** Aligné sur le serveur : une photo de téléphone passe, elle sera réduite. */
export const TAILLE_MAX_IMAGE = 12 * 1024 * 1024;
const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp"];

export function verifierImage(fichier: File): string | null {
  if (!TYPES_ACCEPTES.includes(fichier.type)) {
    return "L'image doit être au format JPEG, PNG ou WebP.";
  }
  if (fichier.size > TAILLE_MAX_IMAGE) {
    return "Image trop lourde : 12 Mo au maximum.";
  }
  return null;
}

/** « photo_bourse-2026.jpg » → « photo bourse 2026 », comme le serveur. */
function nomDepuisFichier(nom: string): string {
  return nom
    .replace(/\.[^.]+$/, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

const selectClass =
  "h-9 rounded-md border bg-transparent px-2.5 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function libelleUtilisations(n: number): string {
  if (n === 0) return "Non utilisée";
  return `${n} offre${n > 1 ? "s" : ""}`;
}

/* ------------------------------------------------------------ données --- */

export function useMedias(
  filtres: { q: string; filtre: FiltreMedias; tri: TriMedias },
  actif = true,
) {
  const q = useDebounced(filtres.q.trim());
  return useInfiniteQuery({
    queryKey: ["medias", { q, filtre: filtres.filtre, tri: filtres.tri }],
    queryFn: ({ pageParam }) =>
      mediasApi.lister({
        q,
        filtre: filtres.filtre,
        tri: filtres.tri,
        page: pageParam,
        limite: 24,
      }),
    initialPageParam: 1,
    // Le dialogue est monté avec le formulaire : rien n'est chargé tant
    // qu'on ne l'ouvre pas.
    enabled: actif,
    getNextPageParam: (derniere) =>
      derniere.page < derniere.pages ? derniere.page + 1 : undefined,
    // Pendant la frappe, la grille précédente reste affichée plutôt que de
    // clignoter vers un état vide à chaque lettre.
    placeholderData: (precedent) => precedent,
  });
}

/* ------------------------------------------------------------- filtres -- */

export function BarreFiltresMedias({
  q,
  onQ,
  filtre,
  onFiltre,
  tri,
  onTri,
}: {
  q: string;
  onQ: (q: string) => void;
  filtre: FiltreMedias;
  onFiltre: (f: FiltreMedias) => void;
  tri: TriMedias;
  onTri: (t: TriMedias) => void;
}) {
  const { user } = useAuth();
  const admin = user?.role === "ADMIN";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 basis-48">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Nom, description ou offre qui l'utilise…"
          aria-label="Rechercher une image"
          className="pl-8"
        />
      </div>
      <select
        aria-label="Filtrer les images"
        className={selectClass}
        value={filtre}
        onChange={(e) => onFiltre(e.target.value as FiltreMedias)}
      >
        <option value="toutes">Toutes</option>
        <option value="miennes">Mes images</option>
        <option value="inutilisees">Non utilisées</option>
        <option value="communes">
          {admin ? "Partagées avec les partenaires" : "Banque commune"}
        </option>
      </select>
      <select
        aria-label="Trier les images"
        className={selectClass}
        value={tri}
        onChange={(e) => onTri(e.target.value as TriMedias)}
      >
        <option value="recentes">Les plus récentes</option>
        <option value="utilisees">Les plus utilisées</option>
      </select>
    </div>
  );
}

/* -------------------------------------------------------------- grille -- */

export function GrilleMedias({
  medias,
  chargement,
  selection,
  actuelle,
  onSelection,
  onValider,
  actions,
  vide,
}: {
  medias: Media[];
  chargement?: boolean;
  /** Mode choix : l'image sélectionnée. */
  selection?: number | null;
  /** Couverture en place, signalée sans être présélectionnée. */
  actuelle?: number | null;
  onSelection?: (media: Media) => void;
  /** Double-clic : choisir sans passer par le bouton. */
  onValider?: (media: Media) => void;
  /** Mode gestion : boutons propres à chaque image. */
  actions?: (media: Media) => React.ReactNode;
  vide?: React.ReactNode;
}) {
  if (chargement) {
    return (
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-video animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }
  if (!medias.length) return <>{vide}</>;

  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
      {medias.map((media) => {
        const choisie = selection === media.id;
        const vignette = (
          <>
            <span className="relative block aspect-video w-full overflow-hidden rounded-md bg-muted">
              <Image
                src={media.url}
                alt={media.alt ?? ""}
                fill
                sizes="(max-width: 640px) 45vw, 200px"
                className="object-cover"
              />
              {choisie ? (
                <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                  <Check className="size-3.5" aria-hidden />
                </span>
              ) : null}
              {actuelle === media.id ? (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
                  Actuelle
                </span>
              ) : null}
              {media.commune ? (
                <span
                  className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium"
                  title="Visible des partenaires"
                >
                  <Users className="size-3" aria-hidden />
                  Commune
                </span>
              ) : null}
            </span>
            <span className="mt-1.5 block min-w-0 px-0.5 text-left">
              <span className="block truncate text-xs font-medium" title={media.nom}>
                {media.nom}
              </span>
              <span
                className={cn(
                  "block text-[11px]",
                  media.utilisations === 0
                    ? "text-muted-foreground"
                    : "text-foreground/70",
                )}
              >
                {libelleUtilisations(media.utilisations)}
                {media.taille ? ` · ${formatFileSize(media.taille)}` : ""}
              </span>
            </span>
          </>
        );

        return (
          <li key={media.id} className="min-w-0">
            {onSelection ? (
              <button
                type="button"
                aria-pressed={choisie}
                onClick={() => onSelection(media)}
                onDoubleClick={() => onValider?.(media)}
                className={cn(
                  "block w-full rounded-lg p-1 outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                  choisie
                    ? "bg-primary/10 ring-2 ring-primary"
                    : "hover:bg-muted",
                )}
              >
                {vignette}
              </button>
            ) : (
              <div className="rounded-lg border p-1">
                {vignette}
                {actions ? (
                  <div className="mt-1 flex flex-wrap gap-1 px-0.5 pb-0.5">
                    {actions(media)}
                  </div>
                ) : null}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------- import -- */

export function ZoneImport({
  onImportee,
  libelleBouton = "Ajouter à la médiathèque",
}: {
  onImportee: (media: Media, existait: boolean) => void;
  libelleBouton?: string;
}) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [nom, setNom] = useState("");
  const [alt, setAlt] = useState("");
  const [survol, setSurvol] = useState(false);

  // L'URL d'aperçu suit le fichier qui la crée, et est libérée avec lui.
  const [apercu, setApercu] = useState<string | null>(null);
  const apercuRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (apercuRef.current) URL.revokeObjectURL(apercuRef.current);
    },
    [],
  );

  function prendre(f?: File | null) {
    if (!f) return;
    const erreur = verifierImage(f);
    if (erreur) {
      toast.error("Fichier refusé", { description: erreur });
      return;
    }
    if (apercuRef.current) URL.revokeObjectURL(apercuRef.current);
    const url = URL.createObjectURL(f);
    apercuRef.current = url;
    setApercu(url);
    setFichier(f);
    setNom(nomDepuisFichier(f.name));
  }

  const envoi = useMutation({
    mutationFn: () =>
      mediasApi.deposer(fichier!, {
        nom: nom.trim() || undefined,
        alt: alt.trim() || undefined,
      }),
    onSuccess: async ({ media, existait, tailleEnvoyee }) => {
      await queryClient.invalidateQueries({ queryKey: ["medias"] });
      if (existait) {
        toast.success("Image déjà dans la médiathèque", {
          description:
            "Elle est réutilisée telle quelle : aucune copie n'a été stockée.",
        });
      } else {
        toast.success("Image ajoutée", {
          description:
            media.taille && tailleEnvoyee > media.taille
              ? `Allégée de ${formatFileSize(tailleEnvoyee)} à ${formatFileSize(media.taille)}.`
              : undefined,
        });
      }
      onImportee(media, existait);
    },
    onError: (erreur) =>
      toast.error("Envoi impossible", { description: errorMessage(erreur) }),
  });

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          prendre(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative grid w-full place-items-center overflow-hidden rounded-lg border-2 border-dashed text-center transition",
          apercu ? "aspect-video" : "h-40",
          survol ? "border-primary bg-primary/5" : "hover:bg-muted/60",
        )}
      >
        {apercu ? (
          // Aperçu d'un fichier local : `next/image` ne sait pas optimiser une
          // URL d'objet, la balise native est ici la bonne.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={apercu} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-4 text-muted-foreground">
            <ImagePlus className="size-6" aria-hidden />
            <span className="text-sm font-medium text-foreground">
              Glissez une image ici ou cliquez pour choisir
            </span>
            <span className="text-xs">
              JPEG, PNG ou WebP, 12 Mo au maximum — réduite et allégée
              automatiquement.
            </span>
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept={TYPES_ACCEPTES.join(",")}
        className="sr-only"
        onChange={(e) => {
          prendre(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {fichier ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <Label htmlFor="media-nom">Nom</Label>
            <Input
              id="media-nom"
              className="mt-1.5"
              maxLength={120}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Pour la retrouver plus tard"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="media-alt">Texte alternatif</Label>
            <Input
              id="media-alt"
              className="mt-1.5"
              maxLength={300}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Ce que montre l'image"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {fichier.name} · {formatFileSize(fichier.size)}
            </span>
            <Button
              type="button"
              disabled={envoi.isPending}
              onClick={() => envoi.mutate()}
            >
              {envoi.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {libelleBouton}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------- fenêtre de choix -- */

export function DialogueMediatheque({
  ouvert,
  onOuvertChange,
  selectionInitiale,
  onChoisir,
}: {
  ouvert: boolean;
  onOuvertChange: (ouvert: boolean) => void;
  selectionInitiale?: number | null;
  onChoisir: (media: Media) => void;
}) {
  const [onglet, setOnglet] = useState<"bibliotheque" | "importer">(
    "bibliotheque",
  );
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<FiltreMedias>("toutes");
  const [tri, setTri] = useState<TriMedias>("recentes");
  const [selection, setSelection] = useState<Media | null>(null);

  const requete = useMedias({ q, filtre, tri }, ouvert);
  const medias = requete.data?.pages.flatMap((page) => page.elements) ?? [];
  const total = requete.data?.pages[0]?.total ?? 0;
  const choisie = selection;

  function choisir(media: Media) {
    onChoisir(media);
    onOuvertChange(false);
    setSelection(null);
  }

  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogContent className="gap-3 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Photo de couverture</DialogTitle>
          <DialogDescription>
            Reprenez une image déjà utilisée, ou importez-en une nouvelle :
            elle rejoindra la médiathèque pour les prochaines offres.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={onglet}
          onValueChange={(valeur) => setOnglet(valeur as typeof onglet)}
          className="min-w-0"
        >
          <TabsList>
            <TabsTrigger value="bibliotheque">
              <Images className="size-4" aria-hidden />
              Médiathèque
            </TabsTrigger>
            <TabsTrigger value="importer">
              <Upload className="size-4" aria-hidden />
              Importer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bibliotheque" className="min-w-0 space-y-3 pt-1">
            <BarreFiltresMedias
              q={q}
              onQ={setQ}
              filtre={filtre}
              onFiltre={setFiltre}
              tri={tri}
              onTri={setTri}
            />
            <GrilleMedias
              medias={medias}
              chargement={requete.isLoading}
              selection={choisie?.id ?? null}
              actuelle={selectionInitiale ?? null}
              onSelection={setSelection}
              onValider={choisir}
              vide={
                <div className="grid place-items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
                  <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
                  <p className="text-sm font-medium">
                    {q || filtre !== "toutes"
                      ? "Aucune image ne correspond"
                      : "La médiathèque est vide"}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setOnglet("importer")}
                  >
                    <Upload className="size-4" />
                    Importer une image
                  </Button>
                </div>
              }
            />
            {requete.hasNextPage ? (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={requete.isFetchingNextPage}
                  onClick={() => requete.fetchNextPage()}
                >
                  {requete.isFetchingNextPage ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Afficher plus ({medias.length} sur {total})
                </Button>
              </div>
            ) : null}

            {/* Collé en bas du dialogue, qui défile : le bouton reste à
                portée même au milieu d'une longue grille, sur téléphone. */}
            <div className="sticky -bottom-4 -mx-4 flex flex-wrap items-center justify-between gap-2 border-t bg-popover px-4 py-3">
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                {choisie
                  ? choisie.nom
                  : selectionInitiale
                    ? "La couverture actuelle est conservée"
                    : "Aucune image sélectionnée"}
              </span>
              <Button
                type="button"
                disabled={!choisie || choisie.id === selectionInitiale}
                onClick={() => choisie && choisir(choisie)}
              >
                <Check className="size-4" />
                Utiliser cette image
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="importer" className="min-w-0 pt-1">
            <ZoneImport
              libelleBouton="Importer et utiliser"
              onImportee={(media) => choisir(media)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------- champ de formulaire -- */

/**
 * Champ « Photo de couverture » : l'image actuelle, et de quoi la changer
 * depuis la médiathèque ou la retirer.
 */
export function ChoixCouverture({
  valeur,
  onChange,
  enCours,
}: {
  valeur: { id?: number | null; url: string; alt?: string | null } | null;
  onChange: (media: Media | null) => void;
  enCours?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      {valeur ? (
        <div className="space-y-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
            <Image
              src={valeur.url}
              alt={valeur.alt ?? ""}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover"
            />
            {enCours ? (
              <span className="absolute inset-0 grid place-items-center bg-background/60">
                <Loader2 className="size-5 animate-spin" />
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={enCours}
              onClick={() => setOuvert(true)}
            >
              <Images className="size-4" />
              Changer
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              disabled={enCours}
              onClick={() => onChange(null)}
            >
              <Trash2 className="size-4" />
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-24 w-full flex-col gap-1.5 border-dashed"
          disabled={enCours}
          onClick={() => setOuvert(true)}
        >
          {enCours ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Images className="size-5 text-muted-foreground" />
          )}
          <span className="text-xs font-normal text-muted-foreground">
            Choisir dans la médiathèque ou importer
          </span>
        </Button>
      )}

      <DialogueMediatheque
        ouvert={ouvert}
        onOuvertChange={setOuvert}
        selectionInitiale={valeur?.id ?? null}
        onChoisir={(media) => onChange(media)}
      />
    </>
  );
}
