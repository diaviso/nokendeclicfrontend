"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseCgu } from "@/components/legal/case-cgu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, errorMessage } from "@/lib/api";
import { AUTH_QUERY_KEY } from "@/hooks/use-auth";
import {
  loginSchema,
  passwordChecks,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/schemas/auth";
import { cn } from "@/lib/utils";

type Mode = "login" | "register" | "verify";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-destructive">
      {message}
    </p>
  );
}

function GoogleButton({ bloque }: { bloque?: string }) {
  const t = useTranslations("auth");
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      // Bloqué tant que les conditions ne sont pas acceptées : passer par
      // Google ne doit pas être un moyen de créer un compte sans consentir.
      disabled={Boolean(bloque)}
      title={bloque}
      onClick={() => {
        window.location.href = authApi.googleUrl();
      }}
    >
      <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14Z"
        />
      </svg>
      {t("continuerGoogle")}
    </Button>
  );
}

function PasswordField({
  id,
  label,
  register,
  error,
  value,
  showChecks,
  autoComplete,
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  value?: string;
  showChecks?: boolean;
  autoComplete?: string;
}) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  const checks = showChecks ? passwordChecks(value ?? "") : [];

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1.5">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className="pr-10"
          {...register}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("masquerMotDePasse") : t("afficherMotDePasse")}
          className="absolute right-0 top-0 grid h-9 w-10 place-items-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <FieldError message={error} />

      {showChecks && (value?.length ?? 0) > 0 ? (
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {checks.map((c) => (
            <li
              key={c.label}
              className={cn(
                "flex items-center gap-1 text-[11px]",
                c.ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            >
              {c.ok ? <Check className="size-3" /> : <X className="size-3" />}
              {c.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Saisie du code à 6 chiffres, avec avance automatique et collage. */
function CodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("auth");
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  function setDigit(index: number, digit: string) {
    const next = value.padEnd(6, " ").split("");
    next[index] = digit;
    onChange(next.join("").replace(/\s/g, ""));
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label={t("codeVerification")}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digit.trim()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Chiffre ${i + 1}`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            setDigit(i, v);
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digit.trim() && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (pasted) {
              onChange(pasted);
              refs.current[Math.min(pasted.length, 5)]?.focus();
            }
          }}
          className="h-12 w-full rounded-md border bg-background text-center text-lg font-semibold tabular-nums shadow-xs outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
        />
      ))}
    </div>
  );
}

function LoginPageInner() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get("next") ?? "/dashboard";

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      accepteCgu: false,
    },
  });

  // Observé plutôt que lu à la soumission : le bouton Google en dépend, et il
  // vit hors du formulaire.
  const cguAcceptee = registerForm.watch("accepteCgu");

  // Le mode est reflété dans l'URL : /login?mode=register est partageable.
  useEffect(() => {
    const wanted = searchParams.get("mode");
    if (wanted === "register" && mode === "login") setMode("register");
  }, [searchParams, mode]);

  async function onLogin(values: LoginInput) {
    setSubmitting(true);
    try {
      const result = await authApi.login(values.email, values.password);

      if (result.requiresVerification) {
        setPendingEmail(values.email);
        setMode("verify");
        toast.info(t("verificationRequise"), {
          description: t("codeEnvoye"),
        });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast.success(t("connexionReussie"));
      router.push(next);
    } catch (error) {
      toast.error(t("connexionImpossible"), {
        description: errorMessage(error, t("identifiantsIncorrects")),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function onRegister(values: RegisterInput) {
    setSubmitting(true);
    try {
      await authApi.register({
        email: values.email,
        password: values.password,
        username: values.email.split("@")[0],
        firstName: values.firstName,
        lastName: values.lastName,
        accepteCgu: values.accepteCgu,
      });
      setPendingEmail(values.email);
      setCode("");
      setMode("verify");
      toast.success(t("compteCree"), {
        description: t("codeEnvoye"),
      });
    } catch (error) {
      toast.error(t("inscriptionImpossible"), {
        description: errorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify() {
    if (code.length !== 6) return;
    setSubmitting(true);
    try {
      await authApi.verifyEmail(pendingEmail, code);
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast.success(t("adresseVerifiee"), { description: t("compteActive") });
      router.push(next);
    } catch (error) {
      toast.error(t("codeInvalide"), {
        description: errorMessage(error, t("codeIncorrect")),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    try {
      await authApi.resendCode(pendingEmail);
      toast.success(t("nouveauCode"));
    } catch (error) {
      toast.error(t("envoiImpossible"), { description: errorMessage(error) });
    }
  }

  /* ------------------------------------------------------------ Vérification */

  if (mode === "verify") {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("verifierTitre")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {t("verifierTexte")}{" "}
          <span className="font-medium text-foreground">{pendingEmail}</span>.
        </p>

        <form
          method="post"
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void onVerify();
          }}
        >
          <CodeInput value={code} onChange={setCode} disabled={submitting} />

          <Button
            type="submit"
            className="w-full"
            disabled={code.length !== 6 || submitting}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("verifier")}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onResend}
            className="text-primary hover:underline"
          >
            {t("renvoyerCode")}
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className="text-muted-foreground hover:text-foreground"
          >
            {t("retourConnexion")}
          </button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          {t("codeExpire")}
        </p>
      </div>
    );
  }

  /* -------------------------------------------------- Connexion / Inscription */

  return (
    <div>
      {/* Bascule à deux onglets */}
      <div
        role="tablist"
        aria-label={t("modeAuth")}
        className="mb-8 grid grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1"
      >
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              mode === m
                ? "bg-background shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "login" ? t("connexion") : t("inscription")}
          </button>
        ))}
      </div>

      {mode === "login" ? (
        <>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("bienvenue")}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {t("bienvenueTexte")}
          </p>

          {/*
            `method="post"` alors qu'aucune requête n'est jamais envoyée par le
            navigateur : tant que React n'a pas hydraté la page, aucun
            gestionnaire n'est attaché, et une soumission part nativement. Sans
            méthode déclarée, elle part en GET — le mot de passe se retrouve
            alors dans l'URL, l'historique du navigateur et les journaux du
            serveur. En POST, les champs passent par le corps : la soumission
            échoue toujours, mais sans laisser de trace. Le cas n'a rien de
            théorique sur une connexion lente, qui est la situation ordinaire
            du public visé.
          */}
          <form
            method="post"
            onSubmit={loginForm.handleSubmit(onLogin)}
            className="mt-7 space-y-4"
            noValidate
          >
            <div>
              <Label htmlFor="login-email">{t("email")}</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                className="mt-1.5"
                aria-invalid={Boolean(loginForm.formState.errors.email)}
                {...loginForm.register("email")}
              />
              <FieldError message={loginForm.formState.errors.email?.message} />
            </div>

            <PasswordField
              id="login-password"
              label={t("motDePasse")}
              autoComplete="current-password"
              register={loginForm.register("password")}
              error={loginForm.formState.errors.password?.message}
            />

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {t("motDePasseOublie")}
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("seConnecter")}
            </Button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold tracking-tight">{t("creerUnCompte")}</h1>
          <p className="mt-2 text-base text-muted-foreground">
            {t("creerTexte")}
          </p>

          <form
            method="post"
            onSubmit={registerForm.handleSubmit(onRegister)}
            className="mt-7 space-y-4"
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">{t("prenom")}</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  className="mt-1.5"
                  aria-invalid={Boolean(registerForm.formState.errors.firstName)}
                  {...registerForm.register("firstName")}
                />
                <FieldError
                  message={registerForm.formState.errors.firstName?.message}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  className="mt-1.5"
                  aria-invalid={Boolean(registerForm.formState.errors.lastName)}
                  {...registerForm.register("lastName")}
                />
                <FieldError
                  message={registerForm.formState.errors.lastName?.message}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="register-email">{t("email")}</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                className="mt-1.5"
                aria-invalid={Boolean(registerForm.formState.errors.email)}
                {...registerForm.register("email")}
              />
              <FieldError
                message={registerForm.formState.errors.email?.message}
              />
            </div>

            <PasswordField
              id="register-password"
              label={t("motDePasse")}
              autoComplete="new-password"
              showChecks
              value={registerForm.watch("password")}
              register={registerForm.register("password")}
              error={registerForm.formState.errors.password?.message}
            />

            <PasswordField
              id="confirm-password"
              label={t("confirmerMotDePasse")}
              autoComplete="new-password"
              register={registerForm.register("confirmPassword")}
              error={registerForm.formState.errors.confirmPassword?.message}
            />

            <CaseCgu
              coche={cguAcceptee}
              onChange={(valeur) =>
                registerForm.setValue("accepteCgu", valeur, {
                  shouldValidate: true,
                })
              }
              erreur={registerForm.formState.errors.accepteCgu?.message}
            />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("creerMonCompte")}
            </Button>
          </form>
        </>
      )}

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton
        bloque={
          mode === "register" && !cguAcceptee
            ? "Acceptez d'abord les conditions générales d'utilisation"
            : undefined
        }
      />
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams impose une frontière Suspense au prérendu.
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
