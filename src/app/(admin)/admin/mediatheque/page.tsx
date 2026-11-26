"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  HardDrive,
  ImageIcon,
  Images,
  Loader2,
  Pencil,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConsoleHeader } from "@/components/admin/console-header";
import {
  ConsoleAction,
  ConsoleActions,
  ConsoleChamp,
  ConsoleDialogue,
  ConsoleInterrupteur,
  ConsoleSection,
  useConfirmation,
} from "@/components/admin/console-kit";
import { EmptyState } from "@/components/shared/empty-state";
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
import { formatDate, formatFileSize } from "@/lib/format";
import type { Media } from "@/lib/types";

const TEINTE = "var(--c-cyan)";

/**
 * Médiathèque : les images de couverture de toutes les offres.
 *
 * C'est ici qu'on fait le ménage. Une image ne part jamais avec une offre —
 * d'autres peuvent l'afficher — ; elle ne quitte le stockage que supprimée
 * d'ici, et seulement une fois qu'aucune offre ne l'utilise plus.
 */
export default function MediathequePage() {
  const queryClient = useQueryClient();
  const confirmer = useConfirmation();
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState<FiltreMedias>("toutes");
  const [tri, setTri] = useState<TriMedias>("recentes");
  const [importOuvert, setImportOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<Media | null>(null);

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

  const demanderSuppression = async (media: Media) => {
    const ok = await confirmer({
      titre: "Supprimer cette image ?",
      message: `« ${media.nom} » sera retirée de la médiathèque et effacée du stockage. Cette action est définitive.`,
      confirmer: "Supprimer",
      danger: true,
    });
    if (ok) suppression.mutate(media);
  };

  const filtresActifs = Boolean(q) || filtre !== "toutes";

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
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[color-mix(in_oklch,var(--warning)_35%,transparent)] bg-[color-mix(in_oklch,var(--warning)_8%,transparent)] px-4 py-3 text-sm">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_oklch,var(--warning)_16%,transparent)] text-[var(--warning)]">
            <HardDrive className="size-4" aria-hidden />
          </span>
          <p className="min-w-0 flex-1">
            <span className="font-semibold">
              {bilan.inutilisees} image{bilan.inutilisees > 1 ? "s" : ""}{" "}
              {bilan.inutilisees > 1 ? "ne sont utilisées" : "n'est utilisée"} par
              aucune offre
            </span>{" "}
            <span className="text-muted-foreground">
              ({formatFileSize(bilan.poidsInutilisees)}). Supprimez celles qui ne
              serviront plus pour libérer de la place.
            </span>
          </p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={() => setFiltre("inutilisees")}
          >
            Les afficher
          </Button>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-3 shadow-sm">
          <BarreFiltresMedias
            q={q}
            onQ={setQ}
            filtre={filtre}
            onFiltre={setFiltre}
            tri={tri}
            onTri={setTri}
          />
        </div>

        {!requete.isLoading && medias.length > 0 ? (
          <p className="px-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{medias.length}</span>{" "}
            affichée{medias.length > 1 ? "s" : ""} sur{" "}
            <span className="font-semibold text-foreground tabular-nums">{total}</span>
          </p>
        ) : null}

        <GrilleMedias
          medias={medias}
          chargement={requete.isLoading}
          actions={(media) => (
            <ConsoleActions>
              <span className="flex items-center gap-0.5">
                <ConsoleAction
                  libelle="Modifier"
                  icone={Pencil}
                  ton="primaire"
                  disabled={!media.modifiable}
                  onClick={() => setEnEdition(media)}
                />
                <ConsoleAction
                  libelle={
                    media.utilisations > 0
                      ? `Utilisée par ${libelleUtilisations(media.utilisations)} : changez leur couverture d'abord`
                      : "Supprimer"
                  }
                  icone={Trash2}
                  ton="danger"
                  disabled={!media.modifiable || media.utilisations > 0}
                  enCours={suppression.isPending && suppression.variables?.id === media.id}
                  onClick={() => demanderSuppression(media)}
                />
              </span>
            </ConsoleActions>
          )}
          vide={
            <EmptyState
              icon={ImageIcon}
              couleur={TEINTE}
              title={
                filtresActifs ? "Aucune image ne correspond" : "Aucune image pour l'instant"
              }
              description="Les couvertures choisies ou importées depuis le formulaire d'une offre apparaissent ici."
              action={
                filtresActifs ? (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setQ("");
                      setFiltre("toutes");
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                ) : (
                  <Button className="rounded-xl" onClick={() => setImportOuvert(true)}>
                    <Upload className="size-4" />
                    Importer une image
                  </Button>
                )
              }
            />
          }
        />

        {requete.hasNextPage ? (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              className="rounded-xl"
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
      <ConsoleDialogue
        ouvert={importOuvert}
        onFermer={() => setImportOuvert(false)}
        icone={Upload}
        teinte={TEINTE}
        taille="md"
        titre="Importer une image"
        description="Elle sera réduite et allégée, puis proposée dans le formulaire de chaque offre."
      >
        <ZoneImport onImportee={() => setImportOuvert(false)} />
      </ConsoleDialogue>

      {/* Modification : remontée pour chaque image, les champs repartent de
          ses valeurs. */}
      {enEdition ? (
        <FormulaireEdition
          key={enEdition.id}
          media={enEdition}
          onFermer={() => setEnEdition(null)}
        />
      ) : null}
    </>
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

  const details = [
    libelleUtilisations(media.utilisations),
    media.largeur && media.hauteur ? `${media.largeur} × ${media.hauteur} px` : null,
    media.taille ? formatFileSize(media.taille) : null,
    media.auteur ? `déposée par ${media.auteur}` : null,
    media.createdAt ? `le ${formatDate(media.createdAt)}` : null,
  ].filter(Boolean);

  return (
    <ConsoleDialogue
      onFermer={onFermer}
      icone={Pencil}
      teinte={TEINTE}
      taille="md"
      titre="Modifier l'image"
      description={details.join(" · ")}
      onSubmit={() => nom.trim() && enregistrement.mutate()}
      pied={
        <>
          <Button type="button" variant="ghost" className="rounded-lg" onClick={onFermer}>
            Annuler
          </Button>
          <Button
            type="submit"
            className="rounded-lg"
            disabled={enregistrement.isPending || !nom.trim()}
          >
            {enregistrement.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="mb-5 overflow-hidden rounded-xl border bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} alt={alt || media.nom} className="mx-auto max-h-56 object-contain" />
      </div>

      {media.utilisations > 0 ? (
        <p className="mb-5 flex gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Utilisée par {libelleUtilisations(media.utilisations)} : elle ne peut pas être
          supprimée tant qu&apos;une offre l&apos;affiche.
        </p>
      ) : null}

      <ConsoleSection colonnes={1}>
        <ConsoleChamp id="edition-nom" libelle="Nom" requis>
          <Input
            id="edition-nom"
            required
            maxLength={120}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </ConsoleChamp>
        <ConsoleChamp
          id="edition-alt"
          libelle="Texte alternatif proposé par défaut"
          aide="Lu par les lecteurs d'écran : décrivez ce que montre l'image."
        >
          <Input
            id="edition-alt"
            maxLength={300}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Ce que montre l'image"
          />
        </ConsoleChamp>
        <ConsoleInterrupteur
          icone={Share2}
          libelle="Partager avec les partenaires"
          description="Sinon, un partenaire ne voit que les images qu'il a lui-même importées."
          coche={commune}
          onChange={setCommune}
        />
      </ConsoleSection>
    </ConsoleDialogue>
  );
}
