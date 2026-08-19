"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Loader2, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, errorMessage } from "@/lib/api";
import {
  passwordChecks,
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/schemas/auth";
import { cn } from "@/lib/utils";

function ResetPasswordInner() {
  const t = useTranslations("motdepasse");
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [state, setState] = useState<"checking" | "valid" | "invalid">(
    token ? "checking" : "invalid",
  );
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Le jeton est validé avant d'afficher le formulaire : inutile de faire
  // saisir un mot de passe pour découvrir ensuite que le lien a expiré.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi
      .validateResetToken(token)
      .then(() => !cancelled && setState("valid"))
      .catch(() => !cancelled && setState("invalid"));
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(values: ResetPasswordInput) {
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, values.password);
      toast.success(t("modifie"), {
        description: t("modifieTexte"),
      });
      router.push("/login");
    } catch (error) {
      toast.error(t("reinitImpossible"), {
        description: errorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "checking") {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">{t("verificationLien")}</span>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border bg-destructive/10">
          <ShieldAlert className="size-6 text-destructive" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">
          {t("lienInvalide")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {t("lienInvalideTexte")}
        </p>
        <Button className="mt-6 w-full" render={<Link href="/forgot-password" />}>
          {t("demanderLien")}
        </Button>
      </div>
    );
  }

  const password = form.watch("password");
  const checks = passwordChecks(password ?? "");

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("nouveauTitre")}</h1>
      <p className="mt-2 text-base text-muted-foreground">
        Choisissez un mot de passe robuste, différent des précédents.
      </p>

      <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        <div>
          <Label htmlFor="password">{t("motDePasse")}</Label>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              className="pr-10"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? t("masquer") : t("afficher")}
              className="absolute right-0 top-0 grid h-9 w-10 place-items-center text-muted-foreground hover:text-foreground"
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.password ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}

          {(password?.length ?? 0) > 0 ? (
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              {checks.map((c) => (
                <li
                  key={c.label}
                  className={cn(
                    "flex items-center gap-1 text-[11px]",
                    c.ok
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground",
                  )}
                >
                  {c.ok ? <Check className="size-3" /> : <X className="size-3" />}
                  {c.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t("confirmer")}</Label>
          <Input
            id="confirmPassword"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            className="mt-1.5"
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Enregistrer le nouveau mot de passe
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
