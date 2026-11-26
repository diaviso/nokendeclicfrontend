"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type Control, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlignLeft,
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Hash,
  Layers,
  Link2,
  List,
  ListChecks,
  Loader2,
  Palette,
  Plus,
  Save,
  ToggleLeft,
  Trash2,
  Type as TypeIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/shared/tag-input";
import {
  ConsoleAction,
  ConsoleActions,
  ConsoleChamp,
  ConsoleInterrupteur,
  ConsolePanneau,
  ConsoleSection,
} from "@/components/admin/console-kit";
import { adminTypesOffresApi, errorMessage } from "@/lib/api";
import {
  COULEURS_TYPE,
  COULEUR_NOMS,
  ICONES_TYPE,
  ICONE_NOMS,
  styleType,
} from "@/lib/type-offre";
import { cn } from "@/lib/utils";
import type { TypeChamp, TypeOffreDef } from "@/lib/types";

/** Libellés des natures de champ proposées à l'administrateur. */
const TYPE_CHAMP_LABELS: Record<TypeChamp, string> = {
  TEXTE: "Texte court",
  TEXTE_LONG: "Texte long",
  NOMBRE: "Nombre",
  DATE: "Date",
  BOOLEEN: "Oui / Non",
  LISTE: "Liste de choix",
  URL: "Lien web",
};

/** Icône de chaque nature, reprise dans l'en-tête du champ et l'aperçu. */
const TYPE_CHAMP_ICONES: Record<TypeChamp, LucideIcon> = {
  TEXTE: TypeIcon,
  TEXTE_LONG: AlignLeft,
  NOMBRE: Hash,
  DATE: Calendar,
  BOOLEEN: ToggleLeft,
  LISTE: List,
  URL: Link2,
};

const TYPE_CHAMP_VALUES = Object.keys(TYPE_CHAMP_LABELS) as TypeChamp[];

const TEINTE = "var(--c-teal)";

const champSchema = z
  .object({
    id: z.number().optional(),
    /**
     * Présent uniquement pour un champ déjà enregistré, et jamais saisi : le
     * serveur dérive le code du libellé et garantit son unicité. Il reste
     * affiché — c'est la clé sous laquelle les offres rangent leurs valeurs, et
     * elle sert à lire un export ou à déboguer une intégration.
     */
    code: z.string().optional(),
    libelle: z.string().trim().min(2, "2 caractères minimum").max(80),
    type: z.enum(TYPE_CHAMP_VALUES as [TypeChamp, ...TypeChamp[]]),
    obligatoire: z.boolean(),
    options: z.array(z.string().trim().min(1).max(80)).max(50),
    placeholder: z.string().trim().max(120),
    aide: z.string().trim().max(200),
  })
  .refine((champ) => champ.type !== "LISTE" || champ.options.length > 0, {
    message: "Une liste de choix doit proposer au moins une option",
    path: ["options"],
  });

const schema = z.object({
  /** Idem : dérivé du libellé par le serveur, affiché mais jamais saisi. */
  code: z.string().optional(),
  libelle: z.string().trim().min(2, "2 caractères minimum").max(60),
  description: z.string().trim().max(300),
  icone: z.string(),
  couleur: z.string(),
  ordre: z.string(),
  estActif: z.boolean(),
  champs: z.array(champSchema).max(30, "30 champs au maximum"),
});

type FormInput = z.infer<typeof schema>;

const selectClass =
  "h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

/**
 * Pastille du code technique.
 *
 * Les codes ne se saisissent plus : le serveur les dérive du libellé et lève
 * les collisions, ce qu'un formulaire ne peut pas faire — il ignore les types
 * et les champs déjà enregistrés. Ils restent affichés une fois attribués,
 * parce qu'ils apparaissent dans les URL de filtre et dans les exports, et
 * qu'on a parfois besoin de les lire. Avant le premier enregistrement il n'y a
 * rien à montrer : le code n'existe pas encore.
 */
function CodeTechnique({ code }: { code?: string }) {
  if (!code) {
    return (
      <span className="text-[11px] text-muted-foreground/70">
        Code attribué à l&apos;enregistrement
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="uppercase tracking-wide">Code</span>
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{code}</code>
    </span>
  );
}

/** Une ligne du constructeur de champs. */
function ChampRow({
  form,
  index,
  total,
  onMove,
  onRemove,
}: {
  form: UseFormReturn<FormInput>;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const erreurs = form.formState.errors.champs?.[index];
  const type = form.watch(`champs.${index}.type`);
  const options = form.watch(`champs.${index}.options`);
  const code = form.watch(`champs.${index}.code`);
  const libelle = form.watch(`champs.${index}.libelle`);
  const obligatoire = form.watch(`champs.${index}.obligatoire`);
  const dejaEnregistre = Boolean(form.watch(`champs.${index}.id`));
  const IconeNature = TYPE_CHAMP_ICONES[type] ?? TypeIcon;

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm transition-colors",
        erreurs && "border-destructive/40",
      )}
    >
      <div className="flex items-center gap-2.5 border-b bg-muted/30 px-3 py-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <IconeNature className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            <span className="mr-1.5 tabular-nums text-muted-foreground">
              {index + 1}.
            </span>
            {libelle?.trim() || "Nouveau champ"}
            {obligatoire ? <span className="text-destructive"> *</span> : null}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
            {TYPE_CHAMP_LABELS[type]}
            {dejaEnregistre ? (
              <span className="rounded bg-[color-mix(in_oklch,var(--success)_14%,transparent)] px-1.5 font-medium text-[var(--success)]">
                Enregistré
              </span>
            ) : null}
            <span className="hidden sm:inline">
              <CodeTechnique code={code} />
            </span>
          </p>
        </div>

        <ConsoleActions>
          <ConsoleAction
            libelle="Monter le champ"
            icone={ChevronUp}
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
          />
          <ConsoleAction
            libelle="Descendre le champ"
            icone={ChevronDown}
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
          />
          <ConsoleAction
            libelle="Retirer le champ"
            icone={Trash2}
            ton="danger"
            onClick={onRemove}
          />
        </ConsoleActions>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <ConsoleChamp
          id={`champ-${index}-libelle`}
          libelle="Libellé affiché"
          requis
          erreur={erreurs?.libelle?.message}
        >
          <Input
            id={`champ-${index}-libelle`}
            {...form.register(`champs.${index}.libelle`)}
          />
        </ConsoleChamp>

        <ConsoleChamp id={`champ-${index}-type`} libelle="Nature">
          <select
            id={`champ-${index}-type`}
            className={selectClass}
            {...form.register(`champs.${index}.type`)}
          >
            {TYPE_CHAMP_VALUES.map((valeur) => (
              <option key={valeur} value={valeur}>
                {TYPE_CHAMP_LABELS[valeur]}
              </option>
            ))}
          </select>
        </ConsoleChamp>

        <ConsoleInterrupteur
          libelle="Obligatoire"
          description="La publication sera refusée tant qu'il n'est pas renseigné."
          coche={obligatoire}
          onChange={(checked) => form.setValue(`champs.${index}.obligatoire`, checked)}
        />

        {type === "LISTE" ? (
          <ConsoleChamp
            id={`champ-${index}-options`}
            libelle="Options proposées"
            large
            erreur={erreurs?.options?.message}
            aide="Validez chaque option avec Entrée."
          >
            <TagInput
              id={`champ-${index}-options`}
              value={options ?? []}
              onChange={(next) => form.setValue(`champs.${index}.options`, next)}
              placeholder="Licence, Master, Doctorat…"
            />
          </ConsoleChamp>
        ) : null}

        <ConsoleChamp
          id={`champ-${index}-placeholder`}
          libelle="Exemple affiché en filigrane"
        >
          <Input
            id={`champ-${index}-placeholder`}
            {...form.register(`champs.${index}.placeholder`)}
          />
        </ConsoleChamp>

        <ConsoleChamp id={`champ-${index}-aide`} libelle="Texte d'aide">
          <Input id={`champ-${index}-aide`} {...form.register(`champs.${index}.aide`)} />
        </ConsoleChamp>
      </div>
    </li>
  );
}

export function TypeOffreForm({ type }: { type?: TypeOffreDef }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(type);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: type?.code,
      libelle: type?.libelle ?? "",
      description: type?.description ?? "",
      icone: type?.icone ?? "Briefcase",
      couleur: type?.couleur ?? "blue",
      ordre: String(type?.ordre ?? 0),
      estActif: type?.estActif ?? true,
      champs: (type?.champs ?? []).map((champ) => ({
        id: champ.id,
        code: champ.code,
        libelle: champ.libelle,
        type: champ.type,
        obligatoire: champ.obligatoire,
        options: champ.options ?? [],
        placeholder: champ.placeholder ?? "",
        aide: champ.aide ?? "",
      })),
    },
  });

  const champs = useFieldArray({
    control: form.control as Control<FormInput>,
    name: "champs",
  });

  const iconeChoisie = form.watch("icone");
  const couleurChoisie = form.watch("couleur");
  const estActif = form.watch("estActif");
  const libelleSaisi = form.watch("libelle");
  const descriptionSaisie = form.watch("description");
  const champsSaisis = form.watch("champs");

  const save = useMutation({
    mutationFn: (values: FormInput) => {
      // Aucun code n'est transmis : le serveur les dérive des libellés et
      // résout les collisions, seul endroit d'où l'on voit ce qui existe déjà.
      // Les champs conservent le leur par leur identifiant.
      const payload = {
        libelle: values.libelle,
        description: values.description || undefined,
        icone: values.icone,
        couleur: values.couleur,
        ordre: Number(values.ordre) || 0,
        estActif: values.estActif,
        champs: values.champs.map((champ, index) => ({
          id: champ.id,
          libelle: champ.libelle,
          type: champ.type,
          obligatoire: champ.obligatoire,
          options: champ.type === "LISTE" ? champ.options : [],
          placeholder: champ.placeholder || undefined,
          aide: champ.aide || undefined,
          ordre: index,
        })),
      };

      return type
        ? adminTypesOffresApi.update(type.id, payload)
        : adminTypesOffresApi.create(payload);
    },
    onSuccess: async (resultat) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "types-offres"] });
      await queryClient.invalidateQueries({ queryKey: ["types-offres"] });
      toast.success(isEdit ? "Type modifié" : "Type créé");
      router.push(isEdit ? "/admin/types-offres" : `/admin/types-offres/${resultat.id}`);
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", { description: errorMessage(error) }),
  });

  const nombreOffres = type?._count?.offres ?? 0;
  const ajouterChamp = () =>
    champs.append({
      code: "",
      libelle: "",
      type: "TEXTE",
      obligatoire: false,
      options: [],
      placeholder: "",
      aide: "",
    });

  // Aperçu en direct : ce que verront les rédacteurs et les membres.
  const apercu = styleType({
    code: type?.code ?? "",
    libelle: libelleSaisi?.trim() || "Nom du type",
    icone: iconeChoisie,
    couleur: couleurChoisie,
  });
  const IconeApercu = apercu.icone;
  const nbObligatoires = (champsSaisis ?? []).filter((c) => c.obligatoire).length;

  const boutons = (
    <>
      <Button
        type="button"
        variant="ghost"
        className="rounded-lg"
        onClick={() => router.push("/admin/types-offres")}
      >
        Annuler
      </Button>
      <Button type="submit" className="rounded-lg" disabled={save.isPending}>
        {save.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {isEdit ? "Enregistrer" : "Créer le type"}
      </Button>
    </>
  );

  return (
    <form
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      className="grid gap-6 pb-4 xl:grid-cols-[minmax(0,1fr)_20rem]"
      noValidate
    >
      <div className="min-w-0 space-y-6">
        <ConsolePanneau
          titre="Identité du type"
          description="Nom, description, icône et couleur reprises partout dans l'application."
          icone={Layers}
          teinte={TEINTE}
          actions={<CodeTechnique code={type?.code} />}
        >
          <ConsoleSection>
            <ConsoleChamp
              id="libelle"
              libelle="Nom affiché"
              requis
              large
              erreur={form.formState.errors.libelle?.message}
              aide={
                isEdit
                  ? undefined
                  : "Le code technique en sera dérivé, une fois pour toutes."
              }
            >
              <Input id="libelle" placeholder="Concours" {...form.register("libelle")} />
            </ConsoleChamp>

            <ConsoleChamp
              id="description"
              libelle="Description"
              large
              erreur={form.formState.errors.description?.message}
              aide="Présentée aux membres pour les aider à choisir le bon type."
            >
              <Textarea
                id="description"
                rows={2}
                placeholder="Présentée aux membres pour les aider à choisir le bon type."
                {...form.register("description")}
              />
            </ConsoleChamp>
          </ConsoleSection>

          <ConsoleSection titre="Apparence" icone={Palette}>
            <ConsoleChamp id="icone" libelle="Icône" large>
              <div
                id="icone"
                role="radiogroup"
                aria-label="Icône du type"
                className="flex flex-wrap gap-1.5"
              >
                {ICONE_NOMS.map((nom) => {
                  const Icon = ICONES_TYPE[nom];
                  const actif = iconeChoisie === nom;
                  return (
                    <button
                      key={nom}
                      type="button"
                      role="radio"
                      aria-checked={actif}
                      aria-label={nom}
                      title={nom}
                      onClick={() => form.setValue("icone", nom)}
                      className={cn(
                        "grid size-10 place-items-center rounded-xl border transition-all",
                        actif
                          ? "border-transparent text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      style={actif ? { background: apercu.teinte } : undefined}
                    >
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
            </ConsoleChamp>

            <ConsoleChamp id="couleur" libelle="Couleur" large>
              <div
                id="couleur"
                role="radiogroup"
                aria-label="Couleur du type"
                className="flex flex-wrap gap-1.5"
              >
                {COULEUR_NOMS.map((nom) => {
                  const couleur = COULEURS_TYPE[nom];
                  const actif = couleurChoisie === nom;
                  return (
                    <button
                      key={nom}
                      type="button"
                      role="radio"
                      aria-checked={actif}
                      onClick={() => form.setValue("couleur", nom)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                        actif
                          ? "border-foreground/25 bg-muted shadow-sm"
                          : "text-muted-foreground hover:bg-muted/60",
                      )}
                    >
                      <span
                        aria-hidden
                        className="grid size-4 place-items-center rounded-full"
                        style={{ background: couleur.teinte }}
                      >
                        {actif ? <Check className="size-2.5 text-white" /> : null}
                      </span>
                      {couleur.libelle}
                    </button>
                  );
                })}
              </div>
            </ConsoleChamp>
          </ConsoleSection>

          <ConsoleSection titre="Publication" icone={Eye}>
            <ConsoleChamp
              id="ordre"
              libelle="Ordre d'affichage"
              aide="Les valeurs les plus basses apparaissent en premier."
            >
              <Input id="ordre" type="number" inputMode="numeric" {...form.register("ordre")} />
            </ConsoleChamp>

            <ConsoleInterrupteur
              large={false}
              libelle="Proposé à la publication"
              description={
                estActif
                  ? "Le type apparaît dans les formulaires."
                  : "Les offres existantes restent visibles."
              }
              coche={estActif}
              onChange={(checked) => form.setValue("estActif", checked)}
            />
          </ConsoleSection>
        </ConsolePanneau>

        <ConsolePanneau
          titre="Informations à renseigner"
          description="Ces champs s'ajoutent au titre, à la description et aux informations communes à toutes les offres."
          icone={ListChecks}
          teinte={TEINTE}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={ajouterChamp}
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Ajouter un champ</span>
            </Button>
          }
        >
          {nombreOffres > 0 ? (
            <p className="mb-4 flex gap-2.5 rounded-xl border border-[color-mix(in_oklch,var(--warning)_35%,transparent)] bg-[color-mix(in_oklch,var(--warning)_9%,transparent)] px-3.5 py-2.5 text-xs leading-relaxed">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" aria-hidden />
              <span>
                {nombreOffres} offre{nombreOffres > 1 ? "s" : ""} utilise
                {nombreOffres > 1 ? "nt" : ""} ce type. Retirer un champ le fait
                disparaître des formulaires et des pages d&apos;offre ; les valeurs
                déjà saisies restent en base et réapparaîtront si le champ est
                rétabli avec le même code.
              </span>
            </p>
          ) : null}

          {champs.fields.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-10 text-center">
              <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                <ListChecks className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold">Aucun champ spécifique</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ce type ne demandera que les informations communes.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 rounded-lg"
                onClick={ajouterChamp}
              >
                <Plus className="size-4" />
                Ajouter un champ
              </Button>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {champs.fields.map((field, index) => (
                  <ChampRow
                    key={field.id}
                    form={form}
                    index={index}
                    total={champs.fields.length}
                    onMove={champs.move}
                    onRemove={() => champs.remove(index)}
                  />
                ))}
              </ul>
              <button
                type="button"
                onClick={ajouterChamp}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.03] hover:text-primary"
              >
                <Plus className="size-4" />
                Ajouter un champ
              </button>
            </>
          )}
          {form.formState.errors.champs?.message ? (
            <p className="mt-2 text-xs font-medium text-destructive">
              {form.formState.errors.champs.message}
            </p>
          ) : null}
        </ConsolePanneau>
      </div>

      {/* Colonne d'aperçu : collée en haut sur grand écran. */}
      <aside className="space-y-4 xl:sticky xl:top-[calc(var(--console-entete)+1.5rem)] xl:self-start">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <p className="border-b px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Aperçu
          </p>
          <div
            className="relative h-16"
            style={{
              background: `linear-gradient(135deg, color-mix(in oklch, ${apercu.teinte} 18%, transparent), color-mix(in oklch, ${apercu.teinte} 5%, transparent))`,
            }}
          >
            <span
              className="absolute -bottom-5 left-4 grid size-11 place-items-center rounded-xl border-4 border-card text-white"
              style={{ background: apercu.teinte }}
            >
              <IconeApercu className="size-5" aria-hidden />
            </span>
            {!estActif ? (
              <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Désactivé
              </span>
            ) : null}
          </div>
          <div className="p-4 pt-7">
            <p className="truncate font-bold">{apercu.libelle}</p>
            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {descriptionSaisie?.trim() || "Aucune description."}
            </p>
            <span
              className={cn(
                "mt-3 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                apercu.badge,
              )}
            >
              <IconeApercu className="size-3" aria-hidden />
              {apercu.libelle}
            </span>
          </div>
          <dl className="grid grid-cols-3 divide-x border-t text-center">
            <div className="py-3">
              <dd className="text-lg font-extrabold tabular-nums">{champsSaisis?.length ?? 0}</dd>
              <dt className="text-[10px] text-muted-foreground">champs</dt>
            </div>
            <div className="py-3">
              <dd className="text-lg font-extrabold tabular-nums">{nbObligatoires}</dd>
              <dt className="text-[10px] text-muted-foreground">obligatoires</dt>
            </div>
            <div className="py-3">
              <dd className="text-lg font-extrabold tabular-nums">{nombreOffres}</dd>
              <dt className="text-[10px] text-muted-foreground">offres</dt>
            </div>
          </dl>
        </div>

        <div className="hidden flex-col gap-2 rounded-2xl border bg-card p-3 shadow-sm xl:flex [&>button]:w-full">
          {boutons}
        </div>
      </aside>

      {/* Barre d'actions collante, hors grand écran où l'aperçu la porte. */}
      <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-2xl border bg-background/90 p-3 shadow-lg backdrop-blur xl:hidden">
        {boutons}
      </div>
    </form>
  );
}
