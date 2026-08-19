"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";
import { FormShell } from "@/components/shared/form-shell";
import { OffreForm } from "@/components/admin/offre-form";

export default function NouvelleOffrePage() {
  return (
    <FormShell className="max-w-5xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 rounded-lg"
        render={<Link href="/admin/offres" />}
      >
        <ArrowLeft className="size-4" />
        Offres
      </Button>

      <ConsoleHeader
        icon={Briefcase}
        teinte="var(--chart-3)"
        title="Nouvelle offre"
        description="Les champs proposés s'adaptent au type d'opportunité choisi."
      />

      <OffreForm />
    </FormShell>
  );
}
