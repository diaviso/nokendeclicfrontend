"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Camera, Loader2, Save, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ReglagesPush } from "@/components/notifications/reglages-push";
import { FormShell } from "@/components/shared/form-shell";
import { errorMessage, fileUrl, usersApi } from "@/lib/api";
import { AUTH_QUERY_KEY, useAuth } from "@/hooks/use-auth";
import { profileSchema, type ProfileInput } from "@/lib/schemas/profile";
import {
  ROLE_BADGE,
  SEXE_LABELS,
  STATUT_PROFESSIONNEL_LABELS,
  roleLabel,
} from "@/lib/enums";
import { celebrer } from "@/components/shared/celebration";
import { REGION_NAMES, departementsFor } from "@/lib/senegal";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Sexe, StatutProfessionnel } from "@/lib/types";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="border-b bg-muted/25 px-5 py-4">
        <h2 className="text-base font-bold">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="grid gap-4 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const selectClass =
  "h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50";


/** Champs qui rendent un profil exploitable pour les recommandations. */
const CHAMPS_PROFIL = [
  "firstName",
  "lastName",
  "telephone",
  "dateNaissance",
  "sexe",
  "region",
  "departement",
  "commune",
  "statutProfessionnel",
] as const;

function completionProfil(user: { [k: string]: unknown } | null | undefined): number {
  if (!user) return 0;
  const remplis = CHAMPS_PROFIL.filter((champ) => {
    const valeur = user[champ];
    return (
      valeur !== null &&
      valeur !== undefined &&
      valeur !== "" &&
      valeur !== "NON_PRECISE"
    );
  }).length;
  return Math.round((remplis / CHAMPS_PROFIL.length) * 100);
}

export default function ProfilPage() {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {},
  });

  // Le formulaire est renseigné dès que le profil est disponible. `reset` plutôt
  // que des defaultValues : l'utilisateur peut arriver avant la fin du chargement.
  useEffect(() => {
    if (!user) return;
    form.reset({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      telephone: user.telephone ?? "",
      dateNaissance: user.dateNaissance ? user.dateNaissance.slice(0, 10) : "",
      sexe: (user.sexe ?? "NON_PRECISE") as Sexe,
      adresse: user.adresse ?? "",
      pays: user.pays ?? "Sénégal",
      region: user.region ?? "",
      departement: user.departement ?? "",
      commune: user.commune ?? "",
      statutProfessionnel: (user.statutProfessionnel ??
        "NON_PRECISE") as StatutProfessionnel,
      handicap: user.handicap ?? false,
      typeHandicap: user.typeHandicap ?? "",
    });
  }, [user, form]);

  const region = form.watch("region");
  const handicap = form.watch("handicap");
  const departements = departementsFor(region);

  // Changer de région invalide le département sélectionné.
  useEffect(() => {
    const current = form.getValues("departement");
    if (current && region && !departements.includes(current)) {
      form.setValue("departement", "");
    }
  }, [region, departements, form]);

  const save = useMutation({
    mutationFn: async (values: ProfileInput) => {
      if (!user) throw new Error("Profil indisponible");
      // Les chaînes vides sont converties en undefined : le backend refuse une
      // date vide, et rien ne sert d'écraser un champ par "".
      const payload = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          value === "" ? undefined : value,
        ]),
      );
      return usersApi.update(user.id, payload);
    },
    onSuccess: async (_resultat, values) => {
      // Le passage à « en poste » se fête : c'est l'aboutissement de la
      // recherche, et le seul moment où l'application apprend une bonne
      // nouvelle personnelle. La comparaison se fait avec le statut d'avant
      // l'enregistrement, pour ne pas rejouer l'effet à chaque sauvegarde.
      const nouveauPoste =
        values.statutProfessionnel === "EN_POSTE" &&
        user?.statutProfessionnel !== "EN_POSTE";

      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });

      if (nouveauPoste) {
        celebrer("forte");
        toast.success("Félicitations pour votre poste !", {
          description: "Toute l'équipe Noken vous souhaite une belle réussite.",
        });
        return;
      }

      toast.success("Profil enregistré");
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", {
        description: errorMessage(error),
      }),
  });

  async function onPickPhoto(file?: File) {
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop volumineuse", { description: "5 Mo maximum." });
      return;
    }
    setUploading(true);
    try {
      await usersApi.uploadPhoto(user.id, file);
      await refresh();
      toast.success("Photo mise à jour");
    } catch (error) {
      toast.error("Envoi impossible", { description: errorMessage(error) });
    } finally {
      setUploading(false);
    }
  }

  const completion = completionProfil(user as unknown as Record<string, unknown>);
  const initials = `${user?.firstName?.[0] ?? user?.username?.[0] ?? "?"}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <FormShell>
      <PageHeader
        title="Mon profil"
        surtitre="Mon compte"
        icon={UserCircle}
        couleur="var(--chart-5)"
        description="Ces informations alimentent les recommandations de l'assistant et les statistiques de la plateforme."
      />

      <form
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        className="space-y-4 pb-4"
        noValidate
      >
        {/* Carte d'identité : la photo n'est plus un réglage isolé mais
            l'ancrage de la page — nom, adresse, rôle et ancienneté réunis. La
            barre d'avancement est en tête, comme sur le tableau de bord, pour
            que le même repère se retrouve aux deux endroits. */}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="h-1.5 w-full bg-muted">
            <div
              className="h-full rounded-r-full transition-[width] duration-700"
              style={{
                width: `${completion}%`,
                background:
                  "linear-gradient(90deg, var(--primary), oklch(0.72 0.17 200))",
              }}
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Complétion du profil"
            />
          </div>

          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-[0.07] blur-3xl"
              style={{ background: "var(--chart-5)" }}
            />

            <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <div className="group relative shrink-0">
                <Avatar className="size-20 ring-4 ring-background">
                  <AvatarImage src={fileUrl(user?.pictureUrl)} alt="" />
                  <AvatarFallback className="text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => void onPickPhoto(e.target.files?.[0])}
                />

                {/* Le bouton est posé sur l'avatar : c'est là qu'on cherche à
                    cliquer pour changer sa photo. */}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                  aria-label="Changer la photo de profil"
                  className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl font-bold">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                    user?.username ||
                    "Votre nom"}
                </h2>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {user?.email}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {user?.role ? (
                    <Badge
                      variant="outline"
                      className={cn("h-6 rounded-full px-2.5 text-[11px] font-semibold", ROLE_BADGE[user.role])}
                    >
                      {roleLabel(user.role)}
                    </Badge>
                  ) : null}
                  {user?.createdAt ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" aria-hidden />
                      Membre depuis {formatDate(user.createdAt)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 text-center sm:text-right">
                <p className="text-3xl font-extrabold tabular-nums text-primary">
                  {completion}%
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  profil complété
                </p>
              </div>
            </div>
          </div>
        </section>

        <Section title="Identité">
          <Field
            label="Prénom"
            htmlFor="firstName"
            error={form.formState.errors.firstName?.message}
          >
            <Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
          </Field>
          <Field
            label="Nom"
            htmlFor="lastName"
            error={form.formState.errors.lastName?.message}
          >
            <Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
          </Field>
          <Field label="Adresse email" htmlFor="email">
            <Input id="email" value={user?.email ?? ""} disabled readOnly />
          </Field>
          <Field
            label="Téléphone"
            htmlFor="telephone"
            error={form.formState.errors.telephone?.message}
          >
            <Input
              id="telephone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+221 77 000 00 00"
              {...form.register("telephone")}
            />
          </Field>
          <Field
            label="Date de naissance"
            htmlFor="dateNaissance"
            error={form.formState.errors.dateNaissance?.message}
          >
            <Input id="dateNaissance" type="date" {...form.register("dateNaissance")} />
          </Field>
          <Field label="Sexe" htmlFor="sexe">
            <select id="sexe" className={selectClass} {...form.register("sexe")}>
              {(Object.keys(SEXE_LABELS) as Sexe[]).map((s) => (
                <option key={s} value={s}>
                  {SEXE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section
          title="Localisation"
          description="Le département se met à jour en fonction de la région choisie."
        >
          <Field label="Pays" htmlFor="pays">
            <Input id="pays" {...form.register("pays")} />
          </Field>
          <Field label="Région" htmlFor="region">
            <select id="region" className={selectClass} {...form.register("region")}>
              <option value="">Non précisée</option>
              {REGION_NAMES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Département" htmlFor="departement">
            <select
              id="departement"
              className={selectClass}
              disabled={departements.length === 0}
              {...form.register("departement")}
            >
              <option value="">
                {departements.length === 0
                  ? "Choisissez d'abord une région"
                  : "Non précisé"}
              </option>
              {departements.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Commune" htmlFor="commune">
            <Input id="commune" {...form.register("commune")} />
          </Field>
          <Field
            label="Adresse"
            htmlFor="adresse"
            className="sm:col-span-2"
            error={form.formState.errors.adresse?.message}
          >
            <Input id="adresse" autoComplete="street-address" {...form.register("adresse")} />
          </Field>
        </Section>

        <Section title="Situation">
          <Field
            label="Statut professionnel"
            htmlFor="statutProfessionnel"
            className="sm:col-span-2"
          >
            <select
              id="statutProfessionnel"
              className={selectClass}
              {...form.register("statutProfessionnel")}
            >
              {(Object.keys(STATUT_PROFESSIONNEL_LABELS) as StatutProfessionnel[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {STATUT_PROFESSIONNEL_LABELS[s]}
                  </option>
                ),
              )}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div className="min-w-0">
                <Label htmlFor="handicap" className="text-sm">
                  Situation de handicap
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Information facultative, utilisée uniquement pour adapter
                  l&apos;accompagnement et produire des statistiques agrégées.
                </p>
              </div>
              <Switch
                id="handicap"
                checked={Boolean(handicap)}
                onCheckedChange={(checked) => form.setValue("handicap", checked)}
              />
            </div>

            {handicap ? (
              <div className="mt-3">
                <Label htmlFor="typeHandicap">Précisez (facultatif)</Label>
                <Input
                  id="typeHandicap"
                  className="mt-1.5"
                  {...form.register("typeHandicap")}
                />
              </div>
            ) : null}
          </div>
        </Section>

        {/* Barre d'action collante : sur mobile, le bouton reste atteignable
            sans avoir à remonter tout le formulaire. */}
        <div className="sticky bottom-16 z-10 flex items-center gap-2 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur lg:bottom-4">
          {form.formState.isDirty ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-amber-500" aria-hidden />
              Modifications non enregistrées
            </p>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            className="ml-auto rounded-xl"
            onClick={() => user && form.reset()}
            disabled={save.isPending || !form.formState.isDirty}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            size="lg"
            className="rounded-xl"
            disabled={save.isPending || !form.formState.isDirty}
          >
            {save.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </form>

      {/* Hors du formulaire : ce réglage vaut pour le navigateur courant, pas
          pour le profil, et n'a donc rien à faire dans un enregistrement. */}
      <div className="mt-6">
        <ReglagesPush />
      </div>
    </FormShell>
  );
}
