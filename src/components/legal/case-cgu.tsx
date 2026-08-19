"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocale } from "next-intl";
import { pointsClesCgu } from "@/lib/cgu";
import { cn } from "@/lib/utils";

/**
 * Case d'acceptation des conditions générales.
 *
 * Les points clés sont rappelés au-dessus de la case plutôt que renvoyés au
 * seul lien : un consentement donné sans avoir lu ce à quoi il engage n'en est
 * pas un, et personne n'ouvre un texte de treize articles au moment de créer un
 * compte. Le lien reste là pour qui veut le détail, et s'ouvre dans un nouvel
 * onglet afin de ne pas faire perdre la saisie en cours.
 */
export function CaseCgu({
  coche,
  onChange,
  erreur,
  /** Rappel des points clés — masqué là où la place manque. */
  avecResume = true,
  className,
}: {
  coche: boolean;
  onChange: (coche: boolean) => void;
  erreur?: string;
  avecResume?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  return (
    <div className={className}>
      {avecResume ? (
        <ul className="mb-3 space-y-1.5 rounded-xl bg-muted/50 p-3.5">
          {pointsClesCgu(locale).map((point: string) => (
            <li key={point} className="flex gap-2.5">
              <span
                aria-hidden
                className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary"
              />
              <span className="text-xs leading-relaxed text-muted-foreground">
                {point}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3">
        <Checkbox
          checked={coche}
          onCheckedChange={(valeur) => onChange(valeur === true)}
          aria-invalid={Boolean(erreur)}
          aria-describedby={erreur ? "erreur-cgu" : undefined}
          className="mt-0.5"
        />
        <span className="text-sm leading-relaxed">
          J&apos;ai lu et j&apos;accepte les{" "}
          <Link
            href="/cgu"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-4"
            // Le clic sur le lien ne doit pas cocher la case : le label
            // englobe les deux, et sans cela ouvrir le texte vaudrait accord.
            onClick={(evenement) => evenement.stopPropagation()}
          >
            conditions générales d&apos;utilisation
          </Link>
          , y compris le partage de mes données avec les partenaires si je rends
          mon profil visible.
        </span>
      </label>

      {erreur ? (
        <p
          id="erreur-cgu"
          role="alert"
          className={cn("mt-1.5 text-sm text-destructive")}
        >
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
