"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { EditeurRiche } from "@/components/editeur/editeur-riche";
import { ChampsDynamiques } from "@/components/admin/champs-dynamiques";
import { MediasEnAttente, OffreMedias } from "@/components/admin/offre-medias";
import { errorMessage, offresApi, typesOffresApi } from "@/lib/api";
import {
  NIVEAU_EXPERIENCE_LABELS,
  SECTEUR_LABELS,
  TYPE_EMPLOI_LABELS,
} from "@/lib/enums";
import type {
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

const selectClass =
  "h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
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

  const [imageEnAttente, setImageEnAttente] = useState<File | null>(null);
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
        localisation: values.localisation || undefined,
        url: values.url || undefined,
        dateLimite: values.dateLimite || undefined,
      };

      const enregistree = offre
        ? await offresApi.update(offre.id, payload as Partial<Offre>)
        : await offresApi.create(payload as Partial<Offre>);

      // À la création seulement : les routes d'envoi exigent l'identifiant de
      // l'offre. Un échec d'envoi ne doit pas faire échouer la création — elle
      // est déjà enregistrée — mais doit être signalé.
      if (!offre) {
        if (imageEnAttente) {
          try {
            await offresApi.uploadImage(enregistree.id, imageEnAttente);
          } catch (error) {
            toast.error("Offre créée, mais la couverture n'a pas pu être envoyée", {
              description: errorMessage(error),
            });
          }
        }
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

  // Le compteur porte sur le texte, pas sur le balisage : « <p><strong>x</strong></p> »
  // ne fait qu'un mot.
  const contenuHtml = form.watch("contenuHtml");
  const motsDuContenu = contenuHtml
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <form
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      className="space-y-4 pb-4"
      noValidate
    >
      <Section title="Informations générales">
        <Field
          label="Titre"
          htmlFor="titre"
          className="sm:col-span-2"
          error={form.formState.errors.titre?.message}
        >
          <Input id="titre" {...form.register("titre")} />
        </Field>

        <Field
          label="Type d'opportunité"
          htmlFor="typeOffreId"
          error={form.formState.errors.typeOffreId?.message}
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

      {/* Le corps de l'annonce a sa propre carte, pleine largeur : c'est le
          seul champ qu'on travaille longuement, et le serrer dans une grille à
          deux colonnes revenait à écrire un article dans une case. */}
      <section className="rounded-lg border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Contenu de l&apos;annonce</h2>
          <span className="text-xs text-muted-foreground">
            {motsDuContenu} mot{motsDuContenu > 1 ? "s" : ""}
          </span>
        </header>
        <div className="p-4">
          <Controller
            control={form.control}
            name="contenuHtml"
            render={({ field }) => (
              <EditeurRiche valeur={field.value} onChange={field.onChange} />
            )}
          />

          <div className="mt-4">
            <label
              htmlFor="extrait"
              className="text-sm font-medium text-muted-foreground"
            >
              Accroche
            </label>
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
        </div>
      </section>

      <Section title="Rémunération et conditions">
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

      <Section title="Candidature">
        <Field
          label="Adresse de réception"
          htmlFor="emailCandidature"
          error={form.formState.errors.emailCandidature?.message}
        >
          <Input
            id="emailCandidature"
            type="email"
            placeholder="recrutement@exemple.sn"
            {...form.register("emailCandidature")}
          />
        </Field>
        <Field label="Texte alternatif de la couverture" htmlFor="imageAlt">
          <Input
            id="imageAlt"
            placeholder="Ce que montre l'image"
            {...form.register("imageAlt")}
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

      <Section title="Publication">
        <Field label="Publier à partir du" htmlFor="datePublicationPrevue">
          <Input
            id="datePublicationPrevue"
            type="date"
            {...form.register("datePublicationPrevue")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Laissé vide, l&apos;offre paraît dès sa validation.
          </p>
        </Field>

        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 sm:col-span-1">
          <Controller
            control={form.control}
            name="estBrouillon"
            render={({ field }) => (
              <Switch
                id="estBrouillon"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <div className="min-w-0">
            <label htmlFor="estBrouillon" className="text-sm font-medium">
              Garder en brouillon
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Visible de vous seul, sans passer en relecture tant que vous ne
              l&apos;avez pas terminée.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Référencement">
        <Field
          label="Titre pour les moteurs"
          htmlFor="metaTitre"
          error={form.formState.errors.metaTitre?.message}
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
        >
          <Input
            id="metaDescription"
            maxLength={180}
            placeholder="Reprise de l'accroche si laissée vide"
            {...form.register("metaDescription")}
          />
        </Field>
      </Section>

      <ChampsDynamiques type={typeSelectionne} form={form} />

      {offre ? (
        <OffreMedias offre={offre} />
      ) : (
        <MediasEnAttente
          document={documentEnAttente}
          onImage={setImageEnAttente}
          onDocument={setDocumentEnAttente}
        />
      )}

      <div className="sticky bottom-16 z-10 flex justify-end gap-2 rounded-lg border bg-background/95 p-3 backdrop-blur lg:bottom-4">
        <Button type="button" variant="ghost" onClick={() => router.push(racine)}>
          Annuler
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {form.watch("estBrouillon")
            ? "Enregistrer le brouillon"
            : isEdit
              ? "Enregistrer"
              : "Publier l'offre"}
        </Button>
      </div>
    </form>
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
