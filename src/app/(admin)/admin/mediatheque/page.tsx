"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Images, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsoleHeader } from "@/components/admin/console-header";
import {
  BarreFiltresMedias,
  GrilleMedias,
  libelleUtilisations,
  useMedias,
  ZoneImport,
} from "@/components/medias/mediatheque";
import {
  errorMessage,
  mediasApi,
  type FiltreMedias,
  type TriMedias,
} from "@/lib/api";
import { formatFileSize } from "@/lib/format";
import type { Media } from "@/lib/types";

const TEINTE = "var(--chart-5)";

/**
 * Médiathèque : les images de couverture de toutes les offres.
 *
 * C'est ici qu'on fait le ménage. Une image ne part jamais avec une offre —
 * d'autres peuvent l'afficher — ; elle ne quitte le stockage que supprimée
 * d'ici, et seulement une fois qu'aucune offre ne l'utilise plus.
 */
export default function MediathequePage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<FiltreMedias>("toutes");
  const [tri, setTri] = useState<TriMedias>("recentes");
  const [importOuvert, setImportOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<Media | null>(null);
  const [aSupprimer, setASupprimer] = useState<Media | null>(null);

  const requete = useMedias({ q, filtre, tri });
  const medias = requete.data?.pages.flatMap((page) => page.elements) ?? [];
  const total = requete.data?.pages[0]?.total ?? 0;

  const { data: bilan } = useQuery({
    queryKey: ["medias", "bilan"],
    queryFn: () => mediasApi.bilan(),
  });

  async function rafraichir() {
    await queryClient.invalidateQueries({ queryKey: ["medias"] });
  }

  const suppression = useMutation({
    mutationFn: (media: Media) => mediasApi.supprimer(media.id),
    onSuccess: async (_d, media) => {
      setASupprimer(null);
      await rafraichir();
      toast.success("Image supprimée", {
        description: media.taille
          ? `${formatFileSize(media.taille)} libérés dans le stockage.`
          : undefined,
      });
    },
    onError: (erreur) =>
      toast.error("Suppression impossible", { description: errorMessage(erreur) }),
  });

  return (
    <>
      <ConsoleHeader
        title="Médiathèque"
        icon={Images}
        teinte={TEINTE}
        description="Les images de couverture, réutilisables d'une offre à l'autre. Une image envoyée deux fois n'est stockée qu'une fois, et ne peut être supprimée que si aucune offre ne l'affiche."
        mesures={[
          { label: "Images", valeur: bilan?.total ?? "—", teinte: TEINTE },
          { label: "Stockage", valeur: bilan ? formatFileSize(bilan.poids) : "—" },
          {
            label: "Non utilisées",
            valeur: bilan?.inutilisees ?? "—",
            teinte: bilan?.inutilisees ? "var(--warning)" : undefined,
          },
          { label: "Partagées", valeur: bilan?.communes ?? "—" },
        ]}
        actions={
          <Button className="rounded-xl" onClick={() => setImportOuvert(true)}>
            <Upload className="size-4" />
            Importer une image
          </Button>
        }
      />

      {bilan && bilan.inutilisees > 0 && filtre !== "inutilisees" ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
          <p className="min-w-0">
            <span className="font-medium">
              {bilan.inutilisees} image{bilan.inutilisees > 1 ? "s" : ""}{" "}
              {bilan.inutilisees > 1 ? "ne sont utilisées" : "n'est utilisée"} par
              aucune offre
            </span>{" "}
            <span className="text-muted-foreground">
              ({formatFileSize(bilan.poidsInutilisees)}). Supprimez celles qui ne
              serviront plus pour libérer de la place.
            </span>
          </p>
          <Button size="sm" variant="outline" onClick={() => setFiltre("inutilisees")}>
            Les afficher
          </Button>
        </div>
      ) : null}

      <div className="space-y-4">
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
          actions={(media) => (
            <>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => setEnEdition(media)}
                disabled={!media.modifiable}
              >
                <Pencil className="size-3.5" />
                Modifier
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                disabled={!media.modifiable || media.utilisations > 0}
                title={
                  media.utilisations > 0
                    ? `Utilisée par ${libelleUtilisations(media.utilisations)} : changez leur couverture d'abord`
                    : undefined
                }
                onClick={() => setASupprimer(media)}
              >
                <Trash2 className="size-3.5" />
                Supprimer
              </Button>
            </>
          )}
          vide={
            <div className="grid place-items-center gap-2 rounded-xl border border-dashed px-4 py-14 text-center">
              <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">
                {q || filtre !== "toutes"
                  ? "Aucune image ne correspond"
                  : "Aucune image pour l'instant"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Les couvertures choisies ou importées depuis le formulaire d&apos;une
                offre apparaissent ici.
              </p>
            </div>
          }
        />

        {requete.hasNextPage ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
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
      </div>

      {/* Import */}
      <Dialog open={importOuvert} onOpenChange={setImportOuvert}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Importer une image</DialogTitle>
            <DialogDescription>
              Elle sera réduite et allégée, puis proposée dans le formulaire de
              chaque offre.
            </DialogDescription>
          </DialogHeader>
          <ZoneImport onImportee={() => setImportOuvert(false)} />
        </DialogContent>
      </Dialog>

      {/* Modification */}
      <DialogueEdition media={enEdition} onFermer={() => setEnEdition(null)} />

      {/* Suppression */}
      <Dialog
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => !ouvert && setASupprimer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette image ?</DialogTitle>
            <DialogDescription>
              « {aSupprimer?.nom} » sera retirée de la médiathèque et effacée du
              stockage. Cette action est définitive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setASupprimer(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={suppression.isPending}
              onClick={() => aSupprimer && suppression.mutate(aSupprimer)}
            >
              {suppression.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DialogueEdition({
  media,
  onFermer,
}: {
  media: Media | null;
  onFermer: () => void;
}) {
  return (
    <Dialog open={media !== null} onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent className="sm:max-w-md">
        {/* Remonté pour chaque image : les champs repartent de ses valeurs. */}
        {media ? <FormulaireEdition key={media.id} media={media} onFermer={onFermer} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function FormulaireEdition({ media, onFermer }: { media: Media; onFermer: () => void }) {
  const queryClient = useQueryClient();
  const [nom, setNom] = useState(media.nom);
  const [alt, setAlt] = useState(media.alt ?? "");
  const [commune, setCommune] = useState(media.commune);

  const enregistrement = useMutation({
    mutationFn: () =>
      mediasApi.modifier(media.id, { nom: nom.trim(), alt: alt.trim(), commune }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["medias"] });
      toast.success("Image modifiée");
      onFermer();
    },
    onError: (erreur) =>
      toast.error("Modification impossible", { description: errorMessage(erreur) }),
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        enregistrement.mutate();
      }}
    >
      <DialogHeader>
        <DialogTitle>Modifier l&apos;image</DialogTitle>
        <DialogDescription>
          {libelleUtilisations(media.utilisations)}
          {media.largeur && media.hauteur ? ` · ${media.largeur} × ${media.hauteur} px` : ""}
          {media.taille ? ` · ${formatFileSize(media.taille)}` : ""}
          {media.auteur ? ` · déposée par ${media.auteur}` : ""}
        </DialogDescription>
      </DialogHeader>

      <div className="min-w-0">
        <Label htmlFor="edition-nom">Nom</Label>
        <Input
          id="edition-nom"
          className="mt-1.5"
          required
          maxLength={120}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
      </div>
      <div className="min-w-0">
        <Label htmlFor="edition-alt">Texte alternatif proposé par défaut</Label>
        <Input
          id="edition-alt"
          className="mt-1.5"
          maxLength={300}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Ce que montre l'image"
        />
      </div>
      <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
        <Switch id="edition-commune" checked={commune} onCheckedChange={setCommune} />
        <div className="min-w-0">
          <label htmlFor="edition-commune" className="text-sm font-medium">
            Partager avec les partenaires
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sinon, un partenaire ne voit que les images qu&apos;il a lui-même
            importées.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onFermer}>
          Annuler
        </Button>
        <Button type="submit" disabled={enregistrement.isPending || !nom.trim()}>
          {enregistrement.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Enregistrer
        </Button>
      </DialogFooter>
    </form>
  );
}
