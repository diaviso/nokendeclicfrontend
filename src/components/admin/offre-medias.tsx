"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChoixCouverture } from "@/components/medias/mediatheque";
import { errorMessage, mediasApi, offresApi } from "@/lib/api";
import type { Media, Offre } from "@/lib/types";

/**
 * Couverture et pièce jointe d'une offre.
 *
 * La couverture se choisit dans la médiathèque : une image déjà utilisée par
 * une autre offre, ou une nouvelle, importée sur place. Elle existe donc avant
 * l'offre, et le formulaire de création l'envoie avec le reste.
 *
 * Le document joint, lui, passe toujours par une route portant l'identifiant
 * de l'offre : à la création, il est gardé en attente (`MediasEnAttente`) et
 * envoyé juste après l'enregistrement.
 */

/** Limite alignée sur ce qu'accepte le backend, pour refuser avant l'envoi. */
export const TAILLE_MAX_DOCUMENT = 10 * 1024 * 1024;

export function verifierDocument(file: File): string | null {
  if (file.type !== "application/pdf") {
    return "Le document joint doit être un PDF.";
  }
  if (file.size > TAILLE_MAX_DOCUMENT) {
    return "Document trop lourd : 10 Mo au maximum.";
  }
  return null;
}

const DESCRIPTION_COUVERTURE =
  "Affichée en tête de l'offre et dans les aperçus partagés. Reprenez une image de la médiathèque ou importez-en une : elle est allégée automatiquement.";

function Cadre({
  titre,
  description,
  children,
}: {
  titre: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border p-4">
      <p className="text-sm font-medium">{titre}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function OffreMedias({
  offre,
  champAlt,
  onCouvertureChoisie,
}: {
  offre: Offre;
  /** Champ « texte alternatif » du formulaire, rangé sous la couverture. */
  champAlt?: React.ReactNode;
  onCouvertureChoisie?: (media: Media) => void;
}) {
  const queryClient = useQueryClient();
  const documentInput = useRef<HTMLInputElement>(null);
  const [documentEnCours, setDocumentEnCours] = useState(false);

  async function rafraichir() {
    await queryClient.invalidateQueries({ queryKey: ["offres", offre.id] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "offres"] });
    await queryClient.invalidateQueries({ queryKey: ["offres"] });
    await queryClient.invalidateQueries({ queryKey: ["medias"] });
  }

  // Appliquée tout de suite, comme le document : sur une offre existante,
  // changer de couverture n'attend pas le bouton « Enregistrer ».
  const couverture = useMutation({
    mutationFn: (media: Media | null) =>
      media
        ? mediasApi.choisirPourOffre(offre.id, media.id)
        : offresApi.removeImage(offre.id),
    onSuccess: async (_data, media) => {
      await rafraichir();
      if (media) onCouvertureChoisie?.(media);
      toast.success(media ? "Couverture mise à jour" : "Couverture retirée", {
        description: media
          ? undefined
          : "L'image reste disponible dans la médiathèque.",
      });
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  const envoyerDocument = useMutation({
    mutationFn: (file: File) => offresApi.uploadDocument(offre.id, file),
    onSuccess: async () => {
      await rafraichir();
      toast.success("Document joint");
    },
    onError: (error) =>
      toast.error("Envoi impossible", { description: errorMessage(error) }),
    onSettled: () => setDocumentEnCours(false),
  });

  const retirerDocument = useMutation({
    mutationFn: () => offresApi.removeDocument(offre.id),
    onSuccess: async () => {
      await rafraichir();
      toast.success("Document retiré");
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  function choisirDocument(file?: File) {
    if (!file) return;
    const erreur = verifierDocument(file);
    if (erreur) {
      toast.error("Fichier refusé", { description: erreur });
      return;
    }
    setDocumentEnCours(true);
    envoyerDocument.mutate(file);
  }

  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Photo et pièce jointe</h2>
      </header>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Cadre titre="Photo de couverture" description={DESCRIPTION_COUVERTURE}>
          <ChoixCouverture
            valeur={
              offre.imageUrl
                ? { id: offre.imageId, url: offre.imageUrl, alt: offre.imageAlt }
                : null
            }
            enCours={couverture.isPending}
            onChange={(media) => couverture.mutate(media)}
          />
          {champAlt ? <div className="mt-3">{champAlt}</div> : null}
        </Cadre>

        <Cadre
          titre="Document joint"
          description="Appel à candidatures, termes de référence… PDF uniquement, 10 Mo maximum."
        >
          {offre.documentUrl ? (
            <div className="space-y-2">
              <a
                href={offre.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm hover:border-primary/40 hover:text-primary"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  {offre.documentName ?? "Document"}
                </span>
              </a>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={documentEnCours}
                  onClick={() => documentInput.current?.click()}
                >
                  {documentEnCours ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Remplacer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={retirerDocument.isPending}
                  onClick={() => retirerDocument.mutate()}
                >
                  <Trash2 className="size-4" />
                  Retirer
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-24 w-full flex-col gap-1.5 border-dashed"
              disabled={documentEnCours}
              onClick={() => documentInput.current?.click()}
            >
              {documentEnCours ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <FileText className="size-5 text-muted-foreground" />
              )}
              <span className="text-xs font-normal text-muted-foreground">
                Choisir un PDF
              </span>
            </Button>
          )}

          <input
            ref={documentInput}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) => {
              choisirDocument(event.target.files?.[0]);
              // Réinitialisé pour que rechoisir le même fichier redéclenche
              // l'événement change.
              event.target.value = "";
            }}
          />
        </Cadre>
      </div>
    </section>
  );
}

/**
 * À la création : la couverture est déjà choisie dans la médiathèque et part
 * avec l'offre ; seul le document attend l'enregistrement pour être envoyé.
 */
export function MediasEnAttente({
  couverture,
  onCouverture,
  document: doc,
  onDocument,
  champAlt,
}: {
  couverture: Media | null;
  onCouverture: (media: Media | null) => void;
  /** Document choisi, rendu par son nom : aucune ressource à libérer. */
  document: File | null;
  onDocument: (file: File | null) => void;
  champAlt?: React.ReactNode;
}) {
  const documentInput = useRef<HTMLInputElement>(null);

  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Photo et pièce jointe</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Le document est envoyé dès l&apos;offre créée.
        </p>
      </header>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Cadre titre="Photo de couverture" description={DESCRIPTION_COUVERTURE}>
          <ChoixCouverture valeur={couverture} onChange={onCouverture} />
          {champAlt ? <div className="mt-3">{champAlt}</div> : null}
        </Cadre>

        <Cadre titre="Document joint" description="PDF uniquement, 10 Mo maximum.">
          {doc ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{doc.name}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => documentInput.current?.click()}
                >
                  <Upload className="size-4" />
                  Remplacer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onDocument(null)}
                >
                  <Trash2 className="size-4" />
                  Retirer
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-24 w-full flex-col gap-1.5 border-dashed"
              onClick={() => documentInput.current?.click()}
            >
              <FileText className="size-5 text-muted-foreground" />
              <span className="text-xs font-normal text-muted-foreground">
                Choisir un PDF
              </span>
            </Button>
          )}

          <input
            ref={documentInput}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const erreur = verifierDocument(file);
              if (erreur) {
                toast.error("Fichier refusé", { description: erreur });
                return;
              }
              onDocument(file);
            }}
          />
        </Cadre>
      </div>
    </section>
  );
}
