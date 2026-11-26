"use client";

import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";
import { TypeOffreForm } from "@/components/admin/type-offre-form";

export default function NouveauTypeOffrePage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 rounded-lg"
        render={<Link href="/admin/types-offres" />}
      >
        <ArrowLeft className="size-4" />
        Types d&apos;offres
      </Button>

      <ConsoleHeader
        icon={Layers}
        title="Nouveau type d'offre"
        description="Définissez le nom du type et les informations demandées lors de la publication. L'aperçu se met à jour au fil de la saisie."
      />

      <TypeOffreForm />
    </div>
  );
}
