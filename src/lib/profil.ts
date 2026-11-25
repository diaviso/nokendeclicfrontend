import type { User } from "./types";

/**
 * Champs qui rendent un profil exploitable pour les recommandations, avec le
 * libellé montré quand il manque. Une seule liste pour le tableau de bord, la
 * page de profil et les rappels : trois calculs différents finiraient par
 * annoncer trois pourcentages différents.
 */
export const CHAMPS_PROFIL: { champ: keyof User; libelle: string }[] = [
  { champ: "firstName", libelle: "Prénom" },
  { champ: "lastName", libelle: "Nom" },
  { champ: "telephone", libelle: "Téléphone" },
  { champ: "dateNaissance", libelle: "Date de naissance" },
  { champ: "sexe", libelle: "Sexe" },
  { champ: "region", libelle: "Région" },
  { champ: "departement", libelle: "Département" },
  { champ: "commune", libelle: "Commune" },
  { champ: "statutProfessionnel", libelle: "Situation professionnelle" },
];

/** En dessous de ce taux, le membre est relancé à chaque action. */
export const SEUIL_PROFIL = 80;

function estRempli(valeur: unknown): boolean {
  return (
    valeur !== null &&
    valeur !== undefined &&
    valeur !== "" &&
    valeur !== "NON_PRECISE"
  );
}

export function champsManquants(
  user: Partial<User> | null | undefined,
): string[] {
  if (!user) return CHAMPS_PROFIL.map((c) => c.libelle);
  return CHAMPS_PROFIL.filter((c) => !estRempli(user[c.champ])).map(
    (c) => c.libelle,
  );
}

export function completionProfil(user: Partial<User> | null | undefined): number {
  if (!user) return 0;
  const remplis = CHAMPS_PROFIL.length - champsManquants(user).length;
  return Math.round((remplis / CHAMPS_PROFIL.length) * 100);
}
