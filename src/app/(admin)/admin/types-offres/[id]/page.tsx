"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TypeOffreForm } from "@/components/admin/type-offre-form";
import { adminTypesOffresApi } from "@/lib/api";

function Retour() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="mb-3 -ml-2 rounded-lg"
      render={<Link href="/admin/types-offres" />}
    >
      <ArrowLeft className="size-4" />
      Types d&apos;offres
    </Button>
  );
}

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
      <div className="mx-auto w-full max-w-6xl">
        <Retour />
        <div className="shimmer mb-6 h-32 rounded-3xl bg-muted" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <div className="shimmer h-96 rounded-2xl bg-muted" />
            <div className="shimmer h-48 rounded-2xl bg-muted" />
          </div>
          <div className="shimmer h-72 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !type) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <Retour />
        <EmptyState
          icon={Layers}
          title="Type introuvable"
          description="Il a peut-être été supprimé entre-temps."
          action={
            <Button variant="outline" size="sm" className="rounded-xl" render={<Link href="/admin/types-offres" />}>
              Retour aux types
            </Button>
          }
        />
      </div>
    );
  }

  const nbOffres = type._count?.offres ?? 0;
  const nbObligatoires = type.champs.filter((champ) => champ.obligatoire).length;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Retour />

      <ConsoleHeader
        icon={Layers}
        title={type.libelle}
        description="Modifiez l'identité du type et les informations demandées lors de la publication."
        mesures={[
          { label: "champs", valeur: type.champs.length, teinte: "var(--c-teal)" },
          { label: "obligatoires", valeur: nbObligatoires },
          { label: "offres rattachées", valeur: nbOffres },
          {
            label: "état",
            valeur: type.estActif ? "Actif" : "Désactivé",
            teinte: type.estActif ? "var(--success)" : undefined,
          },
        ]}
      />

      {/* La clé force le remontage du formulaire si l'identifiant change :
          sans elle, react-hook-form conserverait les valeurs par défaut du
          type précédemment affiché. */}
      <TypeOffreForm key={type.id} type={type} />
    </div>
  );
}
