"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, errorMessage } from "@/lib/api";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/schemas/auth";

export default function ForgotPasswordPage() {
  const t = useTranslations("motdepasse");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setSubmitting(true);
    try {
      await authApi.forgotPassword(values.email);
      // Le backend répond de la même manière que l'adresse existe ou non, pour
      // ne pas permettre d'énumérer les comptes. L'interface fait de même.
      setSent(true);
    } catch (error) {
      toast.error(t("envoiImpossible"), { description: errorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border bg-primary/10">
          <MailCheck className="size-6 text-primary" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">
          {t("boiteTitre")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {t("boiteDebut")}{" "}
          <span className="font-medium text-foreground">
            {form.getValues("email")}
          </span>
          {t("boiteFin")}
        </p>
        <Button variant="outline" className="mt-6 w-full" render={<Link href="/login" />}>
          {t("retourConnexion")}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("oublieTitre")}</h1>
      <p className="mt-2 text-base text-muted-foreground">
        {t("oublieTexte")}
      </p>

      <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1.5"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("envoyerLien")}
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("retourConnexion")}
      </Link>
    </div>
  );
}
