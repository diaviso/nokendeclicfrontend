"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type Control, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/shared/tag-input";
import { adminTypesOffresApi, errorMessage } from "@/lib/api";
import {
  COULEURS_TYPE,
  COULEUR_NOMS,
  ICONES_TYPE,
  ICONE_NOMS,
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

const TYPE_CHAMP_VALUES = Object.keys(TYPE_CHAMP_LABELS) as TypeChamp[];

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
  hint?: string;
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
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
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
  const dejaEnregistre = Boolean(form.watch(`champs.${index}.id`));

  return (
    <li className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          Champ {index + 1}
        </span>
        {dejaEnregistre ? (
          <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
            Enregistré
          </Badge>
        ) : null}
        <span className="hidden sm:block">
          <CodeTechnique code={code} />
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            aria-label="Monter le champ"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            aria-label="Descendre le champ"
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label="Retirer le champ"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 p-3 sm:grid-cols-2">
        <Field
          label="Libellé affiché"
          htmlFor={`champ-${index}-libelle`}
          error={erreurs?.libelle?.message}
        >
          <Input
            id={`champ-${index}-libelle`}
            {...form.register(`champs.${index}.libelle`)}
          />
        </Field>

        <Field label="Nature" htmlFor={`champ-${index}-type`}>
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
        </Field>

        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Switch
              checked={form.watch(`champs.${index}.obligatoire`)}
              onCheckedChange={(checked) =>
                form.setValue(`champs.${index}.obligatoire`, checked)
              }
            />
            Obligatoire
          </label>
        </div>

        {type === "LISTE" ? (
          <Field
            label="Options proposées"
            htmlFor={`champ-${index}-options`}
            className="sm:col-span-2"
            error={erreurs?.options?.message}
          >
            <TagInput
              id={`champ-${index}-options`}
              value={options ?? []}
              onChange={(next) => form.setValue(`champs.${index}.options`, next)}
              placeholder="Licence, Master, Doctorat…"
            />
          </Field>
        ) : null}

        <Field label="Exemple affiché en filigrane" htmlFor={`champ-${index}-placeholder`}>
          <Input
            id={`champ-${index}-placeholder`}
            {...form.register(`champs.${index}.placeholder`)}
          />
        </Field>

        <Field label="Texte d'aide" htmlFor={`champ-${index}-aide`}>
          <Input id={`champ-${index}-aide`} {...form.register(`champs.${index}.aide`)} />
        </Field>
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

  return (
    <form
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      className="space-y-4 pb-4"
      noValidate
    >
      <section className="rounded-lg border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Identité du type</h2>
          <CodeTechnique code={type?.code} />
        </header>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field
            label="Nom affiché"
            htmlFor="libelle"
            className="sm:col-span-2"
            error={form.formState.errors.libelle?.message}
            hint={
              isEdit
                ? undefined
                : "Le code technique en sera dérivé, une fois pour toutes."
            }
          >
            <Input id="libelle" placeholder="Concours" {...form.register("libelle")} />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            className="sm:col-span-2"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="description"
              rows={2}
              placeholder="Présentée aux membres pour les aider à choisir le bon type."
              {...form.register("description")}
            />
          </Field>

          <Field label="Icône" htmlFor="icone" className="sm:col-span-2">
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
                    onClick={() => form.setValue("icone", nom)}
                    className={cn(
                      "grid size-9 place-items-center rounded-md border transition-colors",
                      actif
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Couleur" htmlFor="couleur" className="sm:col-span-2">
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
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-shadow",
                      couleur.badge,
                      actif ? "ring-2 ring-ring/50" : "",
                    )}
                  >
                    {couleur.libelle}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label="Ordre d'affichage"
            htmlFor="ordre"
            hint="Les valeurs les plus basses apparaissent en premier."
          >
            <Input id="ordre" type="number" inputMode="numeric" {...form.register("ordre")} />
          </Field>

          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Switch
                checked={estActif}
                onCheckedChange={(checked) => form.setValue("estActif", checked)}
              />
              <span>
                Proposé à la publication
                {!estActif ? (
                  <span className="block text-xs text-muted-foreground">
                    Les offres existantes restent visibles.
                  </span>
                ) : null}
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Informations à renseigner</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ces champs s&apos;ajoutent au titre, à la description et aux
              informations communes à toutes les offres.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              champs.append({
                code: "",
                libelle: "",
                type: "TEXTE",
                obligatoire: false,
                options: [],
                placeholder: "",
                aide: "",
              })
            }
          >
            <Plus className="size-4" />
            Ajouter un champ
          </Button>
        </header>

        <div className="p-4">
          {nombreOffres > 0 ? (
            <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              {nombreOffres} offre{nombreOffres > 1 ? "s" : ""} utilise
              {nombreOffres > 1 ? "nt" : ""} ce type. Retirer un champ le fait
              disparaître des formulaires et des pages d&apos;offre ; les valeurs
              déjà saisies restent en base et réapparaîtront si le champ est
              rétabli avec le même code.
            </p>
          ) : null}

          {champs.fields.length === 0 ? (
            <p className="dashed-frame px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun champ spécifique. Ce type ne demandera que les informations
              communes.
            </p>
          ) : (
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
          )}
        </div>
      </section>

      <div className="sticky bottom-16 z-10 flex justify-end gap-2 rounded-lg border bg-background/95 p-3 backdrop-blur lg:bottom-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/types-offres")}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isEdit ? "Enregistrer" : "Créer le type"}
        </Button>
      </div>
    </form>
  );
}
