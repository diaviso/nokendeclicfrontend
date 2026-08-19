"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";
import { FormShell } from "@/components/shared/form-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { TypeOffreForm } from "@/components/admin/type-offre-form";
import { adminTypesOffresApi } from "@/lib/api";

export default function ModifierTypeOffrePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const typeId = Number(id);

  const { data: type, isLoading, isError } = useQuery({
    queryKey: ["admin", "types-offres", typeId],
    queryFn: () => adminTypesOffresApi.byId(typeId),
    enabled: Number.isInteger(typeId),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !type) {
    return (
      <EmptyState
        title="Type introuvable"
        action={
          <Button variant="outline" size="sm" render={<Link href="/admin/types-offres" />}>
            Retour aux types
          </Button>
        }
      />
    );
  }

  return (
    <FormShell>
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
        teinte="var(--chart-4)"
        title={type.libelle}
        description={`${type.champs.length} champ${type.champs.length > 1 ? "s" : ""} · ${
          type._count?.offres ?? 0
        } offre${(type._count?.offres ?? 0) > 1 ? "s" : ""}`}
      />

      {/* La clé force le remontage du formulaire si l'identifiant change :
          sans elle, react-hook-form conserverait les valeurs par défaut du
          type précédemment affiché. */}
      <TypeOffreForm key={type.id} type={type} />
    </FormShell>
  );
}
