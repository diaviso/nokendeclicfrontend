"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Building2,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Store,
  Tags,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
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
  ConsoleSection,
  useConfirmation,
} from "@/components/admin/console-kit";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
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

const TEINTE = "var(--c-lime)";
const CLE = ["admin", "vitrine"] as const;
const CLE_TYPES = ["partenaires", "types"] as const;

const classeSelect =
  "h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30";

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

  const valide = nom.trim().length >= 2;

  return (
    <ConsoleDialogue
      ouvert={ouvert}
      onFermer={onFermer}
      icone={type ? Pencil : Tags}
      teinte={TEINTE}
      titre={type ? `Modifier le type « ${type.nom} »` : "Nouveau type de partenaire"}
      description="Chaque type devient une entrée du menu et une page d'annuaire regroupant ses structures."
      onSubmit={() => valide && enregistrer.mutate()}
      pied={
        <>
          <Button type="button" variant="ghost" className="rounded-lg" onClick={onFermer}>
            Annuler
          </Button>
          <Button type="submit" className="rounded-lg" disabled={enregistrer.isPending || !valide}>
            {enregistrer.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {type ? "Enregistrer" : "Créer le type"}
          </Button>
        </>
      }
    >
      <ConsoleSection colonnes={1}>
        <ConsoleChamp id="type-nom" libelle="Nom" requis>
          <Input
            id="type-nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Entreprises, ONG, Centres de formation…"
            maxLength={80}
            required
          />
        </ConsoleChamp>
        <ConsoleChamp
          id="type-description"
          libelle="Description (facultative)"
          aide="Affichée en tête de la page d'annuaire du type."
        >
          <Textarea
            id="type-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </ConsoleChamp>
        <ConsoleChamp
          id="type-ordre"
          libelle="Ordre dans le menu"
          aide="Les plus petits nombres apparaissent en premier."
          className="max-w-40"
        >
          <Input
            id="type-ordre"
            type="number"
            value={ordre}
            onChange={(e) => setOrdre(e.target.value)}
          />
        </ConsoleChamp>
      </ConsoleSection>
    </ConsoleDialogue>
  );
}

function SectionTypes({ types }: { types: TypePartenaire[] }) {
  const queryClient = useQueryClient();
  const confirmer = useConfirmation();
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
    <section className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="flex flex-wrap items-center gap-3 border-b px-5 py-3.5">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklch, ${TEINTE} 14%, transparent)`,
            color: TEINTE,
          }}
        >
          <Tags className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold">
            Types de partenaires
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
              {types.length}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Une structure classée dans un type apparaît dans l&apos;annuaire et
            dans le menu. Sans type, elle reste privée.
          </p>
        </div>
        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEdition({ type: null })}>
          <Plus className="size-4" />
          Nouveau type
        </Button>
      </header>

      <div className="p-4">
        {types.length === 0 ? (
          <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
            Aucun type pour l&apos;instant. Créez-en un, par exemple
            « Entreprises » ou « ONG », puis classez-y vos structures.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {types.map((type) => (
              <li
                key={type.id}
                className="group flex items-center gap-3 rounded-xl border bg-background p-3 transition-shadow hover:shadow-sm"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-sm font-bold tabular-nums text-muted-foreground">
                  {type.ordre ?? 0}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{type.nom}</span>
                  <span className="block text-xs text-muted-foreground">
                    {type._count?.partenaires ?? 0} structure
                    {(type._count?.partenaires ?? 0) > 1 ? "s" : ""}
                  </span>
                </span>
                <ConsoleActions>
                  <ConsoleAction
                    libelle={`Modifier ${type.nom}`}
                    icone={Pencil}
                    ton="primaire"
                    onClick={() => setEdition({ type })}
                  />
                  <ConsoleAction
                    libelle={`Supprimer ${type.nom}`}
                    icone={Trash2}
                    ton="danger"
                    enCours={supprimer.isPending && supprimer.variables === type.id}
                    onClick={async () => {
                      if (
                        await confirmer({
                          titre: `Supprimer le type « ${type.nom} » ?`,
                          message:
                            "Ses structures ne seront plus dans l'annuaire, mais elles ne sont pas supprimées.",
                          confirmer: "Supprimer",
                          danger: true,
                        })
                      ) {
                        supprimer.mutate(type.id);
                      }
                    }}
                  />
                </ConsoleActions>
              </li>
            ))}
          </ul>
        )}
      </div>

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

  const valide = v.nom.trim().length >= 2;

  return (
    <ConsoleDialogue
      onFermer={onFermer}
      icone={fiche ? Pencil : Plus}
      teinte={TEINTE}
      taille="lg"
      titre={fiche ? `Modifier ${fiche.nom}` : "Nouvelle structure"}
      description={
        fiche?.user
          ? `Fiche du compte ${fiche.user.email}. Le partenaire peut aussi la modifier depuis son espace.`
          : "Structure référencée par l'administration, sans compte. Vous pourrez lui rattacher des offres depuis le formulaire d'offre."
      }
      onSubmit={() => valide && enregistrer.mutate()}
      pied={
        <>
          <Button type="button" variant="ghost" className="rounded-lg" onClick={onFermer}>
            Annuler
          </Button>
          <Button type="submit" className="rounded-lg" disabled={enregistrer.isPending || !valide}>
            {enregistrer.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {fiche ? "Enregistrer" : "Créer la structure"}
          </Button>
        </>
      }
    >
      <ConsoleSection titre="Identité" icone={Building2}>
        <ConsoleChoixImage
          libelle="Logo de la structure"
          aide="PNG, JPG ou WebP, fond clair de préférence"
          actuelle={fiche?.logoUrl ? fileUrl(fiche.logoUrl) : null}
          fichier={logo}
          onChange={setLogo}
          icone={Building2}
        />
        <ConsoleChamp id="fiche-nom" libelle="Nom de la structure" requis large>
          <Input id="fiche-nom" value={v.nom} onChange={changer("nom")} required maxLength={120} />
        </ConsoleChamp>
        <ConsoleChamp
          id="fiche-type"
          libelle="Type de partenaire"
          aide="Sans type, la structure reste hors de l'annuaire."
        >
          <select id="fiche-type" className={classeSelect} value={v.typePartenaireId} onChange={changer("typePartenaireId")}>
            <option value="">Aucun (hors annuaire)</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.nom}
              </option>
            ))}
          </select>
        </ConsoleChamp>
        <ConsoleChamp id="fiche-secteur" libelle="Secteur">
          <select id="fiche-secteur" className={classeSelect} value={v.secteur} onChange={changer("secteur")}>
            <option value="">Non précisé</option>
            {(Object.keys(SECTEUR_LABELS) as Secteur[]).map((valeur) => (
              <option key={valeur} value={valeur}>
                {SECTEUR_LABELS[valeur]}
              </option>
            ))}
          </select>
        </ConsoleChamp>
        <ConsoleChamp id="fiche-description" libelle="Présentation" large>
          <Textarea id="fiche-description" rows={4} value={v.description} onChange={changer("description")} maxLength={1500} />
        </ConsoleChamp>
        <ConsoleChamp id="fiche-taille" libelle="Taille" large>
          <Input id="fiche-taille" placeholder="10 à 49 salariés" value={v.taille} onChange={changer("taille")} />
        </ConsoleChamp>
      </ConsoleSection>

      <ConsoleSection titre="Localisation" icone={MapPin}>
        <ConsoleChamp id="fiche-ville" libelle="Ville">
          <Input id="fiche-ville" value={v.ville} onChange={changer("ville")} />
        </ConsoleChamp>
        <ConsoleChamp id="fiche-region" libelle="Région">
          <Input id="fiche-region" value={v.region} onChange={changer("region")} />
        </ConsoleChamp>
      </ConsoleSection>

      <ConsoleSection titre="Contact" icone={Phone}>
        <ConsoleChamp id="fiche-email" libelle="Email de contact">
          <Input id="fiche-email" type="email" value={v.emailContact} onChange={changer("emailContact")} />
        </ConsoleChamp>
        <ConsoleChamp id="fiche-tel" libelle="Téléphone">
          <Input id="fiche-tel" placeholder="+221 …" value={v.telephone} onChange={changer("telephone")} />
        </ConsoleChamp>
        <ConsoleChamp id="fiche-site" libelle="Site web" large>
          <Input id="fiche-site" type="url" placeholder="https://" value={v.siteWeb} onChange={changer("siteWeb")} />
        </ConsoleChamp>
      </ConsoleSection>
    </ConsoleDialogue>
  );
}

/* ----------------------------------------------------------------- Page */

export default function PartenairesConsolePage() {
  const queryClient = useQueryClient();
  const confirmer = useConfirmation();
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
  const avecCompte = fiches.filter((fiche) => fiche.userId).length;
  const offresRattachees = fiches.reduce((somme, fiche) => somme + fiche._count.offres, 0);

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
          <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md border bg-background px-2 py-0.5 text-xs font-medium">
            <Tags className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{fiche.typePartenaire.nom}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Hors annuaire</span>
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
      cellule: (fiche) => (
        <span
          className={cn(
            "inline-flex min-w-7 items-center justify-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums",
            fiche._count.offres ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Briefcase className="size-3" aria-hidden />
          {fiche._count.offres}
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "Vitrine",
      cellule: (fiche) =>
        fiche.estVisibleVitrine ? (
          <span className="inline-flex items-center gap-1.5">
            <ConsolePastille libelle="En vitrine" teinte="var(--success)" />
            <span className="text-xs tabular-nums text-muted-foreground">
              #{enVitrine.findIndex((autre) => autre.id === fiche.id) + 1}
            </span>
          </span>
        ) : (
          <ConsolePastille libelle="Masquée" discret />
        ),
    },
    {
      cle: "actions",
      entete: "",
      align: "right",
      className: "w-[19rem]",
      cellule: (fiche) => (
        <ConsoleActions>
          <Button
            variant={fiche.estVisibleVitrine ? "ghost" : "outline"}
            size="sm"
            className="mr-1 h-8 rounded-lg"
            disabled={regler.isPending}
            onClick={() =>
              regler.mutate({ id: fiche.id, estVisibleVitrine: !fiche.estVisibleVitrine })
            }
          >
            {fiche.estVisibleVitrine ? (
              <>
                <EyeOff className="size-3.5" />
                Retirer
              </>
            ) : (
              <>
                <Eye className="size-3.5" />
                Vitrine
              </>
            )}
          </Button>

          {fiche.estVisibleVitrine ? (
            <>
              <ConsoleAction
                libelle="Remonter dans la vitrine"
                icone={ArrowUp}
                disabled={regler.isPending || enVitrine[0]?.id === fiche.id}
                onClick={() => deplacer(fiche, -1)}
              />
              <ConsoleAction
                libelle="Descendre dans la vitrine"
                icone={ArrowDown}
                disabled={
                  regler.isPending || enVitrine[enVitrine.length - 1]?.id === fiche.id
                }
                onClick={() => deplacer(fiche, 1)}
              />
            </>
          ) : null}

          {fiche.typePartenaireId || fiche.estVisibleVitrine ? (
            <ConsoleAction
              libelle="Voir la page publique"
              icone={ExternalLink}
              href={`/partenaires/${fiche.id}`}
              cible="_blank"
            />
          ) : null}

          <ConsoleAction
            libelle="Modifier"
            icone={Pencil}
            ton="primaire"
            onClick={() => setEdition({ fiche })}
          />

          {!fiche.userId ? (
            <ConsoleAction
              libelle="Supprimer"
              icone={Trash2}
              ton="danger"
              enCours={supprimer.isPending && supprimer.variables === fiche.id}
              onClick={async () => {
                if (
                  await confirmer({
                    titre: `Supprimer « ${fiche.nom} » ?`,
                    message:
                      "Ses offres restent en ligne, sans structure rattachée. Cette action est définitive.",
                    confirmer: "Supprimer",
                    danger: true,
                  })
                ) {
                  supprimer.mutate(fiche.id);
                }
              }}
            />
          ) : null}
        </ConsoleActions>
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
          { label: "Dans l'annuaire", valeur: classees, teinte: TEINTE },
          { label: "En vitrine", valeur: enVitrine.length, teinte: "var(--success)" },
          { label: "Avec un compte", valeur: avecCompte },
          { label: "Offres rattachées", valeur: offresRattachees, teinte: "var(--primary)" },
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
        <Button className="rounded-xl sm:ml-auto" onClick={() => setEdition({ fiche: null })}>
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
            title={recherche || filtreType ? "Aucune structure ne correspond" : "Aucune structure partenaire"}
            description={
              recherche
                ? "Essayez sur le nom de la structure ou l'email du compte."
                : "Créez une structure, ou attendez qu'un compte partenaire renseigne la sienne."
            }
            action={
              recherche || filtreType ? (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setRecherche("");
                    setFiltreType("");
                  }}
                >
                  Effacer les filtres
                </Button>
              ) : (
                <Button className="rounded-xl" onClick={() => setEdition({ fiche: null })}>
                  <Plus className="size-4" />
                  Nouvelle structure
                </Button>
              )
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
