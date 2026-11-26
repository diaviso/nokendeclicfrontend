"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Copy, Download, Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";

const LIEN_INSTALLATION = "https://www.noken.app/installer";

async function copierLien() {
  try {
    await navigator.clipboard.writeText(LIEN_INSTALLATION);
    toast.success("Lien copié");
  } catch {
    toast.error("Copie impossible", { description: LIEN_INSTALLATION });
  }
}

/**
 * Affiche A4 à imprimer : le QR code d'installation, pour les salons, les
 * campus et les bureaux. Le QR ouvre la page officielle /installer en HTTPS ; il
 * ne connecte personne, c'est ce qui permet de l'afficher sans risque.
 */
export default function AfficheQrPage() {
  return (
    <>
      {/* Tout ce qui précède l'affiche disparaît à l'impression. */}
      <div className="print:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 -ml-2 rounded-lg text-muted-foreground"
          render={<Link href="/admin/utilisateurs" />}
        >
          <ArrowLeft className="size-4" />
          Utilisateurs
        </Button>

        <ConsoleHeader
          title="Affiche QR code"
          icon={QrCode}
          teinte="var(--c-blue)"
          description="Affiche A4 à imprimer pour les salons, les campus et les bureaux. Le QR code ouvre la page d'installation ; il ne connecte personne et peut donc être affiché sans risque."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => void copierLien()}>
                <Copy className="size-4" />
                Copier le lien
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                render={<a href="/qr-installation.svg" download="noken-qr-code.svg" />}
              >
                <Download className="size-4" />
                QR code seul
              </Button>
              <Button className="rounded-xl" onClick={() => window.print()}>
                <Printer className="size-4" />
                Imprimer l&apos;affiche
              </Button>
            </div>
          }
        />

        <p className="mb-4 text-center text-xs text-muted-foreground">
          Aperçu de l&apos;affiche · à l&apos;impression, choisissez le format A4 et
          désactivez les en-têtes et pieds de page du navigateur.
        </p>
      </div>

      {/* Couleurs fixes : une affiche reste noir sur blanc, même en mode sombre. */}
      <article className="mx-auto flex aspect-[210/297] w-full max-w-2xl flex-col items-center justify-between rounded-2xl border bg-white p-[6%] shadow-lg text-center text-neutral-900 print:aspect-auto print:min-h-[92vh] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <div className="flex flex-col items-center">
          {/* Balise native, chargée d'emblée : une image différée pourrait manquer
              à l'impression. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Noken" width={96} height={96} />
          <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight text-neutral-900 sm:text-4xl">
            Emplois, formations et bourses au Sénégal, dans votre poche
          </h1>
          <p className="mt-3 text-lg text-neutral-600">
            Installez l&apos;application Noken, gratuitement.
          </p>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/qr-installation.svg"
          alt="QR code vers www.noken.app/installer"
          className="my-4 aspect-square w-3/5"
        />

        <div>
          <ol className="mx-auto max-w-md space-y-1 text-left text-base text-neutral-800">
            <li>1. Ouvrez l&apos;appareil photo de votre téléphone.</li>
            <li>2. Visez le QR code, puis touchez le lien qui s&apos;affiche.</li>
            <li>3. Suivez les indications pour installer l&apos;application.</li>
          </ol>
          <p className="mt-4 text-lg font-semibold" style={{ color: "#0072CE" }}>
            www.noken.app/installer
          </p>
        </div>
      </article>
    </>
  );
}
