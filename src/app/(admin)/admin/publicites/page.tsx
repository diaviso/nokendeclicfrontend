"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CalendarRange,
  Check,
  ExternalLink,
  GalleryHorizontalEnd,
  ImageIcon,
  Link2,
  Loader2,
  MonitorPlay,
  Palette,
  Pencil,
  Plus,
  Power,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ConsoleHeader } from "@/components/admin/console-header";
import {
  ConsoleTable,
  type ColonneConsole,
} from "@/components/admin/console-table";
import {
  ConsoleFiltre,
  ConsolePastille,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import {
  ConsoleAction,
  ConsoleActions,
  ConsoleChamp,
  ConsoleChoixImage,
  ConsoleDialogue,
  ConsoleInterrupteur,
  ConsolePanneau,
  ConsoleSection,
  useConfirmation,
} from "@/components/admin/console-kit";
import {
  DiaporamaPublicites,
  DiapoPublicite,
  TEINTES_PUBLICITE,
  teintePublicite,
} from "@/components/dashboard/diaporama-publicites";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber } from "@/lib/format";
import {
  errorMessage,
  fileUrl,
  publicitesApi,
  type PublicitePayload,
  type PublicitePourAdministration,
} from "@/lib/api";

const TEINTE = "var(--c-fuchsia)";
const CLE = ["admin", "publicites"] as const;

/* --------------------------------------------------------------- Statut */

type Statut = "diffusion" | "programmee" | "terminee" | "suspendue";

const STATUTS: Record<Statut, { libelle: string; teinte?: string }> = {
  diffusion: { libelle: "En diffusion", teinte: "var(--success)" },
  programmee: { libelle: "Programmée", teinte: "var(--c-sky)" },
  terminee: { libelle: "Terminée" },
  suspendue: { libelle: "Suspendue", teinte: "var(--c-amber)" },
};

function statutDe(
  annonce: PublicitePourAdministration,
  maintenant: number,
): Statut {
  if (!annonce.estActive) return "suspendue";
  if (annonce.fin && new Date(annonce.fin).getTime() < maintenant)
    return "terminee";
  if (annonce.debut && new Date(annonce.debut).getTime() > maintenant)
    return "programmee";
  return "diffusion";
}

function periode(annonce: PublicitePourAdministration): string {
  if (annonce.debut && annonce.fin)
    return `${formatDate(annonce.debut)} → ${formatDate(annonce.fin)}`;
  if (annonce.debut) return `À partir du ${formatDate(annonce.debut)}`;
  if (annonce.fin) return `Jusqu'au ${formatDate(annonce.fin)}`;
  return "Sans limite de durée";
}

function taux(clics: number, vues: number): string {
  if (!vues) return "—";
  return `${((clics / vues) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

/* -------------------------------------------------------- Dates locales */

/** ISO → « 2026-11-27 » dans le fuseau du navigateur, pour un champ date. */
function versChampDate(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const decalage = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - decalage).toISOString().slice(0, 10);
}

/** Le début vaut dès minuit, la fin jusqu'au dernier instant du jour. */
function depuisChampDate(valeur: string, fin: boolean): string | null {
  if (!valeur) return null;
  return new Date(
    `${valeur}T${fin ? "23:59:59.999" : "00:00:00"}`,
  ).toISOString();
}

/* --------------------------------------------------------- Miniature */

function Miniature({
  annonce,
}: {
  annonce: Pick<PublicitePourAdministration, "imageUrl" | "teinte">;
}) {
  const couleur = teintePublicite(annonce.teinte);
  const image = fileUrl(annonce.imageUrl);
  return (
    <span
      className="relative grid h-11 w-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-lg border"
      style={{ background: `color-mix(in oklch, ${couleur} 14%, var(--card))` }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <GalleryHorizontalEnd
          className="size-4"
          style={{ color: couleur }}
          aria-hidden
        />
      )}
    </span>
  );
}

/* ------------------------------------------------------------- Fiche */

interface Valeurs {
  titre: string;
  texte: string;
  annonceur: string;
  lien: string;
  libelleBouton: string;
  teinte: string;
  estActive: boolean;
  debut: string;
  fin: string;
}

function valeursInitiales(
  annonce: PublicitePourAdministration | null,
): Valeurs {
  return {
    titre: annonce?.titre ?? "",
    texte: annonce?.texte ?? "",
    annonceur: annonce?.annonceur ?? "",
    lien: annonce?.lien ?? "",
    libelleBouton: annonce?.libelleBouton ?? "",
    teinte: annonce?.teinte ?? TEINTES_PUBLICITE[0].cle,
    estActive: annonce?.estActive ?? true,
    debut: versChampDate(annonce?.debut),
    fin: versChampDate(annonce?.fin),
  };
}

function Compteur({ valeur, max }: { valeur: string; max: number }) {
  return (
    <span
      className={cn(
        "tabular-nums",
        valeur.length > max * 0.9
          ? "text-[var(--c-amber)]"
          : "text-muted-foreground",
      )}
    >
      {valeur.length}/{max}
    </span>
  );
}

function DialogueAnnonce({
  annonce,
  onFermer,
}: {
  annonce: PublicitePourAdministration | null;
  onFermer: () => void;
}) {
  const queryClient = useQueryClient();
  const [v, setV] = useState<Valeurs>(() => valeursInitiales(annonce));
  const [image, setImage] = useState<File | null>(null);
  const [retirerImage, setRetirerImage] = useState(false);

  const changer =
    (
      cle:
        | "titre"
        | "texte"
        | "annonceur"
        | "lien"
        | "libelleBouton"
        | "debut"
        | "fin",
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setV((avant) => ({ ...avant, [cle]: e.target.value }));

  // Aperçu en direct : l'image choisie s'affiche avant même l'envoi.
  const apercuImage = useMemo(() => {
    if (image) return URL.createObjectURL(image);
    if (retirerImage) return null;
    return annonce?.imageUrl ?? null;
  }, [image, retirerImage, annonce?.imageUrl]);

  const lien = v.lien.trim();
  const lienInvalide = Boolean(lien) && !/^(https?:\/\/\S+|\/\S*)$/i.test(lien);
  const datesInvalides = Boolean(v.debut && v.fin && v.fin < v.debut);
  const valide = v.titre.trim().length >= 2 && !lienInvalide && !datesInvalides;

  const enregistrer = useMutation({
    mutationFn: async () => {
      const texte = (valeur: string) => valeur.trim() || undefined;
      const payload: PublicitePayload = {
        titre: v.titre.trim(),
        texte: texte(v.texte),
        annonceur: texte(v.annonceur),
        lien: texte(v.lien),
        libelleBouton: texte(v.libelleBouton),
        teinte: v.teinte,
        estActive: v.estActive,
        debut: depuisChampDate(v.debut, false),
        fin: depuisChampDate(v.fin, true),
      };
      const enregistree = annonce
        ? await publicitesApi.modifier(annonce.id, payload)
        : await publicitesApi.creer(payload);
      if (image) await publicitesApi.image(enregistree.id, image);
      else if (retirerImage && annonce?.imageUrl)
        await publicitesApi.retirerImage(enregistree.id);
      return enregistree;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CLE }),
        queryClient.invalidateQueries({ queryKey: ["publicites"] }),
      ]);
      toast.success(annonce ? "Annonce mise à jour" : "Annonce créée");
      onFermer();
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", {
        description: errorMessage(error),
      }),
  });

  return (
    <ConsoleDialogue
      onFermer={onFermer}
      icone={annonce ? Pencil : Plus}
      teinte={TEINTE}
      taille="xl"
      titre={annonce ? `Modifier « ${annonce.titre} »` : "Nouvelle annonce"}
      description="Elle apparaît dans le diaporama du tableau de bord des membres, marquée « Sponsorisé »."
      onSubmit={() => valide && enregistrer.mutate()}
      pied={
        <>
          <Button
            type="button"
            variant="ghost"
            className="rounded-lg"
            onClick={onFermer}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="rounded-lg"
            disabled={enregistrer.isPending || !valide}
          >
            {enregistrer.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {annonce ? "Enregistrer" : "Créer l'annonce"}
          </Button>
        </>
      }
    >
      {/* Aperçu fidèle : le composant même du tableau de bord. */}
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MonitorPlay className="size-3.5" aria-hidden />
          Aperçu
        </p>
        <div className="pointer-events-none overflow-hidden rounded-3xl border bg-card shadow-sm">
          <DiapoPublicite
            annonce={{
              id: annonce?.id ?? 0,
              titre: v.titre.trim() || "Titre de l'annonce",
              texte: v.texte.trim() || null,
              annonceur: v.annonceur.trim() || null,
              imageUrl: apercuImage,
              lien: lien || null,
              libelleBouton: v.libelleBouton.trim() || null,
              teinte: v.teinte,
            }}
          />
        </div>
      </div>

      <ConsoleSection titre="Message" icone={Type}>
        <ConsoleChamp
          id="pub-titre"
          libelle="Titre"
          requis
          large
          aide={<Compteur valeur={v.titre} max={90} />}
        >
          <Input
            id="pub-titre"
            value={v.titre}
            onChange={changer("titre")}
            maxLength={90}
            required
            placeholder="Formation gratuite en développement web"
          />
        </ConsoleChamp>
        <ConsoleChamp
          id="pub-texte"
          libelle="Accroche"
          large
          aide={<Compteur valeur={v.texte} max={220} />}
        >
          <Textarea
            id="pub-texte"
            rows={2}
            value={v.texte}
            onChange={changer("texte")}
            maxLength={220}
            placeholder="Deux lignes au plus : ce que le membre y gagne."
          />
        </ConsoleChamp>
        <ConsoleChamp
          id="pub-annonceur"
          libelle="Annonceur"
          aide="Affiché « Proposé par … »"
        >
          <Input
            id="pub-annonceur"
            value={v.annonceur}
            onChange={changer("annonceur")}
            maxLength={80}
            placeholder="Nom de la structure"
          />
        </ConsoleChamp>
      </ConsoleSection>

      <ConsoleSection titre="Visuel" icone={ImageIcon} colonnes={1}>
        <ConsoleChoixImage
          libelle="Image de l'annonce"
          aide="Paysage, 1200 × 600 px conseillé"
          forme="large"
          icone={ImageIcon}
          actuelle={retirerImage ? null : (fileUrl(annonce?.imageUrl) ?? null)}
          fichier={image}
          onChange={(fichier) => {
            setImage(fichier);
            if (fichier) setRetirerImage(false);
          }}
          onRetirer={
            annonce?.imageUrl ? () => setRetirerImage(true) : undefined
          }
        />
        <p className="text-xs text-muted-foreground">
          Sans image, la diapo prend la couleur choisie plus bas, avec un
          pictogramme.
        </p>
      </ConsoleSection>

      <ConsoleSection titre="Destination" icone={Link2}>
        <ConsoleChamp
          id="pub-lien"
          libelle="Lien"
          large
          erreur={
            lienInvalide
              ? "Commencez par https:// (site externe) ou par / (page de Noken)."
              : undefined
          }
          aide="https://… pour un site externe (nouvel onglet), /offres/12 pour une page de la plateforme"
        >
          <Input
            id="pub-lien"
            value={v.lien}
            onChange={changer("lien")}
            maxLength={500}
            placeholder="https://"
            aria-invalid={lienInvalide || undefined}
          />
        </ConsoleChamp>
        <ConsoleChamp
          id="pub-bouton"
          libelle="Texte du bouton"
          aide="« En savoir plus » par défaut"
        >
          <Input
            id="pub-bouton"
            value={v.libelleBouton}
            onChange={changer("libelleBouton")}
            maxLength={30}
            placeholder="Je m'inscris"
            disabled={!lien}
          />
        </ConsoleChamp>
      </ConsoleSection>

      <ConsoleSection titre="Couleur" icone={Palette} colonnes={1}>
        <div
          role="radiogroup"
          aria-label="Couleur de l'annonce"
          className="flex flex-wrap gap-2"
        >
          {TEINTES_PUBLICITE.map((teinte) => {
            const choisie = v.teinte === teinte.cle;
            return (
              <button
                key={teinte.cle}
                type="button"
                role="radio"
                aria-checked={choisie}
                onClick={() =>
                  setV((avant) => ({ ...avant, teinte: teinte.cle }))
                }
                className={cn(
                  "flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition-all",
                  choisie
                    ? "border-foreground/30 bg-muted shadow-sm"
                    : "hover:bg-muted/60",
                )}
              >
                <span
                  className="grid size-6 place-items-center rounded-full text-white"
                  style={{ background: teinte.couleur }}
                >
                  {choisie ? <Check className="size-3.5" /> : null}
                </span>
                {teinte.libelle}
              </button>
            );
          })}
        </div>
      </ConsoleSection>

      <ConsoleSection titre="Diffusion" icone={CalendarRange}>
        <ConsoleChamp
          id="pub-debut"
          libelle="Début"
          aide="Vide : dès maintenant"
        >
          <Input
            id="pub-debut"
            type="date"
            value={v.debut}
            onChange={changer("debut")}
          />
        </ConsoleChamp>
        <ConsoleChamp
          id="pub-fin"
          libelle="Fin"
          aide="Vide : sans fin, jusqu'à suspension"
          erreur={datesInvalides ? "La fin précède le début." : undefined}
        >
          <Input
            id="pub-fin"
            type="date"
            value={v.fin}
            min={v.debut || undefined}
            onChange={changer("fin")}
            aria-invalid={datesInvalides || undefined}
          />
        </ConsoleChamp>
        <ConsoleInterrupteur
          large
          icone={Power}
          libelle="Annonce active"
          description="Suspendue, elle disparaît du tableau de bord sans perdre ses chiffres."
          coche={v.estActive}
          onChange={(estActive) => setV((avant) => ({ ...avant, estActive }))}
        />
      </ConsoleSection>
    </ConsoleDialogue>
  );
}

/* ----------------------------------------------------------------- Page */

type Filtre = "" | Statut;

export default function PublicitesConsolePage() {
  const queryClient = useQueryClient();
  const confirmer = useConfirmation();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("");
  const [edition, setEdition] = useState<{
    annonce: PublicitePourAdministration | null;
  } | null>(null);
  // Figée au chargement de la page : un statut ne bascule pas sous les yeux.
  const [maintenant] = useState(() => Date.now());

  const { data: annonces = [], isLoading } = useQuery({
    queryKey: CLE,
    queryFn: publicitesApi.listerPourAdministration,
  });

  const rafraichir = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: CLE }),
      queryClient.invalidateQueries({ queryKey: ["publicites"] }),
    ]);

  const basculer = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      publicitesApi.basculer(id, active),
    onSuccess: async (annonce) => {
      await rafraichir();
      toast.success(
        annonce.estActive ? "Annonce réactivée" : "Annonce suspendue",
      );
    },
    onError: (error) =>
      toast.error("Modification impossible", {
        description: errorMessage(error),
      }),
  });

  const reordonner = useMutation({
    mutationFn: (ids: number[]) => publicitesApi.reordonner(ids),
    onMutate: async (ids) => {
      // Déplacement immédiat à l'écran ; le serveur confirme ensuite.
      await queryClient.cancelQueries({ queryKey: CLE });
      const avant =
        queryClient.getQueryData<PublicitePourAdministration[]>(CLE);
      if (avant) {
        const parId = new Map(avant.map((a) => [a.id, a]));
        queryClient.setQueryData(
          CLE,
          ids.map((id, rang) => ({ ...parId.get(id)!, ordre: rang + 1 })),
        );
      }
      return { avant };
    },
    onError: (error, _ids, contexte) => {
      if (contexte?.avant) queryClient.setQueryData(CLE, contexte.avant);
      toast.error("Réorganisation impossible", {
        description: errorMessage(error),
      });
    },
    onSettled: rafraichir,
  });

  const supprimer = useMutation({
    mutationFn: (id: number) => publicitesApi.supprimer(id),
    onSuccess: async () => {
      await rafraichir();
      toast.success("Annonce supprimée");
    },
    onError: (error) =>
      toast.error("Suppression impossible", {
        description: errorMessage(error),
      }),
  });

  const statuts = useMemo(
    () => new Map(annonces.map((a) => [a.id, statutDe(a, maintenant)])),
    [annonces, maintenant],
  );
  const compte = (statut: Statut) =>
    annonces.filter((a) => statuts.get(a.id) === statut).length;
  const enDiffusion = annonces.filter((a) => statuts.get(a.id) === "diffusion");
  const vues = annonces.reduce((somme, a) => somme + a.vues, 0);
  const clics = annonces.reduce((somme, a) => somme + a.clics, 0);

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return annonces.filter((annonce) => {
      if (filtre && statuts.get(annonce.id) !== filtre) return false;
      if (!terme) return true;
      return [annonce.titre, annonce.annonceur, annonce.texte]
        .filter(Boolean)
        .some((valeur) => valeur!.toLowerCase().includes(terme));
    });
  }, [annonces, statuts, filtre, recherche]);

  const deplacer = (id: number, sens: -1 | 1) => {
    const ids = annonces.map((a) => a.id);
    const rang = ids.indexOf(id);
    const cible = rang + sens;
    if (rang < 0 || cible < 0 || cible >= ids.length) return;
    [ids[rang], ids[cible]] = [ids[cible], ids[rang]];
    reordonner.mutate(ids);
  };

  // Le réordonnancement n'a de sens que sur la liste complète.
  const ordonnable = !filtre && !recherche.trim();

  const colonnes: ColonneConsole<PublicitePourAdministration>[] = [
    {
      cle: "ordre",
      entete: "Rang",
      className: "w-[3.75rem]",
      cellule: (annonce) => {
        const rang = annonces.findIndex((a) => a.id === annonce.id);
        return (
          <div className="flex items-center gap-1">
            <span className="w-5 text-center text-sm font-bold tabular-nums text-muted-foreground">
              {rang + 1}
            </span>
            <div className="flex flex-col">
              <button
                type="button"
                aria-label="Monter dans le diaporama"
                title="Monter"
                disabled={!ordonnable || rang === 0 || reordonner.isPending}
                onClick={() => deplacer(annonce.id, -1)}
                className="grid h-4 w-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowUp className="size-3" />
              </button>
              <button
                type="button"
                aria-label="Descendre dans le diaporama"
                title="Descendre"
                disabled={
                  !ordonnable ||
                  rang === annonces.length - 1 ||
                  reordonner.isPending
                }
                onClick={() => deplacer(annonce.id, 1)}
                className="grid h-4 w-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowDown className="size-3" />
              </button>
            </div>
          </div>
        );
      },
    },
    {
      cle: "annonce",
      entete: "Annonce",
      cellule: (annonce) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden xl:contents">
            <Miniature annonce={annonce} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{annonce.titre}</p>
            <p className="truncate text-xs text-muted-foreground">
              {annonce.annonceur
                ? `Proposé par ${annonce.annonceur}`
                : "Annonceur non précisé"}
            </p>
          </div>
        </div>
      ),
    },
    {
      cle: "diffusion",
      entete: "Diffusion",
      className: "w-[10rem]",
      cellule: (annonce) => {
        const statut = STATUTS[statuts.get(annonce.id) ?? "diffusion"];
        return (
          <div className="min-w-0">
            <ConsolePastille
              libelle={statut.libelle}
              teinte={statut.teinte}
              discret={!statut.teinte}
            />
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {periode(annonce)}
            </p>
          </div>
        );
      },
    },
    {
      cle: "audience",
      entete: "Audience",
      align: "right",
      className: "w-[7rem]",
      cellule: (annonce) => (
        <div className="text-right">
          <p className="font-semibold tabular-nums">
            {formatNumber(annonce.vues)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              vue{annonce.vues > 1 ? "s" : ""}
            </span>
          </p>
          <p className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
            {formatNumber(annonce.clics)} clic{annonce.clics > 1 ? "s" : ""} ·{" "}
            {taux(annonce.clics, annonce.vues)}
          </p>
        </div>
      ),
    },
    {
      cle: "actions",
      entete: "",
      align: "right",
      className: "w-[9rem] xl:w-[10.5rem]",
      cellule: (annonce) => (
        <ConsoleActions>
          <Switch
            checked={annonce.estActive}
            disabled={
              basculer.isPending && basculer.variables?.id === annonce.id
            }
            onCheckedChange={(active) =>
              basculer.mutate({ id: annonce.id, active })
            }
            aria-label={
              annonce.estActive ? "Suspendre l'annonce" : "Réactiver l'annonce"
            }
            className="mr-1.5"
          />
          {annonce.lien ? (
            <span className="hidden xl:contents">
              <ConsoleAction
                libelle="Ouvrir la destination"
                icone={ExternalLink}
                href={annonce.lien}
                cible="_blank"
              />
            </span>
          ) : null}
          <ConsoleAction
            libelle="Modifier"
            icone={Pencil}
            ton="primaire"
            onClick={() => setEdition({ annonce })}
          />
          <ConsoleAction
            libelle="Supprimer"
            icone={Trash2}
            ton="danger"
            enCours={supprimer.isPending && supprimer.variables === annonce.id}
            onClick={async () => {
              if (
                await confirmer({
                  titre: `Supprimer « ${annonce.titre} » ?`,
                  message:
                    "L'annonce et ses chiffres (vues, clics) seront effacés. Pour seulement l'arrêter, suspendez-la plutôt.",
                  confirmer: "Supprimer",
                  danger: true,
                })
              ) {
                supprimer.mutate(annonce.id);
              }
            }}
          />
        </ConsoleActions>
      ),
    },
  ];

  const nouvelle = () => setEdition({ annonce: null });

  return (
    <>
      <ConsoleHeader
        title="Publicités"
        icon={GalleryHorizontalEnd}
        teinte={TEINTE}
        description="Les annonces sponsorisées du diaporama, en tête du tableau de bord des membres. Les vues sont comptées une fois par membre et par session."
        actions={
          <Button className="rounded-xl" onClick={nouvelle}>
            <Plus className="size-4" />
            Nouvelle annonce
          </Button>
        }
        mesures={[
          { label: "Annonces", valeur: annonces.length },
          {
            label: "En diffusion",
            valeur: enDiffusion.length,
            teinte: "var(--success)",
          },
          { label: "Vues", valeur: vues, teinte: TEINTE },
          { label: "Clics", valeur: clics, teinte: "var(--c-blue)" },
          { label: "Taux de clic", valeur: taux(clics, vues) },
        ]}
      />

      <ConsolePanneau
        titre="Ce que voient les membres"
        description={
          enDiffusion.length
            ? `${enDiffusion.length} annonce${enDiffusion.length > 1 ? "s" : ""} en rotation, dans l'ordre du tableau ci-dessous`
            : "Aucune annonce en diffusion : le diaporama est masqué"
        }
        icone={MonitorPlay}
        teinte={TEINTE}
        className="mb-6"
      >
        {enDiffusion.length ? (
          <DiaporamaPublicites
            annonces={enDiffusion}
            suivi={false}
            masquable={false}
          />
        ) : (
          <div className="grid place-items-center rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Le tableau de bord s&apos;affiche sans diaporama tant qu&apos;aucune
            annonce n&apos;est active.
          </div>
        )}
      </ConsolePanneau>

      <ConsoleToolbar>
        <ConsoleSearch
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Titre, annonceur…"
          label="Rechercher une annonce"
          className="sm:min-w-[13rem]"
        />
        <ConsoleFiltre<Filtre>
          label="Filtrer par état"
          className="min-w-0 shrink"
          valeur={filtre}
          onChange={setFiltre}
          options={[
            { valeur: "", libelle: "Toutes", compte: annonces.length },
            {
              valeur: "diffusion",
              libelle: "En diffusion",
              compte: compte("diffusion"),
              teinte: STATUTS.diffusion.teinte,
            },
            {
              valeur: "programmee",
              libelle: "Programmées",
              compte: compte("programmee"),
              teinte: STATUTS.programmee.teinte,
            },
            {
              valeur: "suspendue",
              libelle: "Suspendues",
              compte: compte("suspendue"),
              teinte: STATUTS.suspendue.teinte,
            },
            {
              valeur: "terminee",
              libelle: "Terminées",
              compte: compte("terminee"),
            },
          ]}
        />
      </ConsoleToolbar>

      <ConsoleTable
        lignes={filtrees}
        colonnes={colonnes}
        cle={(annonce) => annonce.id}
        chargement={isLoading}
        rail={(annonce) => teintePublicite(annonce.teinte)}
        vide={
          <EmptyState
            icon={GalleryHorizontalEnd}
            couleur={TEINTE}
            title={
              recherche || filtre
                ? "Aucune annonce ne correspond"
                : "Aucune annonce pour le moment"
            }
            description={
              recherche || filtre
                ? "Changez de filtre ou de recherche."
                : "Créez une première annonce : elle apparaîtra en diaporama sur le tableau de bord des membres."
            }
            action={
              recherche || filtre ? undefined : (
                <Button className="rounded-xl" onClick={nouvelle}>
                  <Plus className="size-4" />
                  Nouvelle annonce
                </Button>
              )
            }
          />
        }
      />

      {edition ? (
        <DialogueAnnonce
          key={edition.annonce?.id ?? "nouvelle"}
          annonce={edition.annonce}
          onFermer={() => setEdition(null)}
        />
      ) : null}
    </>
  );
}
