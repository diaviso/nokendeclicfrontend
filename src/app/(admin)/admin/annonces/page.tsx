"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  Loader2,
  Mail,
  Megaphone,
  Send,
  Smartphone,
  Users,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import { ConsolePastille } from "@/components/admin/console-ui";
import { useDebounced } from "@/hooks/use-debounced";
import {
  annoncesApi,
  errorMessage,
  type Annonce,
  type FiltresAnnonce,
} from "@/lib/api";
import {
  ROLE_LABELS,
  SEXE_LABELS,
  STATUT_PROFESSIONNEL_LABELS,
} from "@/lib/enums";
import { formatDateTime, formatNumber } from "@/lib/format";
import { REGION_NAMES, departementsFor } from "@/lib/senegal";
import { cn } from "@/lib/utils";

const TEINTE = "var(--chart-2)";

const TRANCHES: Record<string, string> = {
  "0-17": "Moins de 18 ans",
  "18-25": "18–25 ans",
  "26-35": "26–35 ans",
  "36-45": "36–45 ans",
  "46-55": "46–55 ans",
  "56-65": "56–65 ans",
  "65+": "Plus de 65 ans",
  "Non précisé": "Âge non renseigné",
};

function GroupePastilles({
  titre,
  options,
  valeurs,
  onChange,
}: {
  titre: string;
  options: { valeur: string; libelle: string }[];
  valeurs: string[];
  onChange: (valeurs: string[]) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-sm font-medium">{titre}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map(({ valeur, libelle }) => {
          const actif = valeurs.includes(valeur);
          return (
            <button
              key={valeur}
              type="button"
              aria-pressed={actif}
              onClick={() =>
                onChange(
                  actif
                    ? valeurs.filter((v) => v !== valeur)
                    : [...valeurs, valeur],
                )
              }
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                actif
                  ? "border-transparent bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {libelle}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function AnnoncesPage() {
  const queryClient = useQueryClient();
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [lien, setLien] = useState("");
  const [avecEmail, setAvecEmail] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [departements, setDepartements] = useState<string[]>([]);
  const [statuts, setStatuts] = useState<string[]>([]);
  const [sexes, setSexes] = useState<string[]>([]);
  const [tranchesAge, setTranchesAge] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState(false);

  const filtres = useMemo<FiltresAnnonce>(
    () => ({ roles, regions, departements, statuts, sexes, tranchesAge }),
    [roles, regions, departements, statuts, sexes, tranchesAge],
  );
  const filtresDiffères = useDebounced(filtres, 250);

  const { data: apercu, isFetching: calcul } = useQuery({
    queryKey: ["admin", "annonces", "apercu", filtresDiffères],
    queryFn: () => annoncesApi.apercu(filtresDiffères),
    placeholderData: (precedent) => precedent,
  });

  const { data: historique = [], isLoading: chargement } = useQuery({
    queryKey: ["admin", "annonces"],
    queryFn: () => annoncesApi.historique(),
    // Les e-mails partent en arrière-plan : on suit leur progression.
    refetchInterval: (requete) =>
      requete.state.data?.some((a) => a.statut === "EN_COURS") ? 8000 : false,
  });

  const departementsPossibles = regions.flatMap((r) => departementsFor(r));

  const envoi = useMutation({
    mutationFn: () =>
      annoncesApi.envoyer({
        titre: titre.trim(),
        message: message.trim(),
        lien: lien.trim() || undefined,
        avecEmail,
        filtres,
      }),
    onSuccess: async (annonce) => {
      setConfirmation(false);
      setTitre("");
      setMessage("");
      setLien("");
      setAvecEmail(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "annonces"] });
      toast.success("Annonce envoyée", {
        description: `${formatNumber(annonce.destinataires)} personne(s) notifiée(s)${
          annonce.emailsPrevus
            ? `, ${formatNumber(annonce.emailsPrevus)} e-mail(s) en cours d'envoi`
            : ""
        }.`,
      });
    },
    onError: (erreur) => {
      setConfirmation(false);
      toast.error("Envoi impossible", { description: errorMessage(erreur) });
    },
  });

  const emails = apercu?.emails ?? 0;
  const quota = apercu?.quotaEmails ?? 0;
  const depasseQuota = avecEmail && emails > quota;
  const lienValide = !lien.trim() || /^(https:\/\/\S+|\/\S*)$/.test(lien.trim());
  const pret =
    titre.trim().length >= 3 &&
    message.trim().length >= 3 &&
    lienValide &&
    (apercu?.destinataires ?? 0) > 0;

  const colonnes: ColonneConsole<Annonce>[] = [
    {
      cle: "titre",
      entete: "Annonce",
      cellule: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{a.titre}</p>
          <p className="truncate text-xs text-muted-foreground">{a.message}</p>
        </div>
      ),
    },
    {
      cle: "date",
      entete: "Envoyée",
      secondaire: true,
      cellule: (a) => (
        <div className="text-sm">
          <p>{formatDateTime(a.createdAt)}</p>
          {a.auteur ? (
            <p className="text-xs text-muted-foreground">{a.auteur}</p>
          ) : null}
        </div>
      ),
    },
    {
      cle: "destinataires",
      entete: "Personnes",
      align: "right",
      cellule: (a) => formatNumber(a.destinataires),
    },
    {
      cle: "emails",
      entete: "E-mails",
      align: "right",
      secondaire: true,
      cellule: (a) =>
        a.avecEmail ? (
          <div className="text-right">
            <p>
              {formatNumber(a.emailsEnvoyes)} / {formatNumber(a.emailsPrevus)}
              {a.emailsEchecs ? (
                <span className="text-destructive"> ({a.emailsEchecs} échecs)</span>
              ) : null}
            </p>
            {a.derniereErreur ? (
              <p className="ml-auto max-w-56 text-xs text-destructive">
                {a.derniereErreur}
              </p>
            ) : null}
          </div>
        ) : (
          "—"
        ),
    },
    {
      cle: "statut",
      entete: "État",
      cellule: (a) =>
        a.statut === "EN_COURS" ? (
          <ConsolePastille libelle="E-mails en cours" teinte="var(--warning)" />
        ) : a.statut === "INTERROMPUE" ? (
          <ConsolePastille libelle="E-mails interrompus" teinte="var(--destructive)" />
        ) : (
          <ConsolePastille libelle="Terminée" teinte="var(--success)" />
        ),
    },
    {
      cle: "reprendre",
      entete: "",
      align: "right",
      cellule: (a) => (
        <Button
          variant="ghost"
          size="sm"
          className="rounded-lg"
          onClick={() => {
            // Reprend le texte dans le formulaire, pour un nouvel envoi après
            // un échec : l'annonce d'origine n'est pas renvoyée telle quelle,
            // l'administrateur revoit d'abord ses destinataires.
            setTitre(a.titre);
            setMessage(a.message);
            setLien(a.lien ?? "");
            setAvecEmail(a.avecEmail);
            window.scrollTo({ top: 0, behavior: "smooth" });
            toast.info("Annonce reprise dans le formulaire", {
              description: "Vérifiez les destinataires, puis envoyez-la.",
            });
          }}
        >
          <RotateCcw className="size-4" />
          Réutiliser
        </Button>
      ),
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="Annonces"
        icon={Megaphone}
        teinte={TEINTE}
        description="Envoyez un message à tout le monde, ou à un groupe choisi. Il arrive dans les notifications de l'application, sur le téléphone des personnes abonnées et, si vous le souhaitez, par e-mail."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="min-w-0 space-y-4 rounded-2xl border bg-card p-4">
          <h2 className="text-sm font-semibold">Message</h2>
          <div>
            <Label htmlFor="annonce-titre">Titre</Label>
            <Input
              id="annonce-titre"
              className="mt-1.5"
              maxLength={120}
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Session d'information à Ziguinchor"
            />
          </div>
          <div>
            <Label htmlFor="annonce-message">Texte</Label>
            <Textarea
              id="annonce-message"
              className="mt-1.5"
              rows={6}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Le message tel que les personnes le liront."
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {message.length} / 2000
            </p>
          </div>
          <div>
            <Label htmlFor="annonce-lien">Lien (facultatif)</Label>
            <Input
              id="annonce-lien"
              className="mt-1.5"
              maxLength={500}
              value={lien}
              onChange={(e) => setLien(e.target.value)}
              placeholder="/offres/123 ou https://…"
              aria-invalid={!lienValide}
            />
            {!lienValide ? (
              <p role="alert" className="mt-1 text-xs text-destructive">
                Le lien doit commencer par https:// ou /
              </p>
            ) : null}
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <Switch
              id="annonce-email"
              checked={avecEmail}
              onCheckedChange={setAvecEmail}
            />
            <div className="min-w-0">
              <label htmlFor="annonce-email" className="text-sm font-medium">
                Envoyer aussi par e-mail
              </label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Avec un lien de désabonnement. Encore{" "}
                {formatNumber(quota)} e-mail(s) possible(s) aujourd&apos;hui.
              </p>
              {depasseQuota ? (
                <p role="alert" className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  {formatNumber(emails)} e-mails seraient nécessaires : l&apos;envoi
                  s&apos;arrêtera après {formatNumber(quota)}. Réduisez la cible, ou
                  envoyez en plusieurs jours.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="min-w-0 space-y-4 rounded-2xl border bg-card p-4">
          <h2 className="text-sm font-semibold">
            Destinataires
            <span className="ml-1.5 font-normal text-muted-foreground">
              (sans critère : tout le monde)
            </span>
          </h2>
          <GroupePastilles
            titre="Rôle"
            valeurs={roles}
            onChange={setRoles}
            options={Object.entries(ROLE_LABELS).map(([valeur, libelle]) => ({ valeur, libelle }))}
          />
          <GroupePastilles
            titre="Région"
            valeurs={regions}
            onChange={(v) => {
              setRegions(v);
              const permis = v.flatMap((r) => departementsFor(r));
              setDepartements((d) => d.filter((x) => permis.includes(x)));
            }}
            options={REGION_NAMES.map((r) => ({ valeur: r, libelle: r }))}
          />
          {departementsPossibles.length ? (
            <GroupePastilles
              titre="Département"
              valeurs={departements}
              onChange={setDepartements}
              options={departementsPossibles.map((d) => ({ valeur: d, libelle: d }))}
            />
          ) : null}
          <GroupePastilles
            titre="Statut"
            valeurs={statuts}
            onChange={setStatuts}
            options={Object.entries(STATUT_PROFESSIONNEL_LABELS).map(([valeur, libelle]) => ({ valeur, libelle }))}
          />
          <GroupePastilles
            titre="Sexe"
            valeurs={sexes}
            onChange={setSexes}
            options={Object.entries(SEXE_LABELS).map(([valeur, libelle]) => ({ valeur, libelle }))}
          />
          <GroupePastilles
            titre="Tranche d'âge"
            valeurs={tranchesAge}
            onChange={setTranchesAge}
            options={Object.entries(TRANCHES).map(([valeur, libelle]) => ({ valeur, libelle }))}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                {calcul ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Users className="size-4" aria-hidden />
                )}
                {formatNumber(apercu?.destinataires ?? 0)} personne(s)
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Smartphone className="size-4" aria-hidden />
                {formatNumber(apercu?.appareils ?? 0)} avec notifications
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Mail className="size-4" aria-hidden />
                {formatNumber(emails)} e-mails
              </span>
            </div>
            <Button
              className="rounded-xl"
              disabled={!pret}
              onClick={() => setConfirmation(true)}
            >
              <Send className="size-4" />
              Envoyer
            </Button>
          </div>
        </section>
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Bell className="size-4" aria-hidden />
        Annonces envoyées
      </h2>
      <ConsoleTable
        lignes={historique}
        colonnes={colonnes}
        cle={(a) => a.id}
        chargement={chargement}
        vide={
          <p className="p-8 text-center text-sm text-muted-foreground">
            Aucune annonce envoyée pour l&apos;instant.
          </p>
        }
      />

      <Dialog open={confirmation} onOpenChange={setConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer cette annonce ?</DialogTitle>
            <DialogDescription>
              « {titre.trim()} » sera envoyée à{" "}
              <strong>{formatNumber(apercu?.destinataires ?? 0)} personne(s)</strong>
              {avecEmail ? `, dont ${formatNumber(emails)} par e-mail` : ""}. Un envoi
              ne peut pas être annulé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmation(false)}>
              Annuler
            </Button>
            <Button disabled={envoi.isPending} onClick={() => envoi.mutate()}>
              {envoi.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Confirmer l&apos;envoi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
