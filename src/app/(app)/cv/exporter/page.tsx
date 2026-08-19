"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { DocumentCV } from "@/components/cv/modeles-cv";
import { MODELES, type ModeleCV } from "@/lib/modeles-cv";
import { cvApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function ExporterCvPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const parametres = useSearchParams();

  // Le modèle vit dans l'URL plutôt que dans un état interne : le lien
  // redevient partageable, le bouton « précédent » rejoue le choix précédent,
  // et rien n'a besoin d'être restauré au montage — donc aucun écart entre le
  // rendu du serveur et celui du navigateur.
  const demande = parametres.get("modele");
  const modele: ModeleCV = MODELES.some((entree) => entree.cle === demande)
    ? (demande as ModeleCV)
    : "sobre";
  const [echelle, setEchelle] = useState(1);
  const [hauteur, setHauteur] = useState(0);
  const cadre = useRef<HTMLDivElement>(null);
  const feuille = useRef<HTMLDivElement>(null);

  const { data: cv, isLoading } = useQuery({
    queryKey: ["cv", "me"],
    queryFn: cvApi.mine,
  });

  /**
   * Réduction de l'aperçu.
   *
   * La feuille fait 210 mm de large quoi qu'il arrive — c'est ce qui garantit
   * que l'aperçu et l'impression sont le même objet. Sur un écran étroit, elle
   * est donc réduite proportionnellement plutôt que reflowée : une mise en page
   * qui change à l'écran ne dirait plus rien de la feuille imprimée.
   */
  useEffect(() => {
    const conteneur = cadre.current;
    const document_ = feuille.current;
    if (!conteneur || !document_) return;

    const mesurer = () => {
      const largeurFeuille = (210 * 96) / 25.4; // 210 mm en pixels CSS
      setEchelle(Math.min(1, conteneur.clientWidth / largeurFeuille));
      // La hauteur est relevée sur le document lui-même : un parcours fourni
      // déborde sur une deuxième page, et supposer 297 mm laisserait le reste
      // sous les éléments suivants.
      setHauteur(document_.offsetHeight);
    };

    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(conteneur);
    observateur.observe(document_);
    return () => observateur.disconnect();
  }, [cv, modele]);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Chargement de votre CV…</span>
      </div>
    );
  }

  if (!cv) {
    return (
      <EmptyState
        icon={FileText}
        couleur="var(--chart-2)"
        title="Aucun CV à exporter"
        description="Renseignez d'abord votre parcours : c'est lui qui alimente le document."
        action={
          <Button className="rounded-xl" render={<Link href="/cv" />}>
            Remplir mon CV
          </Button>
        }
      />
    );
  }

  return (
    <>
      {/* Mise en page d'impression.
          Marge nulle : les marges sont dans le document lui-même, et chaque
          modèle a les siennes — le bandeau du modèle « Moderne » doit toucher
          le bord de la feuille. Tout ce qui n'est pas la feuille est masqué,
          y compris la barre latérale et la barre du haut de l'application. */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* L'aperçu est réduit pour tenir dans la colonne ; à l'impression
             la feuille reprend sa taille réelle, et la hauteur réservée sous
             elle disparaît. */
          .apercu-echelle {
            transform: none !important;
            box-shadow: none !important;
          }
          .reserve-apercu { height: auto !important; }
        }
      `}</style>

      <div className="print:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 -ml-2 rounded-lg"
          render={<Link href="/cv" />}
        >
          <ArrowLeft className="size-4" />
          Mon CV
        </Button>

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--chart-2)]">
              Mes outils
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Télécharger mon CV
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              Choisissez une mise en page, puis enregistrez le document en PDF.
            </p>
          </div>

          <Button
            size="lg"
            className="shrink-0 rounded-xl"
            onClick={() => window.print()}
          >
            <Download className="size-4.5" />
            Enregistrer en PDF
          </Button>
        </div>

        <div
          role="radiogroup"
          aria-label="Modèle de CV"
          className="mb-5 grid gap-3 md:grid-cols-3"
        >
          {MODELES.map((entree) => {
            const actif = modele === entree.cle;
            return (
              <button
                key={entree.cle}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() =>
                  router.replace(`${pathname}?modele=${entree.cle}`, {
                    scroll: false,
                  })
                }
                className={cn(
                  "rounded-2xl border bg-card p-4 text-left transition-all duration-200",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  actif
                    ? "border-primary/50 shadow-md ring-1 ring-primary/20"
                    : "hover:border-primary/30 hover:shadow-sm",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{entree.nom}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "size-4 rounded-full border-2 transition-colors",
                      actif
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40",
                    )}
                  />
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {entree.description}
                </p>
              </button>
            );
          })}
        </div>

        <p className="mb-3 rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          « Enregistrer en PDF » ouvre la fenêtre d&apos;impression de votre
          navigateur : choisissez-y <strong>Enregistrer au format PDF</strong>{" "}
          comme destination. Le texte reste sélectionnable dans le fichier
          obtenu, ce qui permet aux logiciels de recrutement de le lire.
        </p>
      </div>

      {/* Aperçu : la feuille est réduite pour tenir dans la colonne, et le
          conteneur reprend la hauteur réduite — sans quoi il garderait celle,
          bien plus grande, de la feuille à taille réelle. */}
      <div ref={cadre} className="cadre-apercu print:contents">
        <div
          className="reserve-apercu"
          style={{ height: hauteur ? hauteur * echelle : undefined }}
        >
          <div
            ref={feuille}
            style={{
              transform: `scale(${echelle})`,
              transformOrigin: "top left",
            }}
            className="apercu-echelle w-fit shadow-xl"
          >
            <DocumentCV modele={modele} cv={cv} user={user} />
          </div>
        </div>
      </div>
    </>
  );
}

export default function ExporterCvPage() {
  // useSearchParams impose une frontière Suspense au prérendu.
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-24">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ExporterCvPageInner />
    </Suspense>
  );
}
