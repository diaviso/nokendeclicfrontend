"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Contact,
  ImagePlus,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { FormShell } from "@/components/shared/form-shell";
import { celebrer } from "@/components/shared/celebration";
import {
  errorMessage,
  fileUrl,
  partenaireApi,
  type EntreprisePayload,
} from "@/lib/api";
import { SECTEUR_LABELS } from "@/lib/enums";
import type { Secteur } from "@/lib/types";

/** En-tête de bloc : pastille en dégradé, lavis discret de la teinte. */
function EnteteSection({
  icone: Icone,
  teinte,
  titre,
  description,
}: {
  icone: typeof Building2;
  teinte: string;
  titre: string;
  description?: string;
}) {
  return (
    <header
      className="flex items-start gap-3 border-b px-5 py-3.5"
      style={{
        background: `linear-gradient(90deg, color-mix(in oklch, ${teinte} 8%, transparent), transparent 60%)`,
      }}
    >
      <span
        className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-white shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${teinte}, color-mix(in oklch, ${teinte} 65%, black))`,
        }}
      >
        <Icone className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold">{titre}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </header>
  );
}

const TAILLES = [
  "1 à 9 salariés",
  "10 à 49 salariés",
  "50 à 249 salariés",
  "250 salariés et plus",
];

const classeSelect =
  "h-10 w-full rounded-xl border bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-input focus-visible:ring-2 focus-visible:ring-ring/40";

interface Formulaire {
  nom: string;
  description: string;
  secteur: string;
  siteWeb: string;
  emailContact: string;
  telephone: string;
  ville: string;
  region: string;
  taille: string;
}

const VIDE: Formulaire = {
  nom: "",
  description: "",
  secteur: "",
  siteWeb: "",
  emailContact: "",
  telephone: "",
  ville: "",
  region: "",
  taille: "",
};

export default function EntreprisePartenairePage() {
  const queryClient = useQueryClient();
  const champLogo = useRef<HTMLInputElement>(null);

  const { data: entreprise, isLoading } = useQuery({
    queryKey: ["partenaire", "entreprise"],
    queryFn: partenaireApi.monEntreprise,
  });

  const form = useForm<Formulaire>({ defaultValues: VIDE });

  // Les valeurs arrivent après le premier rendu : `reset` les installe sans
  // marquer le formulaire comme modifié, ce qu'un `setValue` par champ ferait.
  useEffect(() => {
    if (!entreprise) return;
    form.reset({
      nom: entreprise.nom ?? "",
      description: entreprise.description ?? "",
      secteur: entreprise.secteur ?? "",
      siteWeb: entreprise.siteWeb ?? "",
      emailContact: entreprise.emailContact ?? "",
      telephone: entreprise.telephone ?? "",
      ville: entreprise.ville ?? "",
      region: entreprise.region ?? "",
      taille: entreprise.taille ?? "",
    });
  }, [entreprise, form]);

  const enregistrer = useMutation({
    mutationFn: (valeurs: Formulaire) => {
      const charge: EntreprisePayload = {
        nom: valeurs.nom.trim(),
        // Les champs vides sont omis plutôt qu'envoyés en chaîne vide : le
        // serveur valide le format d'une adresse web ou d'un email, et une
        // chaîne vide échouerait à cette validation.
        description: valeurs.description.trim() || undefined,
        secteur: (valeurs.secteur || undefined) as Secteur | undefined,
        siteWeb: valeurs.siteWeb.trim() || undefined,
        emailContact: valeurs.emailContact.trim() || undefined,
        telephone: valeurs.telephone.trim() || undefined,
        ville: valeurs.ville.trim() || undefined,
        region: valeurs.region.trim() || undefined,
        taille: valeurs.taille || undefined,
      };
      return partenaireApi.enregistrerEntreprise(charge);
    },
    onSuccess: async (resultat) => {
      await queryClient.invalidateQueries({ queryKey: ["partenaire", "entreprise"] });
      form.reset(form.getValues());
      if (!entreprise) celebrer();
      toast.success(entreprise ? "Fiche mise à jour" : "Fiche créée", {
        description: `« ${resultat.nom} » est enregistrée.`,
      });
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", { description: errorMessage(error) }),
  });

  const envoyerLogo = useMutation({
    mutationFn: (fichier: File) => partenaireApi.envoyerLogo(fichier),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["partenaire", "entreprise"] });
      toast.success("Logo enregistré");
    },
    onError: (error) =>
      toast.error("Envoi impossible", { description: errorMessage(error) }),
  });

  const retirerLogo = useMutation({
    mutationFn: () => partenaireApi.retirerLogo(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["partenaire", "entreprise"] });
      toast.success("Logo retiré");
    },
    onError: (error) =>
      toast.error("Retrait impossible", { description: errorMessage(error) }),
  });

  const [erreurNom, setErreurNom] = useState<string | undefined>();

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Chargement de la fiche…</span>
      </div>
    );
  }

  return (
    <FormShell>
      <PageHeader
        title="Ma structure"
        surtitre="Recrutement"
        icon={Building2}
        couleur="var(--c-lime)"
        description="Ces informations apparaissent auprès de vos offres et, si l'équipe Noken le décide, sur la page d'accueil."
      />

      <form
        onSubmit={form.handleSubmit((valeurs) => {
          if (!valeurs.nom.trim()) {
            setErreurNom("Le nom de la structure est requis");
            return;
          }
          setErreurNom(undefined);
          enregistrer.mutate(valeurs);
        })}
        className="space-y-4 pb-4"
        noValidate
      >
        {/* ─────────────────────────────────────────────────────── Identité */}
        <section className="entree overflow-hidden rounded-2xl border bg-card shadow-sm">
          <EnteteSection icone={Building2} teinte="var(--c-lime)" titre="Identité" />

          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-[color-mix(in_oklch,var(--c-lime)_8%,transparent)] shadow-sm transition-transform duration-300 hover:scale-105">
                {entreprise?.logoUrl ? (
                  /* Balise native plutôt que `next/image` : le logo peut venir
                     du stockage distant comme du dossier local selon
                     l'environnement, et l'optimiseur refuse tout domaine non
                     déclaré. Une vignette de 80 pixels n'a rien à y gagner. */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl(entreprise.logoUrl)}
                    alt=""
                    className="size-full object-contain"
                  />
                ) : (
                  <Building2 className="size-7 text-[var(--c-lime)]" aria-hidden />
                )}
              </span>

              <div className="min-w-0">
                <p className="text-sm font-semibold">Logo</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Format carré de préférence, sur fond clair ou transparent.
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    ref={champLogo}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(evenement) => {
                      const fichier = evenement.target.files?.[0];
                      if (fichier) envoyerLogo.mutate(fichier);
                      // Réinitialisé pour que renvoyer le même fichier
                      // déclenche à nouveau l'événement.
                      evenement.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={envoyerLogo.isPending || !entreprise}
                    title={
                      entreprise
                        ? undefined
                        : "Enregistrez d'abord le nom de votre structure"
                    }
                    onClick={() => champLogo.current?.click()}
                  >
                    {envoyerLogo.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImagePlus className="size-4" />
                    )}
                    {entreprise?.logoUrl ? "Remplacer" : "Ajouter un logo"}
                  </Button>

                  {entreprise?.logoUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-muted-foreground hover:text-destructive"
                      disabled={retirerLogo.isPending}
                      onClick={() => retirerLogo.mutate()}
                    >
                      <Trash2 className="size-4" />
                      Retirer
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="nom">Nom de la structure</Label>
              <Input
                id="nom"
                className="mt-1.5"
                placeholder="Sarl Baobab"
                aria-invalid={Boolean(erreurNom)}
                {...form.register("nom")}
              />
              {erreurNom ? (
                <p role="alert" className="mt-1 text-sm text-destructive">
                  {erreurNom}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="description">Présentation</Label>
              <Textarea
                id="description"
                rows={4}
                maxLength={1500}
                className="mt-1.5"
                placeholder="Votre activité, vos métiers, ce qui vous distingue."
                {...form.register("description")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="secteur">Secteur</Label>
                <select
                  id="secteur"
                  className={`${classeSelect} mt-1.5`}
                  {...form.register("secteur")}
                >
                  <option value="">Non précisé</option>
                  {(Object.keys(SECTEUR_LABELS) as Secteur[]).map((valeur) => (
                    <option key={valeur} value={valeur}>
                      {SECTEUR_LABELS[valeur]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="taille">Effectif</Label>
                <select
                  id="taille"
                  className={`${classeSelect} mt-1.5`}
                  {...form.register("taille")}
                >
                  <option value="">Non précisé</option>
                  {TAILLES.map((valeur) => (
                    <option key={valeur} value={valeur}>
                      {valeur}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────── Coordonnées */}
        <section
          style={{ "--i": 1 } as React.CSSProperties}
          className="entree overflow-hidden rounded-2xl border bg-card shadow-sm"
        >
          <EnteteSection
            icone={Contact}
            teinte="var(--c-sky)"
            titre="Coordonnées"
            description="Celles de la structure, distinctes de celles de votre compte. Elles accompagnent vos offres."
          />

          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="siteWeb">Site web</Label>
              <Input
                id="siteWeb"
                type="url"
                className="mt-1.5"
                placeholder="https://exemple.sn"
                {...form.register("siteWeb")}
              />
            </div>

            <div>
              <Label htmlFor="emailContact">Email de contact</Label>
              <Input
                id="emailContact"
                type="email"
                className="mt-1.5"
                placeholder="contact@exemple.sn"
                {...form.register("emailContact")}
              />
            </div>

            <div>
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                className="mt-1.5"
                placeholder="+221 77 000 00 00"
                {...form.register("telephone")}
              />
            </div>

            <div>
              <Label htmlFor="ville">Ville</Label>
              <Input id="ville" className="mt-1.5" {...form.register("ville")} />
            </div>

            <div>
              <Label htmlFor="region">Région</Label>
              <Input id="region" className="mt-1.5" {...form.register("region")} />
            </div>
          </div>
        </section>

        {entreprise?.estVisibleVitrine ? (
          <p
            className="flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm"
            style={{
              background: "color-mix(in oklch, var(--c-lime) 8%, transparent)",
              borderColor: "color-mix(in oklch, var(--c-lime) 25%, transparent)",
            }}
          >
            <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--c-lime)]" aria-hidden />
            Votre structure figure actuellement sur la vitrine de la page
            d&apos;accueil.
          </p>
        ) : null}

        <div className="sticky bottom-16 z-10 flex items-center justify-end gap-2 rounded-2xl border bg-background/90 p-3 shadow-lg backdrop-blur-xl lg:bottom-4">
          {form.formState.isDirty ? (
            <span className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--c-amber)] opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-[var(--c-amber)]" />
              </span>
              Non enregistré
            </span>
          ) : null}
          <Button
            type="submit"
            className="rounded-xl"
            disabled={enregistrer.isPending}
          >
            {enregistrer.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </form>
    </FormShell>
  );
}
