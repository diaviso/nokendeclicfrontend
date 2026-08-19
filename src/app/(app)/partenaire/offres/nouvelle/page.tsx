"use client";

import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { FormShell } from "@/components/shared/form-shell";
import { OffreForm } from "@/components/admin/offre-form";

export default function NouvelleOffrePartenairePage() {
  return (
    <FormShell className="max-w-5xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 rounded-lg"
        render={<Link href="/partenaire/offres" />}
      >
        <ArrowLeft className="size-4" />
        Mes offres
      </Button>

      <PageHeader
        title="Publier une offre"
        surtitre="Recrutement"
        icon={Building2}
        couleur="var(--chart-3)"
        description="Votre annonce sera relue par l'équipe Noken avant sa mise en ligne. Plus elle est précise, plus la relecture est rapide."
      />

      <OffreForm racine="/partenaire/offres" />
    </FormShell>
  );
}
