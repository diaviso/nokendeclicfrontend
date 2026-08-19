"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorMessage, offresApi } from "@/lib/api";
import type { Offre } from "@/lib/types";

/**
 * Couverture et pièce jointe d'une offre.
 *
 * Les deux fichiers passent par des routes portant l'identifiant de l'offre :
 * ils ne peuvent donc être envoyés qu'après sa création. Le formulaire de
 * création affiche à la place un dépôt différé (voir `MediaEnAttente`), et
 * enchaîne les envois une fois l'offre enregistrée.
 */

/** Limites alignées sur ce qu'accepte le backend, pour refuser avant l'envoi. */
export const TAILLE_MAX_IMAGE = 5 * 1024 * 1024;
export const TAILLE_MAX_DOCUMENT = 10 * 1024 * 1024;

export function verifierImage(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "La couverture doit être une image (JPEG, PNG ou WebP).";
  }
  if (file.size > TAILLE_MAX_IMAGE) {
    return "Image trop lourde : 5 Mo au maximum.";
  }
  return null;
}

export function verifierDocument(file: File): string | null {
  if (file.type !== "application/pdf") {
    return "Le document joint doit être un PDF.";
  }
  if (file.size > TAILLE_MAX_DOCUMENT) {
    return "Document trop lourd : 10 Mo au maximum.";
  }
  return null;
}

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
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium">{titre}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function OffreMedias({ offre }: { offre: Offre }) {
  const queryClient = useQueryClient();
  const imageInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);
  const [enCours, setEnCours] = useState<"image" | "document" | null>(null);

  async function rafraichir() {
    await queryClient.invalidateQueries({ queryKey: ["offres", offre.id] });
    await queryClient.invalidateQueries({ queryKey: ["admin", "offres"] });
    await queryClient.invalidateQueries({ queryKey: ["offres"] });
  }

  const envoyer = useMutation({
    mutationFn: ({ cible, file }: { cible: "image" | "document"; file: File }) =>
      cible === "image"
        ? offresApi.uploadImage(offre.id, file)
        : offresApi.uploadDocument(offre.id, file),
    onSuccess: async (_data, { cible }) => {
      await rafraichir();
      toast.success(cible === "image" ? "Couverture mise à jour" : "Document joint");
    },
    onError: (error) =>
      toast.error("Envoi impossible", { description: errorMessage(error) }),
    onSettled: () => setEnCours(null),
  });

  const retirer = useMutation({
    mutationFn: (cible: "image" | "document") =>
      cible === "image"
        ? offresApi.removeImage(offre.id)
        : offresApi.removeDocument(offre.id),
    onSuccess: async (_data, cible) => {
      await rafraichir();
      toast.success(cible === "image" ? "Couverture retirée" : "Document retiré");
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  function choisir(cible: "image" | "document", file?: File) {
    if (!file) return;
    const erreur = cible === "image" ? verifierImage(file) : verifierDocument(file);
    if (erreur) {
      toast.error("Fichier refusé", { description: erreur });
      return;
    }
    setEnCours(cible);
    envoyer.mutate({ cible, file });
  }

  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Photo et pièce jointe</h2>
      </header>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Cadre
          titre="Photo de couverture"
          description="Affichée en tête de l'offre et dans les aperçus partagés. JPEG, PNG ou WebP, 5 Mo maximum."
        >
          {offre.imageUrl ? (
            <div className="space-y-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src={offre.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={enCours === "image"}
                  onClick={() => imageInput.current?.click()}
                >
                  {enCours === "image" ? (
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
                  disabled={retirer.isPending}
                  onClick={() => retirer.mutate("image")}
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
              disabled={enCours === "image"}
              onClick={() => imageInput.current?.click()}
            >
              {enCours === "image" ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ImageIcon className="size-5 text-muted-foreground" />
              )}
              <span className="text-xs font-normal text-muted-foreground">
                Choisir une image
              </span>
            </Button>
          )}

          <input
            ref={imageInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              choisir("image", event.target.files?.[0]);
              // Réinitialisé pour que rechoisir le même fichier redéclenche
              // l'événement change.
              event.target.value = "";
            }}
          />
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
                  disabled={enCours === "document"}
                  onClick={() => documentInput.current?.click()}
                >
                  {enCours === "document" ? (
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
                  disabled={retirer.isPending}
                  onClick={() => retirer.mutate("document")}
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
              disabled={enCours === "document"}
              onClick={() => documentInput.current?.click()}
            >
              {enCours === "document" ? (
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
              choisir("document", event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </Cadre>
      </div>
    </section>
  );
}

/**
 * Dépôt différé, à la création : l'offre n'existe pas encore, les fichiers sont
 * conservés en mémoire et envoyés juste après l'enregistrement.
 */
export function MediasEnAttente({
  document: doc,
  onImage,
  onDocument,
}: {
  /** Document choisi, rendu par son nom : aucune ressource à libérer. */
  document: File | null;
  onImage: (file: File | null) => void;
  onDocument: (file: File | null) => void;
}) {
  const imageInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);

  // L'aperçu est produit au moment où l'image est choisie, pas dans un effet :
  // l'URL d'objet est une ressource, elle suit donc l'action qui la crée et est
  // révoquée dès qu'elle n'est plus affichée.
  const [apercu, setApercu] = useState<string | null>(null);
  const apercuRef = useRef<string | null>(null);

  function definirImage(file: File | null) {
    if (apercuRef.current) URL.revokeObjectURL(apercuRef.current);
    const url = file ? URL.createObjectURL(file) : null;
    apercuRef.current = url;
    setApercu(url);
    onImage(file);
  }

  // Seul cas non couvert par le remplacement : le démontage du composant.
  useEffect(
    () => () => {
      if (apercuRef.current) URL.revokeObjectURL(apercuRef.current);
    },
    [],
  );

  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Photo et pièce jointe</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Envoyées automatiquement dès l&apos;offre créée.
        </p>
      </header>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Cadre
          titre="Photo de couverture"
          description="JPEG, PNG ou WebP, 5 Mo maximum."
        >
          {apercu ? (
            <div className="space-y-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                {/* Aperçu local d'un blob : `next/image` ne sait pas optimiser
                    une URL d'objet, une balise native est ici la bonne. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={apercu} alt="" className="size-full object-cover" />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInput.current?.click()}
                >
                  <Upload className="size-4" />
                  Remplacer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => definirImage(null)}
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
              onClick={() => imageInput.current?.click()}
            >
              <ImageIcon className="size-5 text-muted-foreground" />
              <span className="text-xs font-normal text-muted-foreground">
                Choisir une image
              </span>
            </Button>
          )}

          <input
            ref={imageInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const erreur = verifierImage(file);
              if (erreur) {
                toast.error("Fichier refusé", { description: erreur });
                return;
              }
              definirImage(file);
            }}
          />
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
