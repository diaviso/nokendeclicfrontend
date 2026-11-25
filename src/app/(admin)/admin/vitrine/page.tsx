"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Eye,
  EyeOff,
  ExternalLink,
  ImageUp,
  Loader2,
  Pencil,
  Plus,
  Store,
  Tags,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import {
  ConsoleFiltre,
  ConsolePastille,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import { EmptyState } from "@/components/shared/empty-state";
import {
  errorMessage,
  fileUrl,
  partenaireApi,
  type EntrepriseAdministrationPayload,
  type EntreprisePourAdministration,
  type TypePartenaire,
} from "@/lib/api";
import { SECTEUR_LABELS, secteurLabel } from "@/lib/enums";
import type { Secteur } from "@/lib/types";

const TEINTE = "var(--chart-3)";
const CLE = ["admin", "vitrine"] as const;
const CLE_TYPES = ["partenaires", "types"] as const;

const classeSelect =
  "h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function Logo({ url }: { url?: string | null }) {
  if (!url) {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted/40 text-muted-foreground">
        <Building2 className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fileUrl(url)}
      alt=""
      className="size-9 shrink-0 rounded-lg border bg-background object-contain p-0.5"
    />
  );
}

/* ------------------------------------------------ Types de partenaires */

function DialogueType({
  type,
  ouvert,
  onFermer,
}: {
  type: TypePartenaire | null;
  ouvert: boolean;
  onFermer: () => void;
}) {
  const queryClient = useQueryClient();
  const [nom, setNom] = useState(type?.nom ?? "");
  const [description, setDescription] = useState(type?.description ?? "");
  const [ordre, setOrdre] = useState(String(type?.ordre ?? 0));

  const enregistrer = useMutation({
    mutationFn: () => {
      const payload = {
        nom: nom.trim(),
        description: description.trim() || undefined,
        ordre: Number(ordre) || 0,
      };
      return type
        ? partenaireApi.modifierType(type.id, payload)
        : partenaireApi.creerType(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLE_TYPES });
      await queryClient.invalidateQueries({ queryKey: CLE });
      toast.success(type ? "Type modifié" : "Type créé", {
        description: "Il apparaît dans le menu de l'application.",
      });
      onFermer();
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", { description: errorMessage(error) }),
  });

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type ? "Modifier le type" : "Nouveau type de partenaire"}</DialogTitle>
          <DialogDescription>
            Chaque type devient une entrée du menu et une page d&apos;annuaire
            regroupant ses structures.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (nom.trim().length >= 2) enregistrer.mutate();
          }}
        >
          <div>
            <Label htmlFor="type-nom">Nom</Label>
            <Input
              id="type-nom"
              className="mt-1.5"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Entreprises, ONG, Centres de formation…"
              maxLength={80}
              required
            />
          </div>
          <div>
            <Label htmlFor="type-description">Description (facultative)</Label>
            <Textarea
              id="type-description"
              className="mt-1.5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="w-32">
            <Label htmlFor="type-ordre">Ordre dans le menu</Label>
            <Input
              id="type-ordre"
              type="number"
              className="mt-1.5"
              value={ordre}
              onChange={(e) => setOrdre(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onFermer}>
              Annuler
            </Button>
            <Button type="submit" disabled={enregistrer.isPending || nom.trim().length < 2}>
              {enregistrer.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SectionTypes({ types }: { types: TypePartenaire[] }) {
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState<{ type: TypePartenaire | null } | null>(null);

  const supprimer = useMutation({
    mutationFn: (id: number) => partenaireApi.supprimerType(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLE_TYPES });
      await queryClient.invalidateQueries({ queryKey: CLE });
      toast.success("Type supprimé", {
        description: "Ses structures restent, simplement sorties de l'annuaire.",
      });
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  return (
    <section className="mb-6 rounded-2xl border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Tags className="size-4 text-muted-foreground" aria-hidden />
            Types de partenaires
          </h2>
          <p className="text-sm text-muted-foreground">
            Une structure classée dans un type apparaît dans l&apos;annuaire et
            dans le menu. Sans type, elle reste privée.
          </p>
        </div>
        <Button size="sm" className="rounded-lg" onClick={() => setEdition({ type: null })}>
          <Plus className="size-4" />
          Nouveau type
        </Button>
      </div>

      {types.length === 0 ? (
        <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
          Aucun type pour l&apos;instant. Créez-en un, par exemple
          « Entreprises » ou « ONG », puis classez-y vos structures.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {types.map((type) => (
            <li
              key={type.id}
              className="flex items-center gap-1 rounded-xl border bg-background py-1 pl-3 pr-1 text-sm"
            >
              <span className="font-medium">{type.nom}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {type._count?.partenaires ?? 0}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg"
                aria-label={`Modifier ${type.nom}`}
                onClick={() => setEdition({ type })}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg text-destructive"
                aria-label={`Supprimer ${type.nom}`}
                disabled={supprimer.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Supprimer le type « ${type.nom} » ? Ses structures ne seront plus dans l'annuaire.`,
                    )
                  ) {
                    supprimer.mutate(type.id);
                  }
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {edition ? (
        <DialogueType
          key={edition.type?.id ?? "nouveau"}
          type={edition.type}
          ouvert
          onFermer={() => setEdition(null)}
        />
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------ Structure */

interface ValeursFiche {
  nom: string;
  typePartenaireId: string;
  description: string;
  secteur: string;
  siteWeb: string;
  ville: string;
  region: string;
  taille: string;
  emailContact: string;
  telephone: string;
}

function valeursInitiales(fiche: EntreprisePourAdministration | null): ValeursFiche {
  return {
    nom: fiche?.nom ?? "",
    typePartenaireId: fiche?.typePartenaireId ? String(fiche.typePartenaireId) : "",
    description: fiche?.description ?? "",
    secteur: fiche?.secteur ?? "",
    siteWeb: fiche?.siteWeb ?? "",
    ville: fiche?.ville ?? "",
    region: fiche?.region ?? "",
    taille: fiche?.taille ?? "",
    emailContact: fiche?.emailContact ?? "",
    telephone: fiche?.telephone ?? "",
  };
}

function DialogueFiche({
  fiche,
  types,
  onFermer,
}: {
  fiche: EntreprisePourAdministration | null;
  types: TypePartenaire[];
  onFermer: () => void;
}) {
  const queryClient = useQueryClient();
  const [v, setV] = useState<ValeursFiche>(() => valeursInitiales(fiche));
  const [logo, setLogo] = useState<File | null>(null);
  const apercuLogo = useMemo(() => (logo ? URL.createObjectURL(logo) : null), [logo]);
  const champLogo = useRef<HTMLInputElement>(null);

  const changer = (cle: keyof ValeursFiche) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setV((avant) => ({ ...avant, [cle]: e.target.value }));

  const enregistrer = useMutation({
    mutationFn: async () => {
      // Les champs vidés partent en `undefined` : la validation du serveur
      // refuserait une adresse de site ou un email vides.
      const texte = (valeur: string) => valeur.trim() || undefined;
      const payload: EntrepriseAdministrationPayload = {
        nom: v.nom.trim(),
        typePartenaireId: v.typePartenaireId ? Number(v.typePartenaireId) : null,
        description: texte(v.description),
        secteur: (v.secteur || undefined) as Secteur | undefined,
        siteWeb: texte(v.siteWeb),
        ville: texte(v.ville),
        region: texte(v.region),
        taille: texte(v.taille),
        emailContact: texte(v.emailContact),
        telephone: texte(v.telephone),
      };
      const enregistree = fiche
        ? await partenaireApi.modifierParAdministration(fiche.id, payload)
        : await partenaireApi.creerParAdministration(payload);
      if (logo) await partenaireApi.logoParAdministration(enregistree.id, logo);
      return enregistree;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLE });
      await queryClient.invalidateQueries({ queryKey: CLE_TYPES });
      toast.success(fiche ? "Structure mise à jour" : "Structure créée");
      onFermer();
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", { description: errorMessage(error) }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{fiche ? `Modifier ${fiche.nom}` : "Nouvelle structure"}</DialogTitle>
          <DialogDescription>
            {fiche?.user
              ? `Fiche du compte ${fiche.user.email}. Le partenaire peut aussi la modifier depuis son espace.`
              : "Structure référencée par l'administration, sans compte. Vous pourrez lui rattacher des offres depuis le formulaire d'offre."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (v.nom.trim().length >= 2) enregistrer.mutate();
          }}
        >
          <div className="flex items-center gap-3">
            {apercuLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={apercuLogo}
                alt=""
                className="size-14 rounded-xl border object-contain p-1"
              />
            ) : (
              <span className="[&>*]:size-14">
                <Logo url={fiche?.logoUrl} />
              </span>
            )}
            <input
              ref={champLogo}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => champLogo.current?.click()}
            >
              <ImageUp className="size-4" />
              {fiche?.logoUrl || logo ? "Changer le logo" : "Ajouter un logo"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="fiche-nom">Nom de la structure</Label>
              <Input id="fiche-nom" className="mt-1.5" value={v.nom} onChange={changer("nom")} required maxLength={120} />
            </div>
            <div>
              <Label htmlFor="fiche-type">Type de partenaire</Label>
              <select id="fiche-type" className={`${classeSelect} mt-1.5`} value={v.typePartenaireId} onChange={changer("typePartenaireId")}>
                <option value="">Aucun (hors annuaire)</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="fiche-secteur">Secteur</Label>
              <select id="fiche-secteur" className={`${classeSelect} mt-1.5`} value={v.secteur} onChange={changer("secteur")}>
                <option value="">Non précisé</option>
                {(Object.keys(SECTEUR_LABELS) as Secteur[]).map((valeur) => (
                  <option key={valeur} value={valeur}>
                    {SECTEUR_LABELS[valeur]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fiche-description">Présentation</Label>
              <Textarea id="fiche-description" className="mt-1.5" rows={4} value={v.description} onChange={changer("description")} maxLength={1500} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fiche-site">Site web</Label>
              <Input id="fiche-site" className="mt-1.5" type="url" placeholder="https://" value={v.siteWeb} onChange={changer("siteWeb")} />
            </div>
            <div>
              <Label htmlFor="fiche-ville">Ville</Label>
              <Input id="fiche-ville" className="mt-1.5" value={v.ville} onChange={changer("ville")} />
            </div>
            <div>
              <Label htmlFor="fiche-region">Région</Label>
              <Input id="fiche-region" className="mt-1.5" value={v.region} onChange={changer("region")} />
            </div>
            <div>
              <Label htmlFor="fiche-email">Email de contact</Label>
              <Input id="fiche-email" className="mt-1.5" type="email" value={v.emailContact} onChange={changer("emailContact")} />
            </div>
            <div>
              <Label htmlFor="fiche-tel">Téléphone</Label>
              <Input id="fiche-tel" className="mt-1.5" value={v.telephone} onChange={changer("telephone")} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="fiche-taille">Taille</Label>
              <Input id="fiche-taille" className="mt-1.5" placeholder="10 à 49 salariés" value={v.taille} onChange={changer("taille")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onFermer}>
              Annuler
            </Button>
            <Button type="submit" disabled={enregistrer.isPending || v.nom.trim().length < 2}>
              {enregistrer.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------------------------------------- Page */

export default function PartenairesConsolePage() {
  const queryClient = useQueryClient();
  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [edition, setEdition] = useState<{ fiche: EntreprisePourAdministration | null } | null>(null);

  const { data: fiches = [], isLoading } = useQuery({
    queryKey: CLE,
    queryFn: partenaireApi.listerPourAdministration,
  });
  const { data: types = [] } = useQuery({
    queryKey: CLE_TYPES,
    queryFn: partenaireApi.types,
  });

  const regler = useMutation({
    mutationFn: ({
      id,
      ...reglages
    }: {
      id: number;
      estVisibleVitrine?: boolean;
      ordreVitrine?: number;
    }) => partenaireApi.reglerVitrine(id, reglages),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: CLE });
      if (variables.estVisibleVitrine !== undefined) {
        toast.success(
          variables.estVisibleVitrine
            ? "Structure mise en vitrine"
            : "Structure retirée de la vitrine",
          {
            description:
              "La page d'accueil est mise en cache cinq minutes : le changement peut mettre un instant à s'y voir.",
          },
        );
      }
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  const supprimer = useMutation({
    mutationFn: (id: number) => partenaireApi.supprimerParAdministration(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLE });
      await queryClient.invalidateQueries({ queryKey: CLE_TYPES });
      toast.success("Structure supprimée");
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return fiches.filter((fiche) => {
      if (filtreType === "aucun" && fiche.typePartenaireId) return false;
      if (filtreType && filtreType !== "aucun" && String(fiche.typePartenaireId) !== filtreType) {
        return false;
      }
      if (!terme) return true;
      return [fiche.nom, fiche.ville, fiche.user?.email]
        .filter(Boolean)
        .some((valeur) => valeur!.toLowerCase().includes(terme));
    });
  }, [fiches, recherche, filtreType]);

  const enVitrine = fiches.filter((fiche) => fiche.estVisibleVitrine);
  const classees = fiches.filter((fiche) => fiche.typePartenaireId).length;

  /**
   * Déplacement d'un cran dans la vitrine.
   *
   * Les rangs ne sont pas échangés deux à deux : tant que personne n'a été
   * réordonné, toutes les fiches portent le rang 0 par défaut, et un échange
   * entre deux zéros ne produirait aucun mouvement. On renumérote donc la liste
   * telle qu'elle doit être, et on n'écrit que les lignes dont le rang change.
   */
  const deplacer = async (fiche: EntreprisePourAdministration, sens: -1 | 1) => {
    const position = enVitrine.findIndex((autre) => autre.id === fiche.id);
    if (position < 0 || !enVitrine[position + sens]) return;

    const ordonnees = [...enVitrine];
    [ordonnees[position], ordonnees[position + sens]] = [
      ordonnees[position + sens],
      ordonnees[position],
    ];

    const aEcrire = ordonnees
      .map((entree, rang) => ({ entree, rang }))
      .filter(({ entree, rang }) => entree.ordreVitrine !== rang);

    // En série : les écritures visent des lignes distinctes, mais les envoyer
    // ensemble ferait invalider le cache autant de fois qu'il y a de lignes.
    for (const { entree, rang } of aEcrire) {
      await regler.mutateAsync({ id: entree.id, ordreVitrine: rang });
    }
  };

  const colonnes: ColonneConsole<EntreprisePourAdministration>[] = [
    {
      cle: "nom",
      entete: "Structure",
      cellule: (fiche) => (
        <div className="flex min-w-0 items-center gap-3">
          <Logo url={fiche.logoUrl} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{fiche.nom}</p>
            <p className="truncate text-xs text-muted-foreground">
              {fiche.user?.email ?? "Sans compte"}
            </p>
          </div>
        </div>
      ),
    },
    {
      cle: "type",
      entete: "Type",
      cellule: (fiche) =>
        fiche.typePartenaire ? (
          <span className="text-sm">{fiche.typePartenaire.nom}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Hors annuaire</span>
        ),
    },
    {
      cle: "secteur",
      entete: "Secteur",
      secondaire: true,
      cellule: (fiche) =>
        fiche.secteur ? (
          <span className="text-sm">{secteurLabel(fiche.secteur)}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      cle: "offres",
      entete: "Offres",
      align: "right",
      secondaire: true,
      cellule: (fiche) => <span className="tabular-nums">{fiche._count.offres}</span>,
    },
    {
      cle: "etat",
      entete: "Vitrine",
      cellule: (fiche) =>
        fiche.estVisibleVitrine ? (
          <ConsolePastille libelle="En vitrine" teinte="var(--success)" />
        ) : (
          <ConsolePastille libelle="Masquée" discret />
        ),
    },
    {
      cle: "actions",
      entete: "",
      align: "right",
      cellule: (fiche) => (
        <div className="flex items-center justify-end gap-1">
          {fiche.estVisibleVitrine ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                aria-label={`Remonter ${fiche.nom}`}
                disabled={regler.isPending || enVitrine[0]?.id === fiche.id}
                onClick={() => deplacer(fiche, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                aria-label={`Descendre ${fiche.nom}`}
                disabled={
                  regler.isPending || enVitrine[enVitrine.length - 1]?.id === fiche.id
                }
                onClick={() => deplacer(fiche, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
            </>
          ) : null}

          {fiche.typePartenaireId || fiche.estVisibleVitrine ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              aria-label={`Voir la page publique de ${fiche.nom}`}
              render={<Link href={`/partenaires/${fiche.id}`} target="_blank" />}
            >
              <ExternalLink className="size-4" />
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            aria-label={`Modifier ${fiche.nom}`}
            onClick={() => setEdition({ fiche })}
          >
            <Pencil className="size-4" />
          </Button>

          {!fiche.userId ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-destructive"
              aria-label={`Supprimer ${fiche.nom}`}
              disabled={supprimer.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `Supprimer « ${fiche.nom} » ? Ses offres restent en ligne, sans structure rattachée.`,
                  )
                ) {
                  supprimer.mutate(fiche.id);
                }
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}

          <Button
            variant={fiche.estVisibleVitrine ? "ghost" : "outline"}
            size="sm"
            className="rounded-lg"
            disabled={regler.isPending}
            onClick={() =>
              regler.mutate({ id: fiche.id, estVisibleVitrine: !fiche.estVisibleVitrine })
            }
          >
            {fiche.estVisibleVitrine ? (
              <>
                <EyeOff className="size-4" />
                Retirer
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Vitrine
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="Partenaires"
        icon={Store}
        teinte={TEINTE}
        description="Les structures classées dans un type forment l'annuaire et le menu de l'application ; celles mises en vitrine apparaissent aussi sur la page d'accueil. Une structure peut être créée ici sans compte."
        mesures={[
          { label: "Structures", valeur: fiches.length },
          { label: "Dans l'annuaire", valeur: classees },
          { label: "En vitrine", valeur: enVitrine.length, teinte: "var(--success)" },
        ]}
      />

      <SectionTypes types={types} />

      <ConsoleToolbar>
        <ConsoleSearch
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Nom, ville, email du compte…"
          label="Rechercher une structure partenaire"
        />
        {types.length > 0 ? (
          <ConsoleFiltre
            label="Filtrer par type"
            valeur={filtreType}
            onChange={setFiltreType}
            options={[
              { valeur: "", libelle: "Tous", compte: fiches.length },
              ...types.map((type) => ({
                valeur: String(type.id),
                libelle: type.nom,
                compte: fiches.filter((f) => f.typePartenaireId === type.id).length,
              })),
              {
                valeur: "aucun",
                libelle: "Hors annuaire",
                compte: fiches.length - classees,
              },
            ]}
          />
        ) : null}
        <Button className="ml-auto rounded-lg" onClick={() => setEdition({ fiche: null })}>
          <Plus className="size-4" />
          Nouvelle structure
        </Button>
      </ConsoleToolbar>

      <ConsoleTable
        lignes={filtrees}
        colonnes={colonnes}
        cle={(fiche) => fiche.id}
        chargement={isLoading}
        rail={(fiche) => (fiche.estVisibleVitrine ? "var(--success)" : undefined)}
        vide={
          <EmptyState
            icon={Store}
            couleur={TEINTE}
            title={recherche ? "Aucune structure ne correspond" : "Aucune structure partenaire"}
            description={
              recherche
                ? "Essayez sur le nom de la structure ou l'email du compte."
                : "Créez une structure avec le bouton ci-dessus, ou attendez qu'un compte partenaire renseigne la sienne."
            }
          />
        }
      />

      {edition ? (
        <DialogueFiche
          key={edition.fiche?.id ?? "nouvelle"}
          fiche={edition.fiche}
          types={types}
          onFermer={() => setEdition(null)}
        />
      ) : null}
    </>
  );
}
