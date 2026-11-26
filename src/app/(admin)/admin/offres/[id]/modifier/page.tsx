"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Loader2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";
import { FormShell } from "@/components/shared/form-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { OffreForm } from "@/components/admin/offre-form";
import { offresApi } from "@/lib/api";

export default function ModifierOffrePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const offreId = Number(id);

  const { data: offre, isLoading, isError } = useQuery({
    queryKey: ["offres", offreId],
    queryFn: () => offresApi.byId(offreId),
    enabled: Number.isInteger(offreId),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center gap-3 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement de l&apos;offre…
      </div>
    );
  }

  if (isError || !offre) {
    return (
      <EmptyState
        icon={SearchX}
        title="Offre introuvable"
        description="Elle a peut-être été supprimée, ou le lien est incomplet."
        action={
          <Button variant="outline" size="sm" render={<Link href="/admin/offres" />}>
            Retour aux offres
          </Button>
        }
      />
    );
  }

  return (
    <FormShell className="max-w-7xl">
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
        teinte="var(--c-emerald)"
        title="Modifier l'offre"
        description={offre.titre}
      />

      <OffreForm offre={offre} />
    </FormShell>
  );
}
