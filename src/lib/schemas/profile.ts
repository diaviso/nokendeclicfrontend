import { z } from "zod";
import {
  STATUT_PROFESSIONNEL_LABELS,
  SEXE_LABELS,
} from "@/lib/enums";
import type { Sexe, StatutProfessionnel } from "@/lib/types";

const STATUTS = Object.keys(STATUT_PROFESSIONNEL_LABELS) as [
  StatutProfessionnel,
  ...StatutProfessionnel[],
];
const SEXES = Object.keys(SEXE_LABELS) as [Sexe, ...Sexe[]];

/**
 * Les champs facultatifs acceptent la chaîne vide : un formulaire renvoie ""
 * pour un champ non rempli, et le backend attend une valeur absente plutôt
 * qu'une chaîne vide sur les dates.
 */
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const profileSchema = z.object({
  firstName: optionalText(80),
  lastName: optionalText(80),
  telephone: z
    .string()
    .trim()
    .regex(
      /^$|^\+?[0-9\s.-]{7,20}$/,
      "Numéro invalide (chiffres, espaces, + et - uniquement)",
    )
    .optional()
    .or(z.literal("")),
  dateNaissance: z
    .string()
    .refine((value) => {
      if (!value) return true;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      const age = (Date.now() - date.getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 13 && age <= 120;
    }, "Date de naissance invalide")
    .optional()
    .or(z.literal("")),
  sexe: z.enum(SEXES).optional(),
  adresse: optionalText(200),
  pays: optionalText(80),
  region: optionalText(80),
  departement: optionalText(80),
  commune: optionalText(80),
  statutProfessionnel: z.enum(STATUTS).optional(),
  handicap: z.boolean().optional(),
  typeHandicap: optionalText(120),
});

export type ProfileInput = z.infer<typeof profileSchema>;
