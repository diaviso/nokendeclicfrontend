"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FileUp,
  GraduationCap,
  Layers,
  type LucideIcon,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { FormShell } from "@/components/shared/form-shell";
import { celebrer } from "@/components/shared/celebration";
import { TagInput } from "@/components/shared/tag-input";
import { EntreeFrise } from "@/components/cv/entree-frise";
import { AvancementCV } from "@/components/cv/avancement";
import { FilEtapes } from "@/components/cv/etapes";
import { RevueImport, type BlocImport } from "@/components/cv/revue-import";
import { RubriquesLibres } from "@/components/cv/rubriques-libres";
import { FORMATS_CV_ACCEPTES, cvApi, errorMessage } from "@/lib/api";
import type { CV, ExtractedCV, RubriqueCV } from "@/lib/types";

interface CVForm {
  titreProfessionnel: string;
  resume: string;
  telephone: string;
  ville: string;
  pays: string;
  linkedin: string;
  github: string;
  siteWeb: string;
  estPublic: boolean;
  competences: string[];
  langues: string[];
  certifications: string[];
  interets: string[];
  rubriques: RubriqueCV[];
  experiences: {
    poste: string;
    entreprise: string;
    ville: string;
    dateDebut: string;
    dateFin: string;
    enCours: boolean;
    description: string;
  }[];
  formations: {
    diplome: string;
    etablissement: string;
    ville: string;
    dateDebut: string;
    dateFin: string;
    enCours: boolean;
    description: string;
  }[];
}

const EMPTY: CVForm = {
  titreProfessionnel: "",
  resume: "",
  telephone: "",
  ville: "",
  pays: "Sénégal",
  linkedin: "",
  github: "",
  siteWeb: "",
  estPublic: false,
  competences: [],
  langues: [],
  certifications: [],
  interets: [],
  rubriques: [],
  experiences: [],
  formations: [],
};

function toForm(cv: CV | null): CVForm {
  if (!cv) return EMPTY;
  const day = (value?: string | null) => (value ? value.slice(0, 10) : "");
  return {
    titreProfessionnel: cv.titreProfessionnel ?? "",
    resume: cv.resume ?? "",
    telephone: cv.telephone ?? "",
    ville: cv.ville ?? "",
    pays: cv.pays ?? "Sénégal",
    linkedin: cv.linkedin ?? "",
    github: cv.github ?? "",
    siteWeb: cv.siteWeb ?? "",
    estPublic: cv.estPublic ?? false,
    competences: cv.competences ?? [],
    langues: cv.langues ?? [],
    certifications: cv.certifications ?? [],
    interets: cv.interets ?? [],
    rubriques: cv.rubriques ?? [],
    experiences: (cv.experiences ?? []).map((e) => ({
      poste: e.poste ?? "",
      entreprise: e.entreprise ?? "",
      ville: e.ville ?? "",
      dateDebut: day(e.dateDebut),
      dateFin: day(e.dateFin),
      enCours: e.enCours ?? false,
      description: e.description ?? "",
    })),
    formations: (cv.formations ?? []).map((f) => ({
      diplome: f.diplome ?? "",
      etablissement: f.etablissement ?? "",
      ville: f.ville ?? "",
      dateDebut: day(f.dateDebut),
      dateFin: day(f.dateFin),
      enCours: f.enCours ?? false,
      description: f.description ?? "",
    })),
  };
}

/**
 * Bloc de l'éditeur de CV.
 *
 * L'icône colorée en tête distingue les sections d'un coup d'œil : le
 * formulaire est long, et une suite de cartes identiques oblige à relire chaque
 * titre pour se repérer en cours de saisie.
 */
function Section({
  title,
  description,
  action,
  icon: Icon,
  couleur = "var(--primary)",
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  couleur?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b bg-muted/25 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <span
              className="grid size-9 shrink-0 place-items-center rounded-xl"
              style={{
                background: `color-mix(in oklch, ${couleur} 14%, transparent)`,
                color: couleur,
              }}
            >
              <Icon className="size-4.5" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-bold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {action}
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}


/**
 * Conteneur d'une étape.
 *
 * Le contenu reste monté même masqué : react-hook-form conserverait les valeurs
 * de toute façon, mais garder les champs dans le DOM préserve aussi l'état
 * natif des listes déroulantes et évite de réinitialiser les composants de
 * saisie de tableaux à chaque va-et-vient entre étapes.
 */
function EtapeVisible({
  actif,
  children,
}: {
  actif: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={actif ? "entree" : "hidden"} aria-hidden={!actif}>
      {children}
    </div>
  );
}

export default function CVPage() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [etape, setEtape] = useState(0);
  const [apercu, setApercu] = useState<ExtractedCV | null>(null);
  const [corrections, setCorrections] = useState<
    { field: string; original: string; corrected: string; reason: string }[]
  >([]);

  const { data: cv, isLoading } = useQuery({
    queryKey: ["cv", "me"],
    queryFn: cvApi.mine,
  });

  const form = useForm<CVForm>({ defaultValues: EMPTY });

  useEffect(() => {
    if (cv !== undefined) form.reset(toForm(cv));
  }, [cv, form]);

  const experiences = useFieldArray({ control: form.control, name: "experiences" });
  const formations = useFieldArray({ control: form.control, name: "formations" });

  const save = useMutation({
    mutationFn: (values: CVForm) => {
      // Les dates vides doivent partir absentes : le backend attend un ISO
      // valide ou rien, pas une chaîne vide.
      const clean = <
        T extends { dateDebut: string; dateFin: string; enCours: boolean },
      >(
        item: T,
      ) => ({
        ...item,
        dateFin: item.enCours || !item.dateFin ? undefined : item.dateFin,
        dateDebut: item.dateDebut || undefined,
      });
      return cvApi.save({
        ...values,
        experiences: values.experiences.map(clean),
        formations: values.formations.map(clean),
      } as never);
    },
    onSuccess: async () => {
      const premier = !cv;
      await queryClient.invalidateQueries({ queryKey: ["cv"] });

      if (premier) {
        celebrer("forte");
        toast.success("Votre CV est prêt !", {
          description:
            "Il sera réutilisé à chaque candidature, et l'assistant peut désormais s'appuyer dessus.",
        });
        return;
      }

      toast.success("CV enregistré");
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", { description: errorMessage(error) }),
  });

  const correct = useMutation({
    mutationFn: () => {
      const v = form.getValues();
      return cvApi.correct({
        titreProfessionnel: v.titreProfessionnel,
        resume: v.resume,
        competences: v.competences,
        langues: v.langues,
        certifications: v.certifications,
        interets: v.interets,
        experiences: v.experiences.map((e) => ({
          poste: e.poste,
          entreprise: e.entreprise,
          ville: e.ville,
          description: e.description,
        })),
        formations: v.formations.map((f) => ({
          diplome: f.diplome,
          etablissement: f.etablissement,
          ville: f.ville,
          description: f.description,
        })),
      });
    },
    onSuccess: (result) => {
      const data = result.data as Partial<CVForm>;
      // On n'écrase que les champs textuels renvoyés : les dates et les
      // identifiants ne passent pas par la correction.
      if (data.titreProfessionnel)
        form.setValue("titreProfessionnel", data.titreProfessionnel, { shouldDirty: true });
      if (data.resume) form.setValue("resume", data.resume, { shouldDirty: true });
      if (Array.isArray(data.competences))
        form.setValue("competences", data.competences, { shouldDirty: true });

      setCorrections(result.corrections ?? []);
      toast.success(
        result.corrections?.length
          ? `${result.corrections.length} amélioration${result.corrections.length > 1 ? "s" : ""} appliquée${result.corrections.length > 1 ? "s" : ""}`
          : "Aucune correction nécessaire",
      );
    },
    onError: (error) =>
      toast.error("Correction impossible", { description: errorMessage(error) }),
  });

  async function onImport(file?: File) {
    if (!file) return;
    setImporting(true);
    try {
      // Rien n'est appliqué ici : les données passent par une revue, seul
      // endroit où une lecture erronée peut être écartée avant d'atterrir dans
      // le formulaire.
      setApercu(await cvApi.importer(file));
    } catch (error) {
      toast.error("Analyse impossible", { description: errorMessage(error) });
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  /**
   * Applique les blocs retenus.
   *
   * Chaque bloc écrase la valeur correspondante plutôt que de s'y ajouter : un
   * import est une reprise du CV, pas un complément. Les blocs écartés laissent
   * la saisie en place, intacte.
   */
  function appliquerImport(blocs: Set<BlocImport>) {
    if (!apercu) return;
    const valeursActuelles = form.getValues();

    form.reset(
      {
        ...valeursActuelles,
        ...(blocs.has("profil")
          ? {
              titreProfessionnel: apercu.titreProfessionnel ?? "",
              resume: apercu.resume ?? "",
            }
          : {}),
        ...(blocs.has("contact")
          ? {
              telephone: apercu.telephone ?? "",
              ville: apercu.ville ?? "",
              pays: apercu.pays ?? valeursActuelles.pays,
              linkedin: apercu.linkedin ?? "",
              github: apercu.github ?? "",
              siteWeb: apercu.siteWeb ?? "",
            }
          : {}),
        ...(blocs.has("competences")
          ? {
              competences: apercu.competences ?? [],
              langues: apercu.langues ?? [],
              certifications: apercu.certifications ?? [],
              interets: apercu.interets ?? [],
            }
          : {}),
        ...(blocs.has("experiences")
          ? {
              experiences: (apercu.experiences ?? []).map((e) => ({
                poste: e.poste ?? "",
                entreprise: e.entreprise ?? "",
                ville: e.ville ?? "",
                dateDebut: (e.dateDebut ?? "").slice(0, 10),
                dateFin: (e.dateFin ?? "").slice(0, 10),
                enCours: Boolean(e.enCours),
                description: e.description ?? "",
              })),
            }
          : {}),
        ...(blocs.has("formations")
          ? {
              formations: (apercu.formations ?? []).map((f) => ({
                diplome: f.diplome ?? "",
                etablissement: f.etablissement ?? "",
                ville: f.ville ?? "",
                dateDebut: (f.dateDebut ?? "").slice(0, 10),
                dateFin: (f.dateFin ?? "").slice(0, 10),
                enCours: Boolean(f.enCours),
                description: f.description ?? "",
              })),
            }
          : {}),
        ...(blocs.has("rubriques") ? { rubriques: apercu.rubriques ?? [] } : {}),
      },
      { keepDefaultValues: true },
    );

    // Le formulaire est marqué comme modifié : sans cela, le bouton
    // d'enregistrement resterait inerte alors que le contenu vient de changer.
    form.setValue("titreProfessionnel", form.getValues("titreProfessionnel"), {
      shouldDirty: true,
    });

    setApercu(null);
    setEtape(0);
    toast.success("Formulaire rempli", {
      description: "Relisez les informations, puis enregistrez votre CV.",
    });
  }

  const valeurs = form.watch();

  const ETAPES_CV = [
    {
      cle: "profil",
      libelle: "Profil",
      icone: UserRound,
      couleur: "var(--chart-2)",
      renseignee: Boolean(valeurs.titreProfessionnel?.trim() || valeurs.resume?.trim()),
    },
    {
      cle: "competences",
      libelle: "Compétences",
      icone: Award,
      couleur: "var(--chart-5)",
      renseignee: valeurs.competences.length > 0 || valeurs.langues.length > 0,
    },
    {
      cle: "experiences",
      libelle: "Expériences",
      icone: Briefcase,
      couleur: "var(--chart-3)",
      renseignee: valeurs.experiences.length > 0,
    },
    {
      cle: "formations",
      libelle: "Formations",
      icone: GraduationCap,
      couleur: "var(--chart-4)",
      renseignee: valeurs.formations.length > 0,
    },
    {
      cle: "rubriques",
      libelle: "Autres",
      icone: Layers,
      couleur: "var(--chart-1)",
      renseignee: valeurs.rubriques.length > 0,
    },
    {
      cle: "visibilite",
      libelle: "Visibilité",
      icone: Eye,
      couleur: "var(--chart-1)",
      renseignee: valeurs.estPublic,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <FormShell>
      <PageHeader
        title="Mon CV"
        surtitre="Mes outils"
        icon={FileText}
        couleur="var(--chart-2)"
        description="Ces informations alimentent les recommandations de l'assistant et vos candidatures."
        actions={
          <>
            <input
              ref={fileInput}
              type="file"
              accept={FORMATS_CV_ACCEPTES}
              className="sr-only"
              onChange={(e) => void onImport(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              className="rounded-xl"
              render={<Link href="/cv/exporter" />}
            >
              <Download className="size-4" />
              Télécharger en PDF
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={importing}
              onClick={() => fileInput.current?.click()}
            >
              {importing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
              )}
              Importer un CV
            </Button>
            <Button
              className="shine relative overflow-hidden rounded-xl"
              disabled={correct.isPending}
              onClick={() => correct.mutate()}
            >
              {correct.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              Améliorer avec l&apos;IA
            </Button>
          </>
        }
      />

      <AvancementCV
        etapes={[
          { libelle: "Titre professionnel", fait: Boolean(valeurs.titreProfessionnel?.trim()) },
          { libelle: "Résumé", fait: Boolean(valeurs.resume?.trim()) },
          { libelle: "Contact", fait: Boolean(valeurs.telephone?.trim() || valeurs.ville?.trim()) },
          { libelle: "Compétences", fait: valeurs.competences.length > 0 },
          { libelle: "Expérience", fait: valeurs.experiences.length > 0 },
          { libelle: "Formation", fait: valeurs.formations.length > 0 },
        ]}
      />

      <FilEtapes etapes={ETAPES_CV} courante={etape} onChange={setEtape} />

      <form
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
        className="space-y-4 pb-4"
        // Le formulaire est découpé en étapes : les champs des étapes masquées
        // restent dans le DOM. La validation native du navigateur les inspecte
        // quand même, et si l'un d'eux est invalide — une adresse LinkedIn
        // recopiée sans « https:// », par exemple — elle bloque l'envoi sans
        // pouvoir afficher son message, puisque le champ n'est pas visible.
        // L'enregistrement échouait alors en silence. La validation est celle
        // de zod, jamais celle du navigateur.
        noValidate
      >
        <EtapeVisible actif={etape === 0}>
        <Section title="Profil" icon={UserRound} couleur="var(--chart-2)">
          <div>
            <Label htmlFor="titreProfessionnel">Titre professionnel</Label>
            <Input
              id="titreProfessionnel"
              className="mt-1.5"
              placeholder="Développeur web full stack"
              {...form.register("titreProfessionnel")}
            />
          </div>
          <div>
            <Label htmlFor="resume">Résumé</Label>
            <Textarea
              id="resume"
              rows={5}
              className="mt-1.5"
              placeholder="Quelques lignes sur votre parcours et ce que vous recherchez."
              {...form.register("resume")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cv-telephone">Téléphone</Label>
              <Input id="cv-telephone" type="tel" className="mt-1.5" {...form.register("telephone")} />
            </div>
            <div>
              <Label htmlFor="cv-ville">Ville</Label>
              <Input id="cv-ville" className="mt-1.5" {...form.register("ville")} />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" type="url" className="mt-1.5" {...form.register("linkedin")} />
            </div>
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input id="github" type="url" className="mt-1.5" {...form.register("github")} />
            </div>
          </div>
        </Section>
        </EtapeVisible>

        <EtapeVisible actif={etape === 1}>
        <Section title="Compétences et langues" icon={Award} couleur="var(--chart-5)">
          <div>
            <Label htmlFor="competences">Compétences</Label>
            <TagInput
              id="competences"
              className="mt-1.5"
              value={form.watch("competences")}
              onChange={(next) => form.setValue("competences", next, { shouldDirty: true })}
              placeholder="React, gestion de projet, comptabilité…"
            />
          </div>
          <div>
            <Label htmlFor="langues">Langues</Label>
            <TagInput
              id="langues"
              className="mt-1.5"
              max={30}
              value={form.watch("langues")}
              onChange={(next) => form.setValue("langues", next, { shouldDirty: true })}
              placeholder="Français, wolof, anglais…"
            />
          </div>
          <div>
            <Label htmlFor="certifications">Certifications</Label>
            <TagInput
              id="certifications"
              className="mt-1.5"
              value={form.watch("certifications")}
              onChange={(next) =>
                form.setValue("certifications", next, { shouldDirty: true })
              }
            />
          </div>
          <div>
            <Label htmlFor="interets">Centres d&apos;intérêt</Label>
            <TagInput
              id="interets"
              className="mt-1.5"
              value={form.watch("interets")}
              onChange={(next) => form.setValue("interets", next, { shouldDirty: true })}
            />
          </div>
        </Section>
        </EtapeVisible>

        <EtapeVisible actif={etape === 2}>
        <Section
          title="Expériences professionnelles"
          icon={Briefcase}
          couleur="var(--chart-3)"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                experiences.append({
                  poste: "",
                  entreprise: "",
                  ville: "",
                  dateDebut: "",
                  dateFin: "",
                  enCours: false,
                  description: "",
                })
              }
            >
              <Plus className="size-4" />
              Ajouter
            </Button>
          }
        >
          {experiences.fields.length === 0 ? (
            <p className="dashed-frame py-10 text-center text-sm text-muted-foreground">
              Aucune expérience renseignée. Commencez par la plus récente.
            </p>
          ) : (
            <ol className="relative">
            {experiences.fields.map((field, index) => (
              <EntreeFrise
                key={field.id}
                dernier={index === experiences.fields.length - 1}
                icon={Briefcase}
                couleur="var(--chart-3)"
                actif={form.watch(`experiences.${index}.enCours`)}
                titre={
                  form.watch(`experiences.${index}.poste`) ||
                  `Expérience ${index + 1}`
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Poste"
                    aria-label="Poste"
                    {...form.register(`experiences.${index}.poste`)}
                  />
                  <Input
                    placeholder="Entreprise"
                    aria-label="Entreprise"
                    {...form.register(`experiences.${index}.entreprise`)}
                  />
                  <Input
                    placeholder="Ville"
                    aria-label="Ville"
                    {...form.register(`experiences.${index}.ville`)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      aria-label="Date de début"
                      {...form.register(`experiences.${index}.dateDebut`)}
                    />
                    <Input
                      type="date"
                      aria-label="Date de fin"
                      disabled={form.watch(`experiences.${index}.enCours`)}
                      {...form.register(`experiences.${index}.dateFin`)}
                    />
                  </div>
                </div>
                <Textarea
                  rows={3}
                  placeholder="Missions et réalisations"
                  aria-label="Description"
                  className="mt-3"
                  {...form.register(`experiences.${index}.description`)}
                />
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.watch(`experiences.${index}.enCours`)}
                      onCheckedChange={(checked) =>
                        form.setValue(`experiences.${index}.enCours`, Boolean(checked), {
                          shouldDirty: true,
                        })
                      }
                    />
                    Poste actuel
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => experiences.remove(index)}
                  >
                    <Trash2 className="size-4" />
                    Retirer
                  </Button>
                </div>
              </EntreeFrise>
            ))}
            </ol>
          )}
        </Section>
        </EtapeVisible>

        <EtapeVisible actif={etape === 3}>
        <Section
          title="Formations"
          icon={GraduationCap}
          couleur="var(--chart-4)"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                formations.append({
                  diplome: "",
                  etablissement: "",
                  ville: "",
                  dateDebut: "",
                  dateFin: "",
                  enCours: false,
                  description: "",
                })
              }
            >
              <Plus className="size-4" />
              Ajouter
            </Button>
          }
        >
          {formations.fields.length === 0 ? (
            <p className="dashed-frame py-10 text-center text-sm text-muted-foreground">
              Aucune formation renseignée. Commencez par la plus récente.
            </p>
          ) : (
            <ol className="relative">
            {formations.fields.map((field, index) => (
              <EntreeFrise
                key={field.id}
                dernier={index === formations.fields.length - 1}
                icon={GraduationCap}
                couleur="var(--chart-4)"
                actif={form.watch(`formations.${index}.enCours`)}
                titre={
                  form.watch(`formations.${index}.diplome`) ||
                  `Formation ${index + 1}`
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Diplôme"
                    aria-label="Diplôme"
                    {...form.register(`formations.${index}.diplome`)}
                  />
                  <Input
                    placeholder="Établissement"
                    aria-label="Établissement"
                    {...form.register(`formations.${index}.etablissement`)}
                  />
                  <Input
                    placeholder="Ville"
                    aria-label="Ville"
                    {...form.register(`formations.${index}.ville`)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      aria-label="Date de début"
                      {...form.register(`formations.${index}.dateDebut`)}
                    />
                    <Input
                      type="date"
                      aria-label="Date de fin"
                      disabled={form.watch(`formations.${index}.enCours`)}
                      {...form.register(`formations.${index}.dateFin`)}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.watch(`formations.${index}.enCours`)}
                      onCheckedChange={(checked) =>
                        form.setValue(`formations.${index}.enCours`, Boolean(checked), {
                          shouldDirty: true,
                        })
                      }
                    />
                    En cours
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => formations.remove(index)}
                  >
                    <Trash2 className="size-4" />
                    Retirer
                  </Button>
                </div>
              </EntreeFrise>
            ))}
            </ol>
          )}
        </Section>
        </EtapeVisible>

        <EtapeVisible actif={etape === 4}>
        <Section
          title="Autres rubriques"
          description="Publications, projets, bénévolat, distinctions — tout ce qui ne rentre pas dans les sections précédentes."
          icon={Layers}
          couleur="var(--chart-1)"
        >
          <RubriquesLibres
            valeur={form.watch("rubriques")}
            onChange={(suivant) =>
              form.setValue("rubriques", suivant, { shouldDirty: true })
            }
          />
        </Section>
        </EtapeVisible>

        <EtapeVisible actif={etape === 5}>
        <Section title="Visibilité" icon={Eye} couleur="var(--chart-1)">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="estPublic" className="text-sm">
                Rendre mon CV visible
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Les recruteurs partenaires pourront le consulter.
              </p>
            </div>
            <Switch
              id="estPublic"
              checked={form.watch("estPublic")}
              onCheckedChange={(checked) =>
                form.setValue("estPublic", checked, { shouldDirty: true })
              }
            />
          </div>
        </Section>
        </EtapeVisible>

        {/* Barre collante : navigation entre étapes à gauche, enregistrement à
            droite. L'enregistrement reste accessible à chaque étape — un CV se
            remplit en plusieurs fois, obliger à parcourir toutes les étapes
            avant de pouvoir sauvegarder ferait perdre le travail commencé. */}
        <div className="sticky bottom-16 z-10 flex flex-wrap items-center gap-2 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur lg:bottom-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={etape === 0}
            onClick={() => {
              setEtape((e) => Math.max(0, e - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <ChevronLeft className="size-4" />
            Précédent
          </Button>

          {etape < ETAPES_CV.length - 1 ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setEtape((e) => Math.min(ETAPES_CV.length - 1, e + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Suivant
              <ChevronRight className="size-4" />
            </Button>
          ) : null}

          {form.formState.isDirty ? (
            <p className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <span className="size-2 rounded-full bg-amber-500" aria-hidden />
              Non enregistré
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="ml-auto rounded-xl"
            disabled={save.isPending}
          >
            {save.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Enregistrer le CV
          </Button>
        </div>
      </form>

      {/* Détail des corrections appliquées par l'IA */}
      <Dialog open={corrections.length > 0} onOpenChange={() => setCorrections([])}>
        <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Améliorations appliquées
            </DialogTitle>
            <DialogDescription>
              Relisez les reformulations avant d&apos;enregistrer.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {corrections.map((c, i) => (
              <li key={i} className="rounded-md border p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {c.field}
                </p>
                <p className="mt-1.5 text-muted-foreground line-through">{c.original}</p>
                <p className="mt-1">{c.corrected}</p>
                {c.reason ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">{c.reason}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
      <RevueImport
        donnees={apercu}
        onAnnuler={() => setApercu(null)}
        onAppliquer={appliquerImport}
      />
    </FormShell>
  );
}
