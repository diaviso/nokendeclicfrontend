"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Send,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ConsoleHeader } from "@/components/admin/console-header";
import {
  errorMessage,
  importUtilisateursApi,
  telechargerFichier,
  type LigneImport,
} from "@/lib/api";
import { formatNumber } from "@/lib/format";

const TEINTE = "var(--chart-2)";

function Tuile({ libelle, valeur, ton }: { libelle: string; valeur: number; ton?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className={`text-2xl font-bold tabular-nums ${ton ?? ""}`}>{formatNumber(valeur)}</p>
      <p className="text-xs text-muted-foreground">{libelle}</p>
    </div>
  );
}

export default function ImportUtilisateursPage() {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [inviter, setInviter] = useState(true);
  const [informees, setInformees] = useState(false);

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
    analyse.mutate(f);
  }

  const resultat = analyse.data;
  const nouveaux = resultat?.resume.nouveaux ?? 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 rounded-lg"
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
          <p className="min-w-0">
            <span className="font-medium">
              {formatNumber(bilan.enAttente)} compte(s) en attente d&apos;activation
            </span>
            <span className="text-muted-foreground">
              , dont {formatNumber(bilan.sansInvitation)} sans invitation.{" "}
              {bilan.envoiEnCours ? "Envoi en cours…" : `Encore ${formatNumber(bilan.quotaEmails)} e-mail(s) possible(s) aujourd'hui.`}
            </span>
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={relance.isPending || bilan.envoiEnCours || bilan.quotaEmails === 0}
            onClick={() => relance.mutate()}
          >
            <Send className="size-4" />
            Envoyer les invitations
          </Button>
        </div>
      ) : null}

      <section className="mb-4 rounded-2xl border bg-card p-4">
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            choisir(e.dataTransfer.files?.[0]);
          }}
          className="grid w-full place-items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition hover:bg-muted/60"
        >
          {analyse.isPending ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-6 text-muted-foreground" aria-hidden />
          )}
          <span className="text-sm font-medium">
            {fichier ? fichier.name : "Glissez le fichier Excel ici, ou cliquez pour le choisir"}
          </span>
          <span className="text-xs text-muted-foreground">
            Format .xlsx, 5 Mo et 5 000 lignes au maximum. Rien n&apos;est créé à cette étape.
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
      </section>

      {resultat ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tuile libelle="Comptes à créer" valeur={nouveaux} ton="text-emerald-600 dark:text-emerald-400" />
            <Tuile libelle="Déjà inscrits (ignorés)" valeur={resultat.resume.dejaInscrits} />
            <Tuile libelle="Lignes en erreur (écartées)" valeur={resultat.resume.erreurs} ton={resultat.resume.erreurs ? "text-destructive" : ""} />
            <Tuile libelle="Avec avertissement" valeur={resultat.resume.avertissements} />
          </div>

          {resultat.problemes.length ? (
            <section className="mb-4 rounded-2xl border bg-card p-4">
              <h2 className="mb-2 text-sm font-semibold">Lignes à vérifier</h2>
              <ul className="max-h-72 divide-y overflow-y-auto text-sm">
                {resultat.problemes.map((l: LigneImport) => (
                  <li key={l.ligne} className="py-2">
                    <span className="font-medium">
                      Ligne {l.ligne} · {[l.prenom, l.nom].filter(Boolean).join(" ") || l.email || "sans nom"}
                    </span>
                    {l.erreurs.length ? (
                      <p className="text-xs text-destructive">Écartée : {l.erreurs.join(", ")}</p>
                    ) : null}
                    {l.avertissements.length ? (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {l.avertissements.join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {nouveaux > 0 ? (
            <section className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex items-start gap-3">
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
              <label className="flex items-start gap-3 text-sm">
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
            </section>
          ) : null}
        </>
      ) : null}
    </>
  );
}
