"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import {
  Bug,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageCircle,
  MessagesSquare,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import {
  ConsoleFiltre,
  ConsolePastille,
  type OptionFiltre,
} from "@/components/admin/console-ui";
import { EmptyState } from "@/components/shared/empty-state";
import {
  EmojiPicker,
  insererAuCurseur,
} from "@/components/shared/emoji-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, feedbackApi } from "@/lib/api";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
} from "@/lib/enums";
import { formatRelative } from "@/lib/format";
import type { FeedbackCategory, FeedbackStatus } from "@/lib/types";

/** Teinte de chaque état : la même pastille que dans la console. */
const TEINTE_STATUT_FEEDBACK: Record<FeedbackStatus, string | undefined> = {
  OUVERT: "var(--c-blue)",
  EN_COURS: "var(--c-orange)",
  RESOLU: "var(--c-emerald)",
  FERME: undefined,
};

const CATEGORIES: Record<FeedbackCategory, { icone: LucideIcon; teinte: string }> = {
  BUG: { icone: Bug, teinte: "var(--c-rose)" },
  AMELIORATION: { icone: Lightbulb, teinte: "var(--c-amber)" },
  QUESTION: { icone: HelpCircle, teinte: "var(--c-violet)" },
  AUTRE: { icone: MessageCircle, teinte: "var(--c-sky)" },
};

type Filtre = "" | "actifs" | "RESOLU" | "FERME";

const schema = z.object({
  titre: z.string().trim().min(4, "Au moins 4 caractères").max(150),
  description: z.string().trim().min(10, "Décrivez en quelques mots").max(4000),
  categorie: z.enum(
    Object.keys(FEEDBACK_CATEGORY_LABELS) as [FeedbackCategory, ...FeedbackCategory[]],
  ),
});

type FormInput = z.infer<typeof schema>;

function NewFeedbackDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const champDescription = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { titre: "", description: "", categorie: "BUG" },
  });

  const { ref: refDescription, ...champsDescription } =
    form.register("description");

  const create = useMutation({
    mutationFn: (values: FormInput) =>
      feedbackApi.create({
        ...values,
        // Le contexte de la page aide au diagnostic côté équipe.
        pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Signalement envoyé", {
        description: "L'équipe vous répondra dans cet espace.",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error) =>
      toast.error("Envoi impossible", { description: errorMessage(error) }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Nouveau signalement
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau signalement</DialogTitle>
          <DialogDescription>
            Anomalie, suggestion ou question — décrivez ce que vous avez observé.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => create.mutate(values))}
          className="space-y-4"
          noValidate
        >
          <div>
            <Label htmlFor="categorie">Catégorie</Label>
            <select
              id="categorie"
              className="mt-1.5 h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              {...form.register("categorie")}
            >
              {(Object.keys(FEEDBACK_CATEGORY_LABELS) as FeedbackCategory[]).map((c) => (
                <option key={c} value={c}>
                  {FEEDBACK_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="titre">Titre</Label>
            <Input id="titre" className="mt-1.5" {...form.register("titre")} />
            {form.formState.errors.titre ? (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {form.formState.errors.titre.message}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              className="mt-1.5"
              placeholder="Ce que vous faisiez, ce que vous attendiez, ce qui s'est passé."
              {...champsDescription}
              // Les deux références doivent coexister : celle de
              // react-hook-form pilote la validation, la nôtre sert à placer
              // l'émoji à la position du curseur.
              ref={(element) => {
                refDescription(element);
                champDescription.current = element;
              }}
            />
            {form.formState.errors.description ? (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <EmojiPicker
              className="mr-auto"
              label="Insérer un émoji dans la description"
              onChoisir={(symbole) =>
                form.setValue(
                  "description",
                  insererAuCurseur(
                    champDescription.current,
                    form.getValues("description"),
                    symbole,
                  ),
                  { shouldDirty: true, shouldValidate: true },
                )
              }
            />
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Envoyer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FeedbackPage() {
  const [filtre, setFiltre] = useState<Filtre>("");
  const { data, isLoading } = useQuery({
    queryKey: ["feedback", "mine"],
    queryFn: feedbackApi.mine,
  });

  const feedbacks = data ?? [];
  const actifs = feedbacks.filter(
    (f) => f.statut === "OUVERT" || f.statut === "EN_COURS",
  ).length;
  const resolus = feedbacks.filter((f) => f.statut === "RESOLU").length;
  const fermes = feedbacks.filter((f) => f.statut === "FERME").length;
  const reponses = feedbacks.reduce((n, f) => n + (f.reponses?.length ?? 0), 0);

  const visibles = feedbacks.filter((f) =>
    filtre === ""
      ? true
      : filtre === "actifs"
        ? f.statut === "OUVERT" || f.statut === "EN_COURS"
        : f.statut === filtre,
  );

  const options: OptionFiltre<Filtre>[] = [
    { valeur: "", libelle: "Tous", compte: feedbacks.length },
    { valeur: "actifs", libelle: "En attente", compte: actifs, teinte: "var(--c-orange)" },
    { valeur: "RESOLU", libelle: "Résolus", compte: resolus, teinte: "var(--c-emerald)" },
    { valeur: "FERME", libelle: "Fermés", compte: fermes },
  ];

  return (
    <>
      <PageHeader
        title="Signalements"
        surtitre="Mon compte"
        icon={MessageCircle}
        description="Vos anomalies, suggestions et questions adressées à l'équipe. Chacune reçoit une réponse."
        actions={<NewFeedbackDialog />}
        mesures={
          feedbacks.length
            ? [
                { label: "Signalements", valeur: feedbacks.length },
                { label: "En attente", valeur: actifs, teinte: "var(--c-orange)" },
                { label: "Résolus", valeur: resolus, teinte: "var(--c-emerald)" },
                { label: "Réponses reçues", valeur: reponses, teinte: "var(--c-sky)" },
              ]
            : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-5">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="mt-3 h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          couleur="var(--c-orange)"
          title="Aucun signalement"
          description="Une offre erronée, un bug, une idée d'amélioration ? Dites-le à l'équipe : chaque message est lu et reçoit une réponse."
          action={<NewFeedbackDialog />}
        />
      ) : (
        <>
          <ConsoleFiltre
            options={options}
            valeur={filtre}
            onChange={setFiltre}
            label="Filtrer par état"
            className="mb-4 w-fit max-w-full"
          />

          {visibles.length === 0 ? (
            <p className="dashed-frame py-10 text-center text-sm text-muted-foreground">
              Aucun signalement dans cet état.
            </p>
          ) : (
            <ul className="space-y-3">
              {visibles.map((feedback, index) => {
                const categorie = CATEGORIES[feedback.categorie] ?? CATEGORIES.AUTRE;
                const Icone = categorie.icone;
                const nbReponses = feedback.reponses?.length ?? 0;

                return (
                  <li key={feedback.id} style={{ "--i": index } as React.CSSProperties}>
                    <Link
                      href={`/feedback/${feedback.id}`}
                      className="entree group flex items-start gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                    >
                      <span
                        className="grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: `color-mix(in oklch, ${categorie.teinte} 15%, transparent)`,
                          color: categorie.teinte,
                        }}
                      >
                        <Icone className="size-5" aria-hidden />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ConsolePastille
                            libelle={FEEDBACK_STATUS_LABELS[feedback.statut]}
                            teinte={TEINTE_STATUT_FEEDBACK[feedback.statut]}
                          />
                          <span className="text-xs font-medium text-muted-foreground">
                            {FEEDBACK_CATEGORY_LABELS[feedback.categorie]}
                          </span>
                        </div>

                        <p className="mt-2 text-base font-bold leading-snug">{feedback.titre}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {feedback.description}
                        </p>
                        <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{formatRelative(feedback.createdAt)}</span>
                          {nbReponses ? (
                            <span
                              className="inline-flex items-center gap-1 font-semibold"
                              style={{ color: "var(--c-sky)" }}
                            >
                              <MessagesSquare className="size-3.5" aria-hidden />
                              {nbReponses} réponse{nbReponses > 1 ? "s" : ""}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <ChevronRight
                        className="mt-3 size-5 shrink-0 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}
