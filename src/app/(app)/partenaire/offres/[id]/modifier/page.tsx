"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { FormShell } from "@/components/shared/form-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { OffreForm } from "@/components/admin/offre-form";
import { BandeauModeration } from "@/components/partenaire/statut-moderation";
import { offresApi } from "@/lib/api";

export default function ModifierOffrePartenairePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const offreId = Number(id);

  const {
    data: offre,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["mes-offres", offreId],
    // Route d'édition et non route publique : une annonce en attente ou
    // refusée n'apparaît pas au catalogue, et ne serait donc pas chargée.
    queryFn: () => offresApi.pourEdition(offreId),
    enabled: Number.isInteger(offreId),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Chargement de l&apos;offre…</span>
      </div>
    );
  }

  if (isError || !offre) {
    return (
      <EmptyState
        icon={Building2}
        couleur="var(--c-teal)"
        title="Offre introuvable"
        description="Elle a peut-être été supprimée, ou appartient à une autre structure."
        action={
          <Button
            variant="outline"
            className="rounded-xl"
            render={<Link href="/partenaire/offres" />}
          >
            Retour à mes offres
          </Button>
        }
      />
    );
  }

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
        title="Modifier l'offre"
        surtitre="Recrutement"
        icon={Building2}
        couleur="var(--c-teal)"
        description={offre.titre}
      />

      <BandeauModeration
        statut={offre.statutModeration}
        motifRefus={offre.motifRefus}
      />

      {/* Toute modification renvoie l'annonce en relecture : le dire avant la
          saisie évite la surprise de la voir quitter le catalogue. */}
      {offre.statutModeration === "PUBLIEE" ? (
        <p
          className="mb-4 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm"
          style={{
            background: "color-mix(in oklch, var(--c-amber) 8%, transparent)",
            borderColor: "color-mix(in oklch, var(--c-amber) 25%, transparent)",
          }}
        >
          <Info className="mt-0.5 size-4 shrink-0 text-[var(--c-amber)]" aria-hidden />
          <span>
          Cette annonce est en ligne. L&apos;enregistrer la renverra en
          validation, et elle sera momentanément retirée du catalogue.
          </span>
        </p>
      ) : null}

      <OffreForm offre={offre} racine="/partenaire/offres" />
    </FormShell>
  );
}
