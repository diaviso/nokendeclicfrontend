"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { ChampTypeOffre, TypeOffreDef } from "@/lib/types";

/**
 * Rendu des champs propres à un type d'offre.
 *
 * Les définitions viennent de l'API : ni les codes, ni les natures ne sont
 * connus à la compilation. Chaque valeur est enregistrée sous
 * `champs.<code>` dans le formulaire, ce qui reproduit la forme attendue par
 * l'API (`Offre.champs`) sans conversion intermédiaire.
 */

/** Forme minimale du formulaire attendue par ce composant. */
export interface FormAvecChamps {
  champs: Record<string, string | boolean>;
}

const selectClass =
  "h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function ChampDynamique({
  champ,
  form,
}: {
  champ: ChampTypeOffre;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- le nom du champ est dynamique
  form: UseFormReturn<any>;
}) {
  const name = `champs.${champ.code}` as const;
  const id = `champ-${champ.code}`;
  const erreur = (
    form.formState.errors.champs as
      | Record<string, { message?: string } | undefined>
      | undefined
  )?.[champ.code]?.message;

  const label = (
    <Label htmlFor={id}>
      {champ.libelle}
      {champ.obligatoire ? (
        <span className="ml-0.5 text-destructive" aria-hidden>
          *
        </span>
      ) : null}
    </Label>
  );

  let controle: React.ReactNode;

  switch (champ.type) {
    case "TEXTE_LONG":
      controle = (
        <Textarea
          id={id}
          rows={4}
          placeholder={champ.placeholder ?? undefined}
          {...form.register(name)}
        />
      );
      break;

    case "NOMBRE":
      controle = (
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          placeholder={champ.placeholder ?? undefined}
          {...form.register(name)}
        />
      );
      break;

    case "DATE":
      controle = <Input id={id} type="date" {...form.register(name)} />;
      break;

    case "BOOLEEN":
      controle = (
        <div className="flex h-9 items-center">
          <Switch
            id={id}
            checked={Boolean(form.watch(name))}
            onCheckedChange={(checked) => form.setValue(name, checked)}
          />
        </div>
      );
      break;

    case "LISTE":
      controle = (
        <select id={id} className={selectClass} {...form.register(name)}>
          <option value="">Non précisé</option>
          {champ.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
      break;

    case "URL":
      controle = (
        <Input
          id={id}
          type="url"
          placeholder={champ.placeholder ?? "https://…"}
          {...form.register(name)}
        />
      );
      break;

    default:
      controle = (
        <Input
          id={id}
          placeholder={champ.placeholder ?? undefined}
          {...form.register(name)}
        />
      );
  }

  return (
    <div className={champ.type === "TEXTE_LONG" ? "sm:col-span-2" : undefined}>
      {label}
      <div className="mt-1.5">{controle}</div>
      {erreur ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {erreur}
        </p>
      ) : champ.aide ? (
        <p className="mt-1 text-xs text-muted-foreground">{champ.aide}</p>
      ) : null}
    </div>
  );
}

export function ChampsDynamiques({
  type,
  form,
}: {
  type?: TypeOffreDef | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- le nom du champ est dynamique
  form: UseFormReturn<any>;
}) {
  if (!type?.champs.length) return null;

  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Détails — {type.libelle}</h2>
        {type.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{type.description}</p>
        ) : null}
      </header>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {type.champs.map((champ) => (
          <ChampDynamique key={champ.code} champ={champ} form={form} />
        ))}
      </div>
    </section>
  );
}
