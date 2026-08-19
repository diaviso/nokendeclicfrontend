"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  EmojiPicker,
  insererAuCurseur,
} from "@/components/shared/emoji-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, feedbackApi } from "@/lib/api";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_BADGE,
  FEEDBACK_STATUS_LABELS,
} from "@/lib/enums";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FeedbackCategory } from "@/lib/types";

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
  const { data, isLoading } = useQuery({
    queryKey: ["feedback", "mine"],
    queryFn: feedbackApi.mine,
  });

  const feedbacks = data ?? [];

  return (
    <>
      <PageHeader
        title="Signalements"
        surtitre="Mon compte"
        icon={MessageCircle}
        couleur="var(--chart-1)"
        description="Vos anomalies, suggestions et questions adressées à l'équipe. Chacune reçoit une réponse."
        actions={<NewFeedbackDialog />}
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
          couleur="var(--chart-1)"
          title="Aucun signalement"
          description="Une offre erronée, un bug, une idée d'amélioration ? Dites-le à l'équipe : chaque message est lu et reçoit une réponse."
          action={<NewFeedbackDialog />}
        />
      ) : (
        <ul className="space-y-3">
          {feedbacks.map((feedback, index) => (
            <li key={feedback.id} style={{ "--i": index } as React.CSSProperties}>
              <Link
                href={`/feedback/${feedback.id}`}
                className="entree block rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn("h-6 rounded-full px-2.5 text-[11px] font-semibold", FEEDBACK_STATUS_BADGE[feedback.statut])}
                  >
                    {FEEDBACK_STATUS_LABELS[feedback.statut]}
                  </Badge>
                  <Badge variant="secondary" className="h-6 rounded-full px-2.5 text-[11px]">
                    {FEEDBACK_CATEGORY_LABELS[feedback.categorie]}
                  </Badge>
                  {feedback.reponses?.length ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {feedback.reponses.length} réponse
                      {feedback.reponses.length > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2.5 text-base font-bold">{feedback.titre}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {feedback.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatRelative(feedback.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
