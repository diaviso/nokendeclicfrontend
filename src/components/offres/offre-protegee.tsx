"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  FileText,
  Loader2,
  LockKeyhole,
  Paperclip,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { offresApi, tokenStore } from "@/lib/api";
import { champsRenseignes, formatValeurChamp } from "@/lib/type-offre";
import { formatSalaryRange } from "@/lib/format";
import type { Offre } from "@/lib/types";

/**
 * Partie réservée aux membres d'une fiche d'offre.
 *
 * Le serveur rend la page sans jamais connaître la session : les jetons vivent
 * dans le navigateur, pas dans un cookie. Il envoie donc toujours l'aperçu, et
 * c'est ici, côté client, que l'offre complète est réclamée quand une session
 * existe.
 *
 * Le contenu n'est pas masqué mais absent : tant que personne n'est connecté,
 * il n'a jamais été téléchargé, et le code source de la page n'en contient
 * rien.
 */

/** Une seule requête pour les deux blocs, grâce à la clé partagée. */
function useOffreComplete(offreId: number) {
  // Lu au rendu et non dans un effet : la présence d'un jeton ne change pas
  // pendant la vie de la page, et un état supplémentaire ferait clignoter la
  // porte de connexion avant l'affichage du contenu.
  const aUneSession =
    typeof window !== "undefined" && Boolean(tokenStore.access);

  const requete = useQuery({
    queryKey: ["offre", offreId, "complet"],
    queryFn: () => offresApi.byId(offreId),
    enabled: aUneSession,
    staleTime: 60 * 1000,
  });

  return { aUneSession, ...requete };
}

function PorteDeConnexion({ offreId }: { offreId: number }) {
  const t = useTranslations("offre");

  return (
    <div className="mt-5 rounded-2xl border border-dashed p-6 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary/10">
        <LockKeyhole className="size-5 text-primary" aria-hidden />
      </span>
      <p className="mt-4 text-base font-bold">{t("connexionTitre")}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
        {t("connexionTexte")}
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Button
          className="w-full rounded-xl sm:w-auto"
          render={<Link href={`/login?mode=register&next=/offres/${offreId}`} />}
        >
          {t("connexionCreer")}
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-xl sm:w-auto"
          render={<Link href={`/login?next=/offres/${offreId}`} />}
        >
          {t("connexionSeConnecter")}
        </Button>
      </div>
    </div>
  );
}

/** Corps de l'annonce, champs longs, document et pièces jointes. */
export function CorpsOffre({ apercu }: { apercu: Offre }) {
  const t = useTranslations("offre");
  const { aUneSession, data: offre, isLoading } = useOffreComplete(apercu.id);

  if (!aUneSession) {
    return (
      <div className="max-w-[68ch]">
        {apercu.extrait ? (
          <p className="text-[16px] leading-[1.75] text-muted-foreground">
            {apercu.extrait}
          </p>
        ) : null}
        <PorteDeConnexion offreId={apercu.id} />
      </div>
    );
  }

  if (isLoading || !offre) {
    return (
      <div className="grid min-h-32 place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Chargement de l&apos;offre…</span>
      </div>
    );
  }

  const champsLongs = champsRenseignes(offre).filter(
    ({ champ }) => champ.type === "TEXTE_LONG",
  );

  return (
    <>
      {offre.contenuHtml ? (
        /* Le balisage a été assaini par le serveur à l'enregistrement, sur une
           liste blanche : ce qui est en base est déjà propre. */
        <div
          className="prose-annonce max-w-[68ch] text-[16px]"
          dangerouslySetInnerHTML={{ __html: offre.contenuHtml }}
        />
      ) : (
        <div className="max-w-[68ch] whitespace-pre-wrap text-[16px] leading-[1.75]">
          {offre.description}
        </div>
      )}

      {champsLongs.map(({ champ, valeur }) => (
        <div key={champ.code}>
          <hr className="my-5 border-border" />
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {champ.libelle}
          </h2>
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {String(valeur)}
          </div>
        </div>
      ))}

      {offre.instructionsCandidature ? (
        <div>
          <hr className="my-5 border-border" />
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Comment postuler
          </h2>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {offre.instructionsCandidature}
          </p>
          {offre.emailCandidature ? (
            <p className="mt-2 text-[15px]">
              <a
                href={`mailto:${offre.emailCandidature}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {offre.emailCandidature}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      {offre.documentUrl ? (
        <div>
          <hr className="my-5 border-border" />
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Paperclip className="size-4" aria-hidden />
            {t("document")}
          </h2>
          <a
            href={offre.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md border px-3 py-3 text-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate">
              {offre.documentName ?? t("documentDefaut")}
            </span>
            <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </a>
        </div>
      ) : null}
    </>
  );
}

/**
 * Informations pratiques réservées et bouton de candidature.
 *
 * Le salaire, les champs propres au type et le lien de candidature ne sont pas
 * envoyés à un visiteur : ce sont eux qui font l'intérêt de créer un compte.
 */
export function ActionsOffre({ apercu }: { apercu: Offre }) {
  const t = useTranslations("offre");
  const { aUneSession, data: offre } = useOffreComplete(apercu.id);

  if (!aUneSession) {
    return (
      <Button
        className="w-full rounded-xl"
        render={<Link href={`/login?next=/offres/${apercu.id}`} />}
      >
        <LockKeyhole className="size-4" />
        {t("connexionSeConnecter")}
      </Button>
    );
  }

  if (!offre) return null;

  const salaire = formatSalaryRange(
    offre.salaireMin,
    offre.salaireMax,
    offre.salaireDevise ?? offre.devise ?? "FCFA",
  );

  const champsCourts = champsRenseignes(offre).filter(
    ({ champ }) => champ.type !== "TEXTE_LONG",
  );

  return (
    <>
      {salaire || champsCourts.length > 0 ? (
        <dl className="mb-4 divide-y border-y">
          {salaire ? (
            <div className="flex items-baseline justify-between gap-3 py-2.5">
              <dt className="text-sm text-muted-foreground">{t("salaire")}</dt>
              <dd className="text-right text-sm font-medium">{salaire}</dd>
            </div>
          ) : null}
          {champsCourts.map(({ champ, valeur }) => (
            <div
              key={champ.code}
              className="flex items-baseline justify-between gap-3 py-2.5"
            >
              <dt className="text-sm text-muted-foreground">{champ.libelle}</dt>
              <dd className="text-right text-sm font-medium">
                {formatValeurChamp(champ, valeur)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {offre.url ? (
        <Button
          size="lg"
          className="shine relative w-full overflow-hidden rounded-xl"
          render={<a href={offre.url} target="_blank" rel="noopener noreferrer" />}
        >
          {t("postuler")}
          <ExternalLink className="size-4" />
        </Button>
      ) : null}
    </>
  );
}
