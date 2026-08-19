import { z } from "zod";

/**
 * Ces schémas reflètent les DTO du backend (auth.dto.ts). Les garder alignés
 * évite qu'un formulaire accepte une saisie que l'API rejettera ensuite avec un
 * message générique.
 */

export const PASSWORD_MIN_LENGTH = 10;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Au moins ${PASSWORD_MIN_LENGTH} caractères`)
  .max(128, "128 caractères maximum")
  .regex(/[a-z]/, "Au moins une minuscule")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/\d/, "Au moins un chiffre");

export const emailSchema = z
  .string()
  .min(1, "L'adresse email est requise")
  .email("Adresse email invalide");

export const loginSchema = z.object({
  email: emailSchema,
  // À la connexion on n'impose pas la politique : les comptes créés avant son
  // durcissement doivent continuer à fonctionner.
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Le prénom est requis").max(80),
    lastName: z.string().trim().min(1, "Le nom est requis").max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    // Un booléen raffiné, et non « literal(true) » : ce dernier ferait du
    // type d'entrée « true », si bien qu'une valeur initiale décochée serait
    // refusée à la compilation. Le raffinement laisse le type booléen et
    // n'échoue qu'à la validation.
    accepteCgu: z.boolean().refine((valeur) => valeur === true, {
      message: "Vous devez accepter les conditions générales d'utilisation",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const verifySchema = z.object({
  code: z
    .string()
    .length(6, "Le code comporte 6 chiffres")
    .regex(/^\d{6}$/, "Le code ne contient que des chiffres"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Critères affichés en direct sous le champ mot de passe. */
export function passwordChecks(value: string) {
  return [
    { label: `${PASSWORD_MIN_LENGTH} caractères minimum`, ok: value.length >= PASSWORD_MIN_LENGTH },
    { label: "Une minuscule", ok: /[a-z]/.test(value) },
    { label: "Une majuscule", ok: /[A-Z]/.test(value) },
    { label: "Un chiffre", ok: /\d/.test(value) },
  ];
}
