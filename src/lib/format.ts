import { formatDistanceToNow, format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? date : null;
}

/** « il y a 3 jours ». Renvoie une chaîne vide si la date est absente ou invalide. */
export function formatRelative(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

/** « 12 mars 2026 » */
export function formatDate(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return "—";
  return format(date, "d MMMM yyyy", { locale: fr });
}

/** « 12/03/2026 » — pour les tableaux denses. */
export function formatDateShort(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return "—";
  return format(date, "dd/MM/yyyy", { locale: fr });
}

export function formatDateTime(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return "—";
  return format(date, "d MMM yyyy 'à' HH:mm", { locale: fr });
}

/** Heure seule, pour les bulles de messagerie. */
export function formatTime(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return "";
  return format(date, "HH:mm", { locale: fr });
}

const numberFormatter = new Intl.NumberFormat("fr-FR");

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  return numberFormatter.format(value);
}

/** Montants en FCFA — devise sans décimales, séparateur d'espace fine. */
export function formatMoney(
  value?: number | null,
  devise = "FCFA",
): string {
  if (value === null || value === undefined) return "—";
  return `${numberFormatter.format(value)} ${devise}`;
}

export function formatSalaryRange(
  min?: number | null,
  max?: number | null,
  devise = "FCFA",
): string | null {
  if (min && max) return `${formatNumber(min)} – ${formatMoney(max, devise)}`;
  if (min) return `À partir de ${formatMoney(min, devise)}`;
  if (max) return `Jusqu'à ${formatMoney(max, devise)}`;
  return null;
}

/** Nombre de jours restants avant une échéance ; négatif si dépassée. */
export function daysUntil(value?: string | Date | null): number | null {
  const date = toDate(value);
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "—";
  const units = ["o", "Ko", "Mo", "Go"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function fullName(user?: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
}): string {
  if (!user) return "—";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.username || "—";
}
