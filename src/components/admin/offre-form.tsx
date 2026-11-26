"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  Circle,
  FileText,
  Info,
  Layers,
  Loader2,
  Lock,
  Save,
  School,
  Search,
  Send,
  type LucideIcon,
} from "lucide-react";
import { ConsolePanneau } from "@/components/admin/console-kit";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EditeurRiche } from "@/components/editeur/editeur-riche";
import { ChampsDynamiques } from "@/components/admin/champs-dynamiques";
import { MediasEnAttente, OffreMedias } from "@/components/admin/offre-medias";
import {
  errorMessage,
  offresApi,
  typesOffresApi,
  partenaireApi,
  centresApi,
} from "@/lib/api";
import {
  NIVEAU_EXPERIENCE_LABELS,
  SECTEUR_LABELS,
  TYPE_EMPLOI_LABELS,
} from "@/lib/enums";
import type {
  Media,
  NiveauExperience,
  Offre,
  Secteur,
  TypeEmploi,
  TypeOffreDef,
} from "@/lib/types";

/**
 * Formulaire de publication.
 *
 * Les informations communes (titre, description, secteur…) sont fixes ; tout ce
 * qui est propre à un type est décrit par l'API et rendu dynamiquement. Le
 * schéma de validation est donc reconstruit à chaque changement de type.
 */

const baseSchema = z.object({
  titre: z.string().trim().min(5, "Au moins 5 caractères").max(200),
  // Le texte saisi dans l'éditeur fait foi ; `description` n'est plus qu'une
  // dérivation calculée par le serveur, et n'a plus à être exigée ici.
  contenuHtml: z.string().default(""),
  extrait: z.string().trim().max(400, "400 caractères au maximum").optional(),
  estBrouillon: z.boolean().default(false),
  datePublicationPrevue: z.string().optional(),
  imageAlt: z.string().trim().max(300).optional(),
  metaTitre: z.string().trim().max(70, "70 caractères au maximum").optional(),
  metaDescription: z
    .string()
    .trim()
    .max(180, "180 caractères au maximum")
    .optional(),
  salaireMin: z.string().optional(),
  salaireMax: z.string().optional(),
  salaireDevise: z.string().optional(),
  salairePeriode: z.string().optional(),
  teletravail: z.string().optional(),
  nombrePostes: z.string().optional(),
  emailCandidature: z
    .string()
    .trim()
    .optional()
    .refine(
      (valeur) => !valeur || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valeur),
      "Adresse électronique invalide",
    ),
  instructionsCandidature: z.string().trim().max(2000).optional(),
  typeOffreId: z.string().min(1, "Choisissez un type d'offre"),
  typeEmploi: z.string(),
  secteur: z.string(),
  niveauExperience: z.string(),
  entreprise: z.string().trim().max(150),
  localisation: z.string().trim().max(150),
  url: z.string().trim().url("URL invalide").or(z.literal("")),
  dateLimite: z.string(),
});

interface FormInput extends z.infer<typeof baseSchema> {
  /** Valeurs des champs du type, indexées par code. Voir `ChampsDynamiques`. */
  champs: Record<string, string | boolean>;
}

/**
 * Construit la validation des champs du type sélectionné.
 *
 * Elle double celle du serveur, qui reste l'autorité : l'intérêt est de
 * signaler l'erreur au bon champ, immédiatement, plutôt que de renvoyer un
 * message global après un aller-retour.
 */
function schemaPour(type?: TypeOffreDef | null) {
  const champs: Record<string, z.ZodTypeAny> = {};

  for (const champ of type?.champs ?? []) {
    const requis = champ.obligatoire;

    switch (champ.type) {
      case "BOOLEEN":
        // Un booléen est toujours renseigné : « non » est une réponse.
        champs[champ.code] = z.boolean();
        break;

      case "NOMBRE":
        champs[champ.code] = z
          .string()
          .refine((v) => !v || Number.isFinite(Number(v)), "Nombre attendu")
          .refine((v) => !requis || v.trim() !== "", "Champ obligatoire");
        break;

      case "URL":
        champs[champ.code] = z
          .string()
          .refine(
            (v) => !v || /^https?:\/\/\S+$/i.test(v),
            "Adresse web invalide (http ou https)",
          )
          .refine((v) => !requis || v.trim() !== "", "Champ obligatoire");
        break;

      default:
        champs[champ.code] = z
          .string()
          .refine((v) => !requis || v.trim() !== "", "Champ obligatoire");
    }
  }

  return baseSchema.extend({ champs: z.object(champs) });
}

/**
 * Sigles courants dans les annonces, gardés en capitales quand un titre est
 * remis en minuscules. Les autres restent à vérifier par l'auteur.
 */
const SIGLES = new Set(
  (
    "CDI CDD CV ONG BTS DUT LMD MBA PHD RH IT TIC SIG IA PME UCAD UGB UASZ UADB " +
    "UAM ISEP ENA EPT ESP UNICEF PNUD USAID FAO OMS BAD BCEAO UEMOA CEDEAO " +
    "ANPEJ DER FONGIP ONFP SENELEC SONATEL SDE ONU UE M1 M2 L1 L2 L3 BAC"
  ).split(" "),
);

/** Noms de lieux qui reprennent leur majuscule. */
const LIEUX = new Set(
  (
    "sénégal dakar thiès ziguinchor casamance kolda sédhiou kaolack tambacounda " +
    "kédougou matam louga fatick kaffrine diourbel touba mbour rufisque pikine " +
    "guédiawaye bignona oussouye afrique france"
  ).split(" "),
);

/** Titre écrit en capitales : plus des trois quarts de ses lettres. */
function estEnMajuscules(texte: string): boolean {
  const lettres = texte.match(/\p{L}/gu) ?? [];
  if (lettres.length < 8) return false;
  const capitales = lettres.filter(
    (l) => l === l.toUpperCase() && l !== l.toLowerCase(),
  ).length;
  return capitales / lettres.length > 0.75;
}

/** « STAGE EN GESTION – UCAD » → « Stage en gestion – UCAD ». */
function enMinuscules(texte: string): string {
  const bas = texte
    .split(/(\s+)/)
    .map((mot) => {
      const nu = mot.replace(/[^\p{L}\p{N}]/gu, "");
      if (SIGLES.has(nu.toUpperCase())) return mot.toUpperCase();
      const minuscule = mot.toLowerCase();
      return LIEUX.has(nu.toLowerCase())
        ? minuscule.replace(/\p{L}/u, (l) => l.toUpperCase())
        : minuscule;
    })
    .join("");
  // Majuscule en tête de titre et après une fin de phrase.
  return bas.replace(/(^\s*|[.!?:|–—-]\s+)(\p{Ll})/gu, (_, avant: string, lettre: string) =>
    avant + lettre.toUpperCase(),
  );
}

const selectClass =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

/** Carte de section du formulaire : icône, titre, aide, grille de champs. */
function Section({
  title,
  description,
  icon,
  aside,
  grid = true,
  id,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Élément placé à droite de l'en-tête (compteur, lien…). */
  aside?: React.ReactNode;
  /** Faux : le contenu est rendu tel quel, sans grille à deux colonnes. */
  grid?: boolean;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <ConsolePanneau
      titre={title}
      description={description}
      icone={icon}
      actions={aside}
      className="scroll-mt-24"
      corpsClassName={grid ? "grid gap-4 p-5 sm:grid-cols-2" : "p-5"}
    >
      {id ? <span id={id} className="sr-only" /> : null}
      {children}
    </ConsolePanneau>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  /** Aide affichée sous le contrôle, remplacée par l'erreur s'il y en a une. */
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-semibold">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Ligne de la liste de contrôle « qualité de l'annonce ». */
function Controle({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      {ok ? (
        <CheckCircle2 className="mt-px size-3.5 shrink-0 text-[var(--success)]" aria-hidden />
      ) : (
        <Circle className="mt-px size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{children}</span>
      <span className="sr-only">{ok ? "(fait)" : "(à faire)"}</span>
    </li>
  );
}

/** Valeurs initiales des champs du type, converties pour les contrôles HTML. */
function valeursInitiales(
  type: TypeOffreDef | undefined,
  source: Record<string, unknown> | undefined,
): Record<string, string | boolean> {
  const valeurs: Record<string, string | boolean> = {};
  for (const champ of type?.champs ?? []) {
    const brute = source?.[champ.code];
    if (champ.type === "BOOLEEN") {
      valeurs[champ.code] = brute === true || brute === "true";
    } else if (champ.type === "DATE") {
      // Les dates sont stockées en ISO ; `<input type="date">` veut AAAA-MM-JJ.
      valeurs[champ.code] = brute ? String(brute).slice(0, 10) : "";
    } else {
      valeurs[champ.code] = brute === undefined || brute === null ? "" : String(brute);
    }
  }
  return valeurs;
}

/**
 * Type initial : celui de l'offre en cours de modification, sinon le premier
 * type actif. Un type désactivé depuis la publication n'apparaît plus dans la
 * liste ; on le rétablit ici pour ne pas réattribuer silencieusement l'offre à
 * un autre type lors d'un simple changement de titre.
 */
function typeInitialPour(
  offre: Offre | undefined,
  types: TypeOffreDef[],
): TypeOffreDef | undefined {
  if (!offre) return types[0];
  return (
    types.find((t) => t.id === offre.typeOffreId) ??
    types.find((t) => t.code === offre.typeOffre) ??
    offre.type ??
    undefined
  );
}

function OffreFormInner({
  offre,
  types,
  typeInitial,
  racine,
}: {
  offre?: Offre;
  types: TypeOffreDef[];
  typeInitial: TypeOffreDef;
  /** Liste vers laquelle revenir : la console ou l'espace partenaire. */
  racine: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(offre);

  // Rattachement à une structure : choisi dans la console seulement. Un
  // partenaire publie toujours au nom de sa structure, le serveur s'en charge.
  const estConsole = racine.startsWith("/admin");
  const [partenaireId, setPartenaireId] = useState(
    offre?.partenaireId ? String(offre.partenaireId) : "",
  );
  const { data: structures = [] } = useQuery({
    queryKey: ["admin", "vitrine"],
    queryFn: partenaireApi.listerPourAdministration,
    enabled: estConsole,
  });

  // Centres où la formation est dispensée : console seulement, et pour une
  // offre de formation. Le lien se règle aussi depuis la page des centres.
  const [centreIds, setCentreIds] = useState<number[]>(
    () => offre?.centresFormation?.map((c) => c.id) ?? [],
  );
  const { data: centres = [] } = useQuery({
    queryKey: ["admin", "centres"],
    queryFn: centresApi.listerPourAdministration,
    enabled: estConsole,
  });

  // Couverture choisie à la création. Sur une offre existante, elle est
  // appliquée tout de suite par `OffreMedias` et n'attend pas l'enregistrement.
  const [couverture, setCouverture] = useState<Media | null>(null);
  const [documentEnAttente, setDocumentEnAttente] = useState<File | null>(null);

  const typeRef = useRef<TypeOffreDef | undefined>(typeInitial);

  const form = useForm<FormInput>({
    // Le résolveur lit le type courant dans une référence : le schéma dépend du
    // type sélectionné, qui change en cours de saisie.
    resolver: (values, context, options) =>
      (
        zodResolver(schemaPour(typeRef.current)) as unknown as Resolver<FormInput>
      )(values, context, options),
    defaultValues: {
      titre: offre?.titre ?? "",
      contenuHtml: offre?.contenuHtml ?? "",
      extrait: offre?.extrait ?? "",
      estBrouillon: offre?.estBrouillon ?? false,
      datePublicationPrevue: offre?.datePublicationPrevue?.slice(0, 10) ?? "",
      imageAlt: offre?.imageAlt ?? "",
      metaTitre: offre?.metaTitre ?? "",
      metaDescription: offre?.metaDescription ?? "",
      salaireMin: offre?.salaireMin?.toString() ?? "",
      salaireMax: offre?.salaireMax?.toString() ?? "",
      salaireDevise: offre?.salaireDevise ?? "FCFA",
      salairePeriode: offre?.salairePeriode ?? "mois",
      teletravail: offre?.teletravail ?? "",
      nombrePostes: offre?.nombrePostes?.toString() ?? "",
      emailCandidature: offre?.emailCandidature ?? "",
      instructionsCandidature: offre?.instructionsCandidature ?? "",
      typeOffreId: String(typeInitial.id),
      typeEmploi: offre?.typeEmploi ?? "",
      secteur: offre?.secteur ?? "",
      niveauExperience: offre?.niveauExperience ?? "",
      entreprise: offre?.entreprise ?? "",
      localisation: offre?.localisation ?? "",
      url: offre?.url ?? "",
      dateLimite: offre?.dateLimite ? offre.dateLimite.slice(0, 10) : "",
      champs: valeursInitiales(typeInitial, offre?.champs),
    },
  });

  const typeOffreId = form.watch("typeOffreId");
  const titreSaisi = form.watch("titre");
  const typeSelectionne =
    types.find((t) => String(t.id) === typeOffreId) ??
    (String(typeInitial.id) === typeOffreId ? typeInitial : undefined);

  typeRef.current = typeSelectionne;

  function changerType(id: string) {
    const suivant = types.find((t) => String(t.id) === id);
    // Les valeurs sont réinitialisées à partir de l'offre : un champ de même
    // code présent dans les deux types conserve sa valeur, les autres repartent
    // à vide plutôt que de traîner des restes du type précédent.
    form.setValue("typeOffreId", id);
    form.setValue("champs", valeursInitiales(suivant, offre?.champs));
  }

  const save = useMutation({
    mutationFn: async (values: FormInput) => {
      const type = types.find((t) => String(t.id) === values.typeOffreId);

      const champs: Record<string, unknown> = {};
      for (const champ of type?.champs ?? []) {
        const valeur = values.champs[champ.code];
        if (champ.type === "BOOLEEN") {
          champs[champ.code] = Boolean(valeur);
          continue;
        }
        const texte = String(valeur ?? "").trim();
        if (!texte) continue;
        champs[champ.code] = champ.type === "NOMBRE" ? Number(texte) : texte;
      }

      const payload = {
        titre: values.titre,
        // `description` n'est plus envoyée : le serveur la dérive du contenu
        // riche, ce qui garantit que les deux disent la même chose.
        contenuHtml: values.contenuHtml,
        extrait: values.extrait || undefined,
        estBrouillon: values.estBrouillon,
        datePublicationPrevue: values.datePublicationPrevue
          ? new Date(values.datePublicationPrevue).toISOString()
          : undefined,
        imageAlt: values.imageAlt || undefined,
        metaTitre: values.metaTitre || undefined,
        metaDescription: values.metaDescription || undefined,
        salaireMin: values.salaireMin ? Number(values.salaireMin) : undefined,
        salaireMax: values.salaireMax ? Number(values.salaireMax) : undefined,
        salaireDevise: values.salaireDevise || undefined,
        salairePeriode: values.salairePeriode || undefined,
        teletravail: values.teletravail || undefined,
        nombrePostes: values.nombrePostes ? Number(values.nombrePostes) : undefined,
        emailCandidature: values.emailCandidature || undefined,
        instructionsCandidature: values.instructionsCandidature || undefined,
        typeOffreId: Number(values.typeOffreId),
        champs,
        typeEmploi: values.typeEmploi || undefined,
        secteur: values.secteur || undefined,
        niveauExperience: values.niveauExperience || undefined,
        entreprise: values.entreprise || undefined,
        ...(estConsole
          ? { partenaireId: partenaireId ? Number(partenaireId) : null }
          : {}),
        // Envoyé seulement pour une formation : le serveur détache de toute
        // façon les centres d'une offre qui change de type.
        ...(estConsole && typeSelectionne?.code === "FORMATION"
          ? { centreFormationIds: centreIds }
          : {}),
        localisation: values.localisation || undefined,
        url: values.url || undefined,
        dateLimite: values.dateLimite || undefined,
        ...(!offre && couverture ? { imageId: couverture.id } : {}),
      };

      const enregistree = offre
        ? await offresApi.update(offre.id, payload as Partial<Offre>)
        : await offresApi.create(payload as Partial<Offre>);

      // À la création seulement : la route d'envoi du document exige
      // l'identifiant de l'offre. Un échec d'envoi ne doit pas faire échouer la
      // création — elle est déjà enregistrée — mais doit être signalé. La
      // couverture, elle, est partie avec l'offre.
      if (!offre) {
        if (documentEnAttente) {
          try {
            await offresApi.uploadDocument(enregistree.id, documentEnAttente);
          } catch (error) {
            toast.error("Offre créée, mais le document n'a pas pu être envoyé", {
              description: errorMessage(error),
            });
          }
        }
      }

      return enregistree;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "offres"] });
      await queryClient.invalidateQueries({ queryKey: ["offres"] });
      await queryClient.invalidateQueries({ queryKey: ["mes-offres"] });

      // Une offre déposée par un partenaire n'est pas publiée : le dire tout de
      // suite évite qu'il la cherche en vain dans le catalogue.
      if (result.statutModeration === "EN_ATTENTE") {
        toast.success("Offre transmise pour validation", {
          description:
            "L'équipe Noken la relit avant publication. Vous serez prévenu de sa décision.",
        });
      } else {
        toast.success(isEdit ? "Offre modifiée" : "Offre créée");
      }

      router.push(
        isEdit ? racine : `${racine}/${result.id}/modifier`,
      );
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", { description: errorMessage(error) }),
  });

  // Le texte alternatif se range sous la couverture qu'il décrit.
  const champAlt = (
    <Field label="Texte alternatif de la couverture" htmlFor="imageAlt">
      <Input
        id="imageAlt"
        placeholder="Ce que montre l'image"
        {...form.register("imageAlt")}
      />
    </Field>
  );

  /** Reprend la description de l'image choisie, si l'offre n'en a pas. */
  function reprendreAlt(media: Media | null) {
    if (media?.alt && !form.getValues("imageAlt")?.trim()) {
      form.setValue("imageAlt", media.alt, { shouldDirty: true });
    }
  }

  // Le compteur porte sur le texte, pas sur le balisage : « <p><strong>x</strong></p> »
  // ne fait qu'un mot.
  const contenuHtml = form.watch("contenuHtml");
  const motsDuContenu = contenuHtml
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  // Liste de contrôle : ce qui fait une annonce utile pour un jeune.
  const extraitSaisi = form.watch("extrait") ?? "";
  const urlSaisie = form.watch("url") ?? "";
  const emailSaisi = form.watch("emailCandidature") ?? "";
  const dateLimiteSaisie = form.watch("dateLimite") ?? "";
  const metaTitreSaisi = form.watch("metaTitre") ?? "";
  const metaDescriptionSaisie = form.watch("metaDescription") ?? "";
  const brouillon = form.watch("estBrouillon");
  const aCouverture = Boolean(offre?.imageUrl || couverture);
  const controles = [
    { ok: (titreSaisi ?? "").trim().length >= 5 && !estEnMajuscules(titreSaisi ?? ""), texte: "Titre clair, sans majuscules partout" },
    { ok: motsDuContenu >= 60, texte: "Contenu détaillé (60 mots au moins)" },
    { ok: extraitSaisi.trim().length > 0, texte: "Accroche rédigée" },
    { ok: Boolean(urlSaisie.trim() || emailSaisi.trim()), texte: "Moyen de candidater (lien ou email)" },
    { ok: Boolean(dateLimiteSaisie), texte: "Date limite indiquée" },
    { ok: aCouverture, texte: "Photo de couverture" },
  ];
  const faits = controles.filter((c) => c.ok).length;
  const nbErreurs = Object.keys(form.formState.errors).length;

  const libelleEnvoi = brouillon
    ? "Enregistrer le brouillon"
    : isEdit
      ? "Enregistrer"
      : "Publier l'offre";

  const boutonEnvoi = (classe?: string) => (
    <Button type="submit" className={cn("rounded-xl", classe)} disabled={save.isPending}>
      {save.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : brouillon || isEdit ? (
        <Save className="size-4" />
      ) : (
        <Send className="size-4" />
      )}
      {libelleEnvoi}
    </Button>
  );

  return (
    <form
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      className="grid gap-5 pb-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start"
      noValidate
    >
      <div className="min-w-0 space-y-5">
        <Section
          title="Informations générales"
          description="Ce que le membre voit d'abord dans les listes."
          icon={Info}
        >
          <Field
            label="Titre"
            htmlFor="titre"
            className="sm:col-span-2"
            error={form.formState.errors.titre?.message}
          >
            <Input id="titre" className="h-10 text-base font-medium" {...form.register("titre")} />
            {/* Beaucoup d'annonces arrivent recopiées d'une affiche, tout en
                capitales : elles se lisent mal et paraissent crier au milieu
                des autres dans le catalogue. */}
            {estEnMajuscules(titreSaisi ?? "") ? (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-[color-mix(in_oklch,var(--warning)_12%,transparent)] px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                Titre en majuscules : il sera plus lisible en minuscules.
                <button
                  type="button"
                  className="font-semibold underline underline-offset-2 hover:no-underline"
                  onClick={() =>
                    form.setValue("titre", enMinuscules(titreSaisi), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  Mettre en minuscules
                </button>
                <span className="text-muted-foreground">(vérifiez ensuite les sigles)</span>
              </p>
            ) : null}
          </Field>

          <Field
            label="Type d'opportunité"
            htmlFor="typeOffreId"
            error={form.formState.errors.typeOffreId?.message}
            hint="Les champs « Détails » s'adaptent au type choisi."
          >
            <select
              id="typeOffreId"
              className={selectClass}
              value={typeOffreId}
              onChange={(event) => changerType(event.target.value)}
            >
              {/* Le type d'une offre publiée peut avoir été désactivé depuis :
                  il est alors absent de la liste, on l'ajoute pour ne pas le
                  remplacer à l'insu de l'administrateur. */}
              {typeInitial && !types.some((t) => t.id === typeInitial.id) ? (
                <option value={String(typeInitial.id)}>
                  {typeInitial.libelle} (désactivé)
                </option>
              ) : null}
              {types.map((type) => (
                <option key={type.id} value={String(type.id)}>
                  {type.libelle}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Secteur" htmlFor="secteur">
            <select id="secteur" className={selectClass} {...form.register("secteur")}>
              <option value="">Non précisé</option>
              {(Object.keys(SECTEUR_LABELS) as Secteur[]).map((s) => (
                <option key={s} value={s}>
                  {SECTEUR_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Entreprise / organisme" htmlFor="entreprise">
            <Input id="entreprise" {...form.register("entreprise")} />
          </Field>

          <Field label="Localisation" htmlFor="localisation">
            <Input
              id="localisation"
              placeholder="Ziguinchor, Casamance"
              {...form.register("localisation")}
            />
          </Field>

          <Field label="Type de contrat" htmlFor="typeEmploi">
            <select id="typeEmploi" className={selectClass} {...form.register("typeEmploi")}>
              <option value="">Non précisé</option>
              {(Object.keys(TYPE_EMPLOI_LABELS) as TypeEmploi[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_EMPLOI_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Niveau d'expérience" htmlFor="niveauExperience">
            <select
              id="niveauExperience"
              className={selectClass}
              {...form.register("niveauExperience")}
            >
              <option value="">Non précisé</option>
              {(Object.keys(NIVEAU_EXPERIENCE_LABELS) as NiveauExperience[]).map((n) => (
                <option key={n} value={n}>
                  {NIVEAU_EXPERIENCE_LABELS[n]}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        {estConsole ? (
          <Section
            title="Rattachement"
            description="Structure au nom de laquelle l'offre paraît, et centres qui dispensent une formation."
            icon={Building2}
          >
            <Field
              label="Structure partenaire"
              htmlFor="partenaireId"
              className={typeSelectionne?.code === "FORMATION" ? undefined : "sm:col-span-2"}
              hint="L'offre rejoint le catalogue de la structure, sur sa vitrine."
            >
              <select
                id="partenaireId"
                className={selectClass}
                value={partenaireId}
                onChange={(e) => {
                  const choix = e.target.value;
                  setPartenaireId(choix);
                  // Le nom affiché sur l'offre suit la structure choisie, tant
                  // qu'aucun autre n'a été saisi.
                  const structure = structures.find((x) => String(x.id) === choix);
                  if (structure && !form.getValues("entreprise")) {
                    form.setValue("entreprise", structure.nom, { shouldDirty: true });
                  }
                }}
              >
                <option value="">Aucune</option>
                {structures.map((structure) => (
                  <option key={structure.id} value={structure.id}>
                    {structure.nom}
                  </option>
                ))}
              </select>
            </Field>

            {typeSelectionne?.code === "FORMATION" ? (
              <Field
                label={`Centres de formation${centreIds.length ? ` (${centreIds.length})` : ""}`}
                htmlFor="centres-formation"
                hint="La formation apparaît sur la fiche de chaque centre coché."
              >
                {centres.length === 0 ? (
                  <p
                    id="centres-formation"
                    className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground"
                  >
                    <School className="size-4 shrink-0" aria-hidden />
                    Aucun centre référencé. Créez-en depuis la page Centres de formation.
                  </p>
                ) : (
                  <div
                    id="centres-formation"
                    className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1.5"
                  >
                    {centres.map((centre) => {
                      const coche = centreIds.includes(centre.id);
                      return (
                        <label
                          key={centre.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                            coche ? "bg-primary/[0.07]" : "hover:bg-muted/50",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={coche}
                            onChange={(e) =>
                              setCentreIds((avant) =>
                                e.target.checked
                                  ? [...avant, centre.id]
                                  : avant.filter((id) => id !== centre.id),
                              )
                            }
                          />
                          <span className="truncate">
                            {centre.nom}
                            {centre.ville ? (
                              <span className="text-muted-foreground"> · {centre.ville}</span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </Field>
            ) : null}
          </Section>
        ) : null}

        {/* Le corps de l'annonce a sa propre carte, pleine largeur : c'est le
            seul champ qu'on travaille longuement, et le serrer dans une grille à
            deux colonnes revenait à écrire un article dans une case. */}
        <Section
          title="Contenu de l'annonce"
          description="Missions, profil recherché, avantages : le texte complet."
          icon={FileText}
          grid={false}
          aside={
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
              {motsDuContenu} mot{motsDuContenu > 1 ? "s" : ""}
            </span>
          }
        >
          <Controller
            control={form.control}
            name="contenuHtml"
            render={({ field }) => (
              <EditeurRiche valeur={field.value} onChange={field.onChange} />
            )}
          />

          <div className="mt-5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="extrait" className="text-[13px] font-semibold">
                Accroche
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {extraitSaisi.length}/400
              </span>
            </div>
            <Textarea
              id="extrait"
              rows={2}
              maxLength={400}
              className="mt-1.5"
              placeholder="Résumé affiché dans les listes et les aperçus de partage. Laissé vide, il est tiré du contenu."
              {...form.register("extrait")}
            />
            {form.formState.errors.extrait ? (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {form.formState.errors.extrait.message}
              </p>
            ) : null}
          </div>
        </Section>

        <ChampsDynamiques type={typeSelectionne} form={form} />

        <Section
          title="Candidature"
          description="Comment et jusqu'à quand postuler."
          icon={Send}
        >
          <Field
            label="Lien de candidature"
            htmlFor="url"
            error={form.formState.errors.url?.message}
          >
            <Input id="url" type="url" placeholder="https://…" {...form.register("url")} />
          </Field>

          <Field label="Date limite" htmlFor="dateLimite">
            <Input id="dateLimite" type="date" {...form.register("dateLimite")} />
          </Field>

          <Field
            label="Adresse de réception"
            htmlFor="emailCandidature"
            className="sm:col-span-2"
            error={form.formState.errors.emailCandidature?.message}
          >
            <Input
              id="emailCandidature"
              type="email"
              placeholder="recrutement@exemple.sn"
              {...form.register("emailCandidature")}
            />
          </Field>
          <Field
            label="Marche à suivre"
            htmlFor="instructionsCandidature"
            className="sm:col-span-2"
          >
            <Textarea
              id="instructionsCandidature"
              rows={3}
              placeholder="Pièces à fournir, format attendu, objet du message…"
              {...form.register("instructionsCandidature")}
            />
          </Field>
        </Section>

        <Section title="Rémunération et conditions" icon={Banknote}>
          <Field label="Salaire minimum" htmlFor="salaireMin">
            <Input id="salaireMin" type="number" min={0} {...form.register("salaireMin")} />
          </Field>
          <Field label="Salaire maximum" htmlFor="salaireMax">
            <Input id="salaireMax" type="number" min={0} {...form.register("salaireMax")} />
          </Field>
          <Field label="Devise" htmlFor="salaireDevise">
            <Input id="salaireDevise" {...form.register("salaireDevise")} />
          </Field>
          <Field label="Période" htmlFor="salairePeriode">
            <select
              id="salairePeriode"
              className={selectClass}
              {...form.register("salairePeriode")}
            >
              <option value="mois">par mois</option>
              <option value="an">par an</option>
              <option value="jour">par jour</option>
              <option value="heure">par heure</option>
              <option value="mission">pour la mission</option>
            </select>
          </Field>
          <Field label="Télétravail" htmlFor="teletravail">
            <select
              id="teletravail"
              className={selectClass}
              {...form.register("teletravail")}
            >
              <option value="">Non précisé</option>
              <option value="aucun">Sur site</option>
              <option value="hybride">Hybride</option>
              <option value="total">Intégral</option>
            </select>
          </Field>
          <Field label="Nombre de postes" htmlFor="nombrePostes">
            <Input
              id="nombrePostes"
              type="number"
              min={1}
              {...form.register("nombrePostes")}
            />
          </Field>
        </Section>

        {offre ? (
          <OffreMedias
            offre={offre}
            champAlt={champAlt}
            onCouvertureChoisie={reprendreAlt}
          />
        ) : (
          <MediasEnAttente
            couverture={couverture}
            onCouverture={(media) => {
              setCouverture(media);
              reprendreAlt(media);
            }}
            document={documentEnAttente}
            onDocument={setDocumentEnAttente}
            champAlt={champAlt}
          />
        )}

        <Section
          title="Référencement"
          description="Titre et description affichés par les moteurs de recherche."
          icon={Search}
        >
          <Field
            label="Titre pour les moteurs"
            htmlFor="metaTitre"
            error={form.formState.errors.metaTitre?.message}
            hint={`${metaTitreSaisi.length}/70`}
          >
            <Input
              id="metaTitre"
              maxLength={70}
              placeholder="Repris du titre si laissé vide"
              {...form.register("metaTitre")}
            />
          </Field>
          <Field
            label="Description pour les moteurs"
            htmlFor="metaDescription"
            error={form.formState.errors.metaDescription?.message}
            hint={`${metaDescriptionSaisie.length}/180`}
          >
            <Input
              id="metaDescription"
              maxLength={180}
              placeholder="Reprise de l'accroche si laissée vide"
              {...form.register("metaDescription")}
            />
          </Field>

          {/* Aperçu d'un résultat de recherche, pour juger de la coupe. */}
          <div className="rounded-xl border bg-muted/20 p-4 sm:col-span-2">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Aperçu dans un moteur de recherche
            </p>
            <p className="truncate text-xs text-muted-foreground">
              noken.app › offres
            </p>
            <p className="mt-0.5 line-clamp-1 text-base font-medium text-[var(--c-blue)]">
              {metaTitreSaisi.trim() || titreSaisi?.trim() || "Titre de l'offre"}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {metaDescriptionSaisie.trim() ||
                extraitSaisi.trim() ||
                "La description est tirée de l'accroche, ou à défaut du début du contenu."}
            </p>
          </div>
        </Section>
      </div>

      {/* Colonne latérale : publication, qualité, actions. */}
      <aside className="space-y-5 lg:sticky lg:top-[calc(var(--console-entete,3.5rem)+1.25rem)]">
        <ConsolePanneau titre="Publication" icone={Layers}>
          <div className="space-y-4">
            {offre ? (
              <div className="flex flex-wrap gap-1.5">
                {offre.statutModeration === "EN_ATTENTE" ? (
                  <EtatPublication teinte="var(--warning)">En attente de validation</EtatPublication>
                ) : offre.statutModeration === "REFUSEE" ? (
                  <EtatPublication teinte="var(--destructive)">Refusée</EtatPublication>
                ) : offre.estBrouillon ? (
                  <EtatPublication>Brouillon</EtatPublication>
                ) : (
                  <EtatPublication teinte="var(--success)">Publiée</EtatPublication>
                )}
                {offre.estCloturee ? (
                  <EtatPublication>
                    <Lock className="size-3" aria-hidden /> Clôturée
                  </EtatPublication>
                ) : null}
              </div>
            ) : null}

            {offre?.statutModeration === "REFUSEE" && offre.motifRefus ? (
              <p className="rounded-lg bg-destructive/8 px-3 py-2 text-xs leading-relaxed text-destructive">
                <strong className="font-semibold">Motif : </strong>
                {offre.motifRefus}
              </p>
            ) : null}

            <label
              htmlFor="estBrouillon"
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                brouillon ? "border-primary/30 bg-primary/[0.04]" : "bg-muted/30",
              )}
            >
              <Controller
                control={form.control}
                name="estBrouillon"
                render={({ field }) => (
                  <Switch
                    id="estBrouillon"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                )}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Garder en brouillon</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  Visible de vous seul, sans passer en relecture tant que vous ne
                  l&apos;avez pas terminée.
                </span>
              </span>
            </label>

            <Field
              label="Publier à partir du"
              htmlFor="datePublicationPrevue"
              hint="Laissé vide, l'offre paraît dès sa validation."
            >
              <Input
                id="datePublicationPrevue"
                type="date"
                {...form.register("datePublicationPrevue")}
              />
            </Field>

            {nbErreurs > 0 ? (
              <p className="flex items-center gap-2 rounded-lg bg-destructive/8 px-3 py-2 text-xs font-medium text-destructive">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                {nbErreurs} champ{nbErreurs > 1 ? "s" : ""} à corriger.
              </p>
            ) : null}

            <div className="hidden gap-2 lg:grid">
              {boutonEnvoi("w-full")}
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-xl"
                onClick={() => router.push(racine)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </ConsolePanneau>

        <ConsolePanneau
          titre="Qualité de l'annonce"
          icone={CheckCircle2}
          teinte="var(--success)"
          actions={
            <span className="text-xs font-bold tabular-nums text-muted-foreground">
              {faits}/{controles.length}
            </span>
          }
        >
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--success)] transition-all duration-500"
              style={{ width: `${(faits / controles.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-2">
            {controles.map((c) => (
              <Controle key={c.texte} ok={c.ok}>
                {c.texte}
              </Controle>
            ))}
          </ul>
        </ConsolePanneau>
      </aside>

      {/* Barre d'actions sur petit écran : la colonne latérale y est en bas. */}
      <div className="sticky bottom-16 z-10 flex justify-end gap-2 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur lg:hidden">
        <Button type="button" variant="ghost" className="rounded-xl" onClick={() => router.push(racine)}>
          Annuler
        </Button>
        {boutonEnvoi()}
      </div>
    </form>
  );
}

/** Pastille d'état de l'offre, dans la colonne de publication. */
function EtatPublication({
  teinte,
  children,
}: {
  teinte?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        !teinte && "bg-muted text-muted-foreground",
      )}
      style={
        teinte
          ? {
              background: `color-mix(in oklch, ${teinte} 13%, transparent)`,
              color: teinte,
            }
          : undefined
      }
    >
      {teinte ? (
        <span aria-hidden className="size-1.5 rounded-full" style={{ background: teinte }} />
      ) : null}
      {children}
    </span>
  );
}

/**
 * Formulaire d'offre, partagé par la console et l'espace partenaire.
 *
 * Le même écran sert les deux : les champs, la validation et les envois de
 * médias sont identiques, seule la destination du retour change. Le duppliquer
 * garantirait qu'une correction n'atterrisse un jour que d'un côté.
 */
export function OffreForm({
  offre,
  racine = "/admin/offres",
}: {
  offre?: Offre;
  racine?: string;
}) {
  const router = useRouter();

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["types-offres"],
    queryFn: () => typesOffresApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const typeInitial = typeInitialPour(offre, types);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!typeInitial) {
    return (
      <div className="dashed-frame px-6 py-12 text-center">
        <p className="text-sm font-medium">Aucun type d&apos;offre actif</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Une offre doit être rattachée à un type. Créez-en un depuis
          l&apos;administration des types d&apos;offres.
        </p>
        <Button
          size="sm"
          className="mt-4"
          onClick={() => router.push("/admin/types-offres/nouveau")}
        >
          Créer un type
        </Button>
      </div>
    );
  }

  // Le formulaire n'est monté qu'une fois les types connus : ils déterminent
  // ses valeurs initiales, qu'un remontage ultérieur écraserait.
  return (
    <OffreFormInner
      key={typeInitial.id}
      offre={offre}
      types={types}
      typeInitial={typeInitial}
      racine={racine}
    />
  );
}
