import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatutModeration } from "@/lib/types";

/**
 * État de relecture d'une offre, tel que son auteur doit le lire.
 *
 * Le libellé dit ce qui se passe, pas seulement où l'on en est : « En attente
 * de validation » plutôt que « En attente », parce qu'un partenaire qui vient
 * de déposer son annonce cherche d'abord à savoir pourquoi elle n'est pas
 * visible.
 *
 * Une offre sans statut est traitée comme publiée : les réponses de l'API
 * antérieures à la modération n'en portent pas.
 */
const ETATS: Record<
  StatutModeration,
  { libelle: string; icone: typeof Clock; teinte: string; explication: string }
> = {
  EN_ATTENTE: {
    libelle: "En attente de validation",
    icone: Clock,
    teinte: "var(--warning)",
    explication:
      "L'équipe Noken relit votre annonce avant sa mise en ligne. Elle n'est pas encore visible des membres.",
  },
  PUBLIEE: {
    libelle: "En ligne",
    icone: CheckCircle2,
    teinte: "var(--success)",
    explication: "Votre annonce est visible dans le catalogue.",
  },
  REFUSEE: {
    libelle: "Refusée",
    icone: XCircle,
    teinte: "var(--destructive)",
    explication:
      "Corrigez les points signalés puis enregistrez : l'annonce repartira automatiquement en relecture.",
  },
};

export function etatModeration(statut?: StatutModeration) {
  return ETATS[statut ?? "PUBLIEE"];
}

export function PastilleModeration({
  statut,
  className,
}: {
  statut?: StatutModeration;
  className?: string;
}) {
  const etat = etatModeration(statut);
  const Icone = etat.icone;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
      style={{
        background: `color-mix(in oklch, ${etat.teinte} 13%, transparent)`,
        color: etat.teinte,
      }}
    >
      <Icone className="size-3.5" aria-hidden />
      {etat.libelle}
    </span>
  );
}

/**
 * Bandeau explicatif, affiché au-dessus du formulaire de modification.
 * Muet pour une offre en ligne : il n'y a rien à expliquer.
 */
export function BandeauModeration({
  statut,
  motifRefus,
}: {
  statut?: StatutModeration;
  motifRefus?: string | null;
}) {
  if (!statut || statut === "PUBLIEE") return null;

  const etat = etatModeration(statut);
  const Icone = etat.icone;

  return (
    <div
      className="mb-4 flex gap-3 rounded-2xl border p-4"
      style={{
        borderColor: `color-mix(in oklch, ${etat.teinte} 30%, transparent)`,
        background: `color-mix(in oklch, ${etat.teinte} 7%, transparent)`,
      }}
    >
      <Icone
        className="mt-0.5 size-5 shrink-0"
        style={{ color: etat.teinte }}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-sm font-bold" style={{ color: etat.teinte }}>
          {etat.libelle}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {etat.explication}
        </p>
        {motifRefus ? (
          <p className="mt-2 rounded-xl bg-card px-3 py-2 text-sm">
            <span className="font-semibold">Motif : </span>
            {motifRefus}
          </p>
        ) : null}
      </div>
    </div>
  );
}
