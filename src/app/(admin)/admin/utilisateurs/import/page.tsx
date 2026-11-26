"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  MailCheck,
  RotateCcw,
  Send,
  ShieldCheck,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsolePastille } from "@/components/admin/console-ui";
import { ConsoleChiffre, ConsolePanneau } from "@/components/admin/console-kit";
import {
  errorMessage,
  importUtilisateursApi,
  telechargerFichier,
  type LigneImport,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const TEINTE = "var(--c-blue)";

const ETAPES = [
  { numero: 1, libelle: "Déposer", detail: "Le fichier Excel" },
  { numero: 2, libelle: "Vérifier", detail: "Les lignes lues" },
  { numero: 3, libelle: "Résultat", detail: "Comptes créés" },
] as const;

/** Fil d'étapes : où en est l'import, sans rien cacher des étapes suivantes. */
function FilEtapes({ courante }: { courante: 1 | 2 | 3 }) {
  return (
    <ol className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border bg-card p-2 shadow-sm">
      {ETAPES.map((etape) => {
        const faite = etape.numero < courante;
        const active = etape.numero === courante;
        return (
          <li
            key={etape.numero}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
              active && "bg-[color-mix(in_oklch,var(--c-blue)_9%,transparent)]",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                faite && "bg-[var(--success)] text-white",
                active && "bg-[var(--c-blue)] text-white",
                !faite && !active && "bg-muted text-muted-foreground",
              )}
            >
              {faite ? <Check className="size-4" /> : etape.numero}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block truncate text-sm font-semibold",
                  !active && !faite && "text-muted-foreground",
                )}
              >
                {etape.libelle}
              </span>
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                {etape.detail}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function EtatLigne({ ligne }: { ligne: LigneImport }) {
  if (ligne.etat === "erreur") {
    return <ConsolePastille libelle="Écartée" teinte="var(--destructive)" />;
  }
  if (ligne.etat === "deja_inscrit") {
    return <ConsolePastille libelle="Déjà inscrit" discret />;
  }
  return <ConsolePastille libelle="À créer" teinte="var(--c-emerald)" />;
}

export default function ImportUtilisateursPage() {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [inviter, setInviter] = useState(true);
  const [informees, setInformees] = useState(false);
  const [survol, setSurvol] = useState(false);
  // Bilan du dernier import confirmé : affiché à l'étape 3, jusqu'au suivant.
  const [termine, setTermine] = useState<{
    crees: number;
    dejaInscrits: number;
    erreurs: number;
    invitations: boolean;
    fichier: string;
  } | null>(null);

  const { data: bilan } = useQuery({
    queryKey: ["admin", "import-utilisateurs", "bilan"],
    queryFn: () => importUtilisateursApi.bilan(),
    refetchInterval: (r) => (r.state.data?.envoiEnCours ? 8000 : false),
  });

  const analyse = useMutation({
    mutationFn: (f: File) => importUtilisateursApi.analyser(f),
    onError: (erreur) =>
      toast.error("Lecture impossible", { description: errorMessage(erreur) }),
  });

  const confirmation = useMutation({
    mutationFn: () => importUtilisateursApi.confirmer(fichier!, inviter),
    onSuccess: async (resultat) => {
      setTermine({
        crees: resultat.crees,
        dejaInscrits: resultat.dejaInscrits,
        erreurs: resultat.erreurs,
        invitations: inviter,
        fichier: fichier?.name ?? "",
      });
      setFichier(null);
      setInformees(false);
      analyse.reset();
      await queryClient.invalidateQueries({ queryKey: ["admin", "import-utilisateurs"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`${formatNumber(resultat.crees)} compte(s) créé(s)`, {
        description: inviter
          ? "Les invitations partent progressivement, dans la limite du quota du jour."
          : "Aucune invitation envoyée : vous pourrez les lancer depuis cette page.",
      });
    },
    onError: (erreur) =>
      toast.error("Import impossible", { description: errorMessage(erreur) }),
  });

  const relance = useMutation({
    mutationFn: () => importUtilisateursApi.relancer(),
    onSuccess: async ({ aInviter, quotaEmails }) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "import-utilisateurs"] });
      toast.success(`${formatNumber(aInviter)} invitation(s) à envoyer`, {
        description: `Encore ${formatNumber(quotaEmails)} e-mail(s) possible(s) aujourd'hui. Le reste pourra être relancé demain.`,
      });
    },
    onError: (erreur) =>
      toast.error("Relance impossible", { description: errorMessage(erreur) }),
  });

  async function telechargerModele() {
    try {
      telechargerFichier(
        await importUtilisateursApi.modele(),
        "noken-modele-import-utilisateurs.xlsx",
      );
    } catch (erreur) {
      toast.error("Téléchargement impossible", { description: errorMessage(erreur) });
    }
  }

  function choisir(f?: File) {
    if (!f) return;
    setFichier(f);
    setInformees(false);
    setTermine(null);
    analyse.mutate(f);
  }

  function recommencer() {
    setFichier(null);
    setInformees(false);
    setTermine(null);
    analyse.reset();
  }

  const resultat = analyse.data;
  const nouveaux = resultat?.resume.nouveaux ?? 0;
  const etape: 1 | 2 | 3 = termine ? 3 : resultat ? 2 : 1;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 rounded-lg text-muted-foreground"
        render={<Link href="/admin/utilisateurs" />}
      >
        <ArrowLeft className="size-4" />
        Utilisateurs
      </Button>

      <ConsoleHeader
        title="Importer des utilisateurs"
        icon={FileSpreadsheet}
        teinte={TEINTE}
        description="Pour ajouter des personnes recensées hors de la plateforme. Chaque compte reste inactif jusqu'à ce que la personne l'active depuis son invitation et accepte les conditions d'utilisation."
        mesures={
          bilan
            ? [
                { label: "importés", valeur: bilan.importes, teinte: TEINTE },
                { label: "activés", valeur: bilan.actives, teinte: "var(--success)" },
                { label: "en attente", valeur: bilan.enAttente },
              ]
            : undefined
        }
        actions={
          <Button variant="outline" className="rounded-xl" onClick={() => void telechargerModele()}>
            <Download className="size-4" />
            Télécharger le modèle
          </Button>
        }
      />

      {bilan && bilan.enAttente > 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[color-mix(in_oklch,var(--c-amber)_30%,transparent)] bg-[color-mix(in_oklch,var(--c-amber)_7%,var(--card))] px-4 py-3 text-sm shadow-sm">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_oklch,var(--c-amber)_16%,transparent)] text-[var(--c-amber)]">
            <MailCheck className="size-4.5" aria-hidden />
          </span>
          <p className="min-w-0 flex-1">
            <span className="font-semibold">
              {formatNumber(bilan.enAttente)} compte(s) en attente d&apos;activation
            </span>
            <span className="text-muted-foreground">
              , dont {formatNumber(bilan.sansInvitation)} sans invitation.{" "}
              {bilan.envoiEnCours ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Envoi en cours…
                </span>
              ) : (
                `Encore ${formatNumber(bilan.quotaEmails)} e-mail(s) possible(s) aujourd'hui.`
              )}
            </span>
          </p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            disabled={relance.isPending || bilan.envoiEnCours || bilan.quotaEmails === 0}
            onClick={() => relance.mutate()}
          >
            {relance.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Envoyer les invitations
          </Button>
        </div>
      ) : null}

      <FilEtapes courante={etape} />

      {/* ------------------------------------------------- 1. Déposer */}
      <ConsolePanneau
        titre="1. Déposer le fichier"
        description="Utilisez le modèle fourni : une personne par ligne, avec au moins son prénom, son nom et son e-mail."
        icone={Upload}
        teinte={TEINTE}
        className="mb-4"
        actions={
          fichier || termine ? (
            <Button variant="ghost" size="sm" className="rounded-lg" onClick={recommencer}>
              <RotateCcw className="size-4" />
              Recommencer
            </Button>
          ) : undefined
        }
      >
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSurvol(false);
            choisir(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "grid w-full place-items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors hover:border-[var(--c-blue)] hover:bg-[color-mix(in_oklch,var(--c-blue)_5%,transparent)]",
            survol && "border-[var(--c-blue)] bg-[color-mix(in_oklch,var(--c-blue)_8%,transparent)]",
          )}
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_oklch,var(--c-blue)_12%,transparent)] text-[var(--c-blue)]">
            {analyse.isPending ? (
              <Loader2 className="size-6 animate-spin" />
            ) : fichier ? (
              <FileSpreadsheet className="size-6" aria-hidden />
            ) : (
              <Upload className="size-6" aria-hidden />
            )}
          </span>
          <span className="text-sm font-semibold">
            {analyse.isPending
              ? "Lecture du fichier…"
              : fichier
                ? fichier.name
                : "Glissez le fichier Excel ici, ou cliquez pour le choisir"}
          </span>
          <span className="text-xs text-muted-foreground">
            {fichier
              ? `${formatNumber(Math.round(fichier.size / 1024))} Ko · cliquez pour choisir un autre fichier`
              : "Format .xlsx, 5 Mo et 5 000 lignes au maximum. Rien n'est créé à cette étape."}
          </span>
        </button>
        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(e) => {
            choisir(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </ConsolePanneau>

      {/* ------------------------------------------------ 2. Vérifier */}
      {resultat ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ConsoleChiffre
              libelle="Comptes à créer"
              valeur={formatNumber(nouveaux)}
              icone={UserPlus}
              teinte="var(--c-emerald)"
              note={`sur ${formatNumber(resultat.resume.total)} ligne(s)`}
            />
            <ConsoleChiffre
              libelle="Déjà inscrits (ignorés)"
              valeur={formatNumber(resultat.resume.dejaInscrits)}
              icone={UserCheck}
              teinte="var(--c-sky)"
            />
            <ConsoleChiffre
              libelle="Lignes en erreur (écartées)"
              valeur={formatNumber(resultat.resume.erreurs)}
              icone={XCircle}
              teinte={resultat.resume.erreurs ? "var(--destructive)" : "var(--muted-foreground)"}
            />
            <ConsoleChiffre
              libelle="Avec avertissement"
              valeur={formatNumber(resultat.resume.avertissements)}
              icone={AlertTriangle}
              teinte="var(--c-amber)"
            />
          </div>

          {resultat.problemes.length ? (
            <ConsolePanneau
              titre="Lignes à vérifier"
              description="Les lignes en erreur ne seront pas importées ; corrigez le fichier puis déposez-le à nouveau si besoin."
              icone={AlertTriangle}
              teinte="var(--c-amber)"
            >
              <ul className="max-h-80 divide-y overflow-y-auto text-sm">
                {resultat.problemes.map((l: LigneImport) => (
                  <li key={l.ligne} className="flex items-start gap-3 py-2.5">
                    <span className="mt-0.5 shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                      L{l.ligne}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {[l.prenom, l.nom].filter(Boolean).join(" ") || l.email || "sans nom"}
                      </p>
                      {l.erreurs.length ? (
                        <p className="text-xs text-destructive">Écartée : {l.erreurs.join(", ")}</p>
                      ) : null}
                      {l.avertissements.length ? (
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          {l.avertissements.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <EtatLigne ligne={l} />
                  </li>
                ))}
              </ul>
            </ConsolePanneau>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 text-sm text-[var(--success)] shadow-sm">
              <CheckCircle2 className="size-4" aria-hidden />
              Aucune ligne à corriger : le fichier est propre.
            </div>
          )}

          {resultat.apercu.length ? (
            <ConsolePanneau
              titre="Aperçu des premières lignes"
              icone={Eye}
              teinte="var(--c-indigo)"
              corpsClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Ligne</th>
                      <th className="px-4 py-2 font-medium">Nom</th>
                      <th className="px-4 py-2 font-medium">E-mail</th>
                      <th className="hidden px-4 py-2 font-medium md:table-cell">Téléphone</th>
                      <th className="hidden px-4 py-2 font-medium lg:table-cell">Localisation</th>
                      <th className="px-4 py-2 text-right font-medium">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {resultat.apercu.map((l) => (
                      <tr key={l.ligne}>
                        <td className="px-4 py-2 font-mono text-xs tabular-nums text-muted-foreground">
                          {l.ligne}
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {[l.prenom, l.nom].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td className="max-w-56 truncate px-4 py-2 text-muted-foreground">
                          {l.email || "—"}
                        </td>
                        <td className="hidden px-4 py-2 text-muted-foreground md:table-cell">
                          {l.telephone || "—"}
                        </td>
                        <td className="hidden px-4 py-2 text-muted-foreground lg:table-cell">
                          {[l.departement, l.region].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <EtatLigne ligne={l} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ConsolePanneau>
          ) : null}

          {nouveaux > 0 ? (
            <ConsolePanneau
              titre="2. Confirmer la création"
              description="Dernière étape : les comptes sont créés en une fois, inactifs jusqu'à leur activation."
              icone={ShieldCheck}
              teinte="var(--c-emerald)"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border p-3">
                  <Switch id="import-inviter" checked={inviter} onCheckedChange={setInviter} />
                  <div className="min-w-0">
                    <label htmlFor="import-inviter" className="text-sm font-medium">
                      Envoyer les invitations par e-mail
                    </label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Encore {formatNumber(resultat.quotaEmails)} e-mail(s) possible(s) aujourd&apos;hui.
                      {nouveaux > resultat.quotaEmails
                        ? " Les suivantes seront à relancer depuis cette page les jours d'après."
                        : ""}
                    </p>
                  </div>
                </div>
                <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                  <Checkbox
                    checked={informees}
                    onCheckedChange={(v) => setInformees(Boolean(v))}
                    className="mt-0.5"
                  />
                  <span>
                    Je confirme que ces personnes ont été informées de leur inscription
                    sur Noken.
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                  <Button
                    className="rounded-xl"
                    disabled={!informees || confirmation.isPending}
                    onClick={() => confirmation.mutate()}
                  >
                    {confirmation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-4" />
                    )}
                    Créer {formatNumber(nouveaux)} compte(s)
                  </Button>
                  {!informees ? (
                    <p className="text-xs text-muted-foreground">
                      Cochez la confirmation pour continuer.
                    </p>
                  ) : null}
                </div>
              </div>
            </ConsolePanneau>
          ) : (
            <div className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              Aucun compte nouveau à créer dans ce fichier.
            </div>
          )}
        </div>
      ) : null}

      {/* ------------------------------------------------ 3. Résultat */}
      {termine ? (
        <ConsolePanneau
          titre="3. Import terminé"
          description={termine.fichier ? `Fichier « ${termine.fichier} »` : undefined}
          icone={CheckCircle2}
          teinte="var(--success)"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <ConsoleChiffre
              libelle="Comptes créés"
              valeur={formatNumber(termine.crees)}
              icone={UserPlus}
              teinte="var(--c-emerald)"
            />
            <ConsoleChiffre
              libelle="Déjà inscrits"
              valeur={formatNumber(termine.dejaInscrits)}
              icone={UserCheck}
              teinte="var(--c-sky)"
            />
            <ConsoleChiffre
              libelle="Lignes écartées"
              valeur={formatNumber(termine.erreurs)}
              icone={XCircle}
              teinte="var(--muted-foreground)"
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {termine.invitations
              ? "Les invitations partent progressivement, dans la limite du quota du jour. Le bandeau ci-dessus permet de relancer celles qui restent."
              : "Aucune invitation envoyée : lancez-les depuis le bandeau ci-dessus quand vous le souhaitez."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="rounded-xl" render={<Link href="/admin/utilisateurs" />}>
              <Users className="size-4" />
              Voir les utilisateurs
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={recommencer}>
              <Upload className="size-4" />
              Importer un autre fichier
            </Button>
          </div>
        </ConsolePanneau>
      ) : null}
    </>
  );
}
