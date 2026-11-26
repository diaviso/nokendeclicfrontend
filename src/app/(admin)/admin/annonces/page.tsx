"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  Eraser,
  Filter,
  Link2,
  Loader2,
  Mail,
  Megaphone,
  PenLine,
  RotateCcw,
  Send,
  Smartphone,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import { ConsolePastille } from "@/components/admin/console-ui";
import {
  ConsoleAction,
  ConsoleActions,
  ConsoleChamp,
  ConsoleInterrupteur,
  ConsolePanneau,
  useConfirmation,
} from "@/components/admin/console-kit";
import { EmptyState } from "@/components/shared/empty-state";
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
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { REGION_NAMES, departementsFor } from "@/lib/senegal";
import { cn } from "@/lib/utils";

const TEINTE = "var(--c-orange)";

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
      <legend className="mb-2 flex w-full items-center justify-between gap-2 text-[13px] font-semibold">
        <span>
          {titre}
          {valeurs.length ? (
            <span
              className="ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
              style={{
                background: `color-mix(in oklch, ${TEINTE} 14%, transparent)`,
                color: TEINTE,
              }}
            >
              {valeurs.length}
            </span>
          ) : null}
        </span>
        {valeurs.length ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Tout effacer
          </button>
        ) : (
          <span className="text-xs font-normal text-muted-foreground">Tous</span>
        )}
      </legend>
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
                "rounded-full border px-3 py-1 text-[13px] transition-colors",
                actif
                  ? "border-primary/40 bg-primary/10 font-semibold text-primary"
                  : "bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
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

/** Aperçu de la notification telle qu'elle apparaîtra au membre. */
function ApercuNotification({
  titre,
  message,
  lien,
}: {
  titre: string;
  message: string;
  lien: string;
}) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Aperçu de la notification
      </p>
      <div className="flex items-start gap-3 rounded-xl border bg-background p-3 shadow-sm">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklch, ${TEINTE} 14%, transparent)`,
            color: TEINTE,
          }}
        >
          <Megaphone className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center justify-between gap-2 text-sm font-semibold">
            <span className="truncate">{titre.trim() || "Titre de l'annonce"}</span>
            <span className="shrink-0 text-[11px] font-normal text-muted-foreground">
              à l&apos;instant
            </span>
          </p>
          <p
            className={cn(
              "mt-0.5 line-clamp-3 whitespace-pre-line text-xs leading-relaxed",
              message.trim() ? "text-muted-foreground" : "italic text-muted-foreground/70",
            )}
          >
            {message.trim() || "Le message tel que les personnes le liront."}
          </p>
          {lien.trim() ? (
            <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] font-medium text-primary">
              <Link2 className="size-3" aria-hidden />
              {lien.trim()}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AnnoncesPage() {
  const queryClient = useQueryClient();
  const confirmer = useConfirmation();
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

  const filtres = useMemo<FiltresAnnonce>(
    () => ({ roles, regions, departements, statuts, sexes, tranchesAge }),
    [roles, regions, departements, statuts, sexes, tranchesAge],
  );
  const filtresDiffères = useDebounced(filtres, 250);
  const nbCriteres =
    roles.length +
    regions.length +
    departements.length +
    statuts.length +
    sexes.length +
    tranchesAge.length;

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

  const reinitialiserCriteres = () => {
    setRoles([]);
    setRegions([]);
    setDepartements([]);
    setStatuts([]);
    setSexes([]);
    setTranchesAge([]);
  };

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
      toast.error("Envoi impossible", { description: errorMessage(erreur) });
    },
  });

  const emails = apercu?.emails ?? 0;
  const quota = apercu?.quotaEmails ?? 0;
  const destinataires = apercu?.destinataires ?? 0;
  const depasseQuota = avecEmail && emails > quota;
  const lienValide = !lien.trim() || /^(https:\/\/\S+|\/\S*)$/.test(lien.trim());
  const pret =
    titre.trim().length >= 3 &&
    message.trim().length >= 3 &&
    lienValide &&
    destinataires > 0;

  const demanderEnvoi = async () => {
    const accord = await confirmer({
      titre: "Envoyer cette annonce ?",
      message: `« ${titre.trim()} » sera envoyée à ${formatNumber(destinataires)} personne(s)${
        avecEmail ? `, dont ${formatNumber(emails)} par e-mail` : ""
      }. Un envoi ne peut pas être annulé.`,
      confirmer: "Confirmer l'envoi",
    });
    if (accord) envoi.mutate();
  };

  const totalPersonnes = historique.reduce((somme, a) => somme + a.destinataires, 0);
  const totalEmails = historique.reduce((somme, a) => somme + a.emailsEnvoyes, 0);
  const enCours = historique.filter((a) => a.statut === "EN_COURS").length;

  const colonnes: ColonneConsole<Annonce>[] = [
    {
      cle: "titre",
      entete: "Annonce",
      cellule: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-lg"
            style={{
              background: `color-mix(in oklch, ${TEINTE} 12%, transparent)`,
              color: TEINTE,
            }}
          >
            {a.avecEmail ? (
              <Mail className="size-4" aria-hidden />
            ) : (
              <Bell className="size-4" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{a.titre}</p>
            <p className="truncate text-xs text-muted-foreground">{a.message}</p>
          </div>
        </div>
      ),
    },
    {
      cle: "date",
      entete: "Envoyée",
      secondaire: true,
      cellule: (a) => (
        <div className="text-sm">
          <p title={formatDateTime(a.createdAt)}>{formatRelative(a.createdAt)}</p>
          {a.auteur ? (
            <p className="text-xs text-muted-foreground">par {a.auteur}</p>
          ) : null}
        </div>
      ),
    },
    {
      cle: "destinataires",
      entete: "Personnes",
      align: "right",
      cellule: (a) => (
        <span className="font-semibold tabular-nums">{formatNumber(a.destinataires)}</span>
      ),
    },
    {
      cle: "emails",
      entete: "E-mails",
      align: "right",
      secondaire: true,
      cellule: (a) => {
        if (!a.avecEmail) return <span className="text-muted-foreground">—</span>;
        const part = a.emailsPrevus ? Math.min(100, (a.emailsEnvoyes / a.emailsPrevus) * 100) : 0;
        return (
          <div className="ml-auto max-w-56 text-right">
            <p className="tabular-nums">
              {formatNumber(a.emailsEnvoyes)} / {formatNumber(a.emailsPrevus)}
              {a.emailsEchecs ? (
                <span className="text-destructive"> ({a.emailsEchecs} échecs)</span>
              ) : null}
            </p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${part}%`,
                  background: a.emailsEchecs ? "var(--destructive)" : "var(--success)",
                }}
              />
            </div>
            {a.derniereErreur ? (
              <p className="mt-1 text-xs text-destructive">{a.derniereErreur}</p>
            ) : null}
          </div>
        );
      },
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
      className: "w-16",
      cellule: (a) => (
        <ConsoleActions>
          <ConsoleAction
            libelle="Réutiliser dans le formulaire"
            icone={RotateCcw}
            ton="primaire"
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
          />
        </ConsoleActions>
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
        mesures={[
          { label: "Annonces envoyées", valeur: historique.length },
          { label: "Personnes notifiées", valeur: totalPersonnes, teinte: TEINTE },
          { label: "E-mails envoyés", valeur: totalEmails },
          { label: "E-mails restants aujourd'hui", valeur: quota, teinte: "var(--success)" },
          ...(enCours
            ? [{ label: "Envois en cours", valeur: enCours, teinte: "var(--warning)" }]
            : []),
        ]}
      />

      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ConsolePanneau
          titre="Message"
          description="Ce que les personnes recevront."
          icone={PenLine}
          teinte={TEINTE}
        >
          <div className="space-y-4">
            <ConsoleChamp id="annonce-titre" libelle="Titre" requis>
              <Input
                id="annonce-titre"
                maxLength={120}
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Session d'information à Ziguinchor"
              />
            </ConsoleChamp>
            <ConsoleChamp
              id="annonce-message"
              libelle="Texte"
              requis
              aide={
                <span className="flex justify-end tabular-nums">
                  {message.length} / 2000
                </span>
              }
            >
              <Textarea
                id="annonce-message"
                rows={6}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Le message tel que les personnes le liront."
              />
            </ConsoleChamp>
            <ConsoleChamp
              id="annonce-lien"
              libelle="Lien (facultatif)"
              aide="Une page de Noken (/offres/123) ou une adresse externe en https://."
              erreur={!lienValide ? "Le lien doit commencer par https:// ou /" : undefined}
            >
              <Input
                id="annonce-lien"
                maxLength={500}
                value={lien}
                onChange={(e) => setLien(e.target.value)}
                placeholder="/offres/123 ou https://…"
                aria-invalid={!lienValide}
              />
            </ConsoleChamp>
            <ConsoleInterrupteur
              icone={Mail}
              libelle="Envoyer aussi par e-mail"
              description={`Avec un lien de désabonnement. Encore ${formatNumber(quota)} e-mail(s) possible(s) aujourd'hui.`}
              coche={avecEmail}
              onChange={setAvecEmail}
            />
            {depasseQuota ? (
              <p
                role="alert"
                className="rounded-xl border border-[color-mix(in_oklch,var(--warning)_40%,transparent)] bg-[color-mix(in_oklch,var(--warning)_10%,transparent)] px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-300"
              >
                {formatNumber(emails)} e-mails seraient nécessaires : l&apos;envoi
                s&apos;arrêtera après {formatNumber(quota)}. Réduisez la cible, ou
                envoyez en plusieurs jours.
              </p>
            ) : null}
            <ApercuNotification titre={titre} message={message} lien={lien} />
          </div>
        </ConsolePanneau>

        <ConsolePanneau
          titre="Destinataires"
          description="Sans critère : tout le monde. Les critères se cumulent."
          icone={Filter}
          teinte={TEINTE}
          actions={
            nbCriteres ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={reinitialiserCriteres}
              >
                <Eraser className="size-3.5" />
                Réinitialiser ({nbCriteres})
              </Button>
            ) : null
          }
          corpsClassName="p-0"
        >
          <div className="space-y-5 p-5">
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
          </div>

          {/* Bilan de la cible et envoi, en pied de panneau. */}
          <div className="border-t bg-muted/40 px-5 py-4">
            <div className="mb-3 grid grid-cols-3 gap-2">
              {[
                {
                  icone: calcul ? Loader2 : Users,
                  valeur: destinataires,
                  libelle: "personne(s)",
                  fort: true,
                },
                {
                  icone: Smartphone,
                  valeur: apercu?.appareils ?? 0,
                  libelle: "avec notifications",
                },
                { icone: Mail, valeur: emails, libelle: "e-mails" },
              ].map(({ icone: Icone, valeur, libelle, fort }) => (
                <div
                  key={libelle}
                  className={cn(
                    "rounded-xl border bg-background px-3 py-2",
                    fort && "border-primary/30",
                  )}
                >
                  <p className="flex items-center gap-1.5 text-lg font-extrabold tabular-nums">
                    <Icone
                      className={cn(
                        "size-4 shrink-0",
                        fort ? "text-primary" : "text-muted-foreground",
                        calcul && fort && "animate-spin",
                      )}
                      aria-hidden
                    />
                    {formatNumber(valeur)}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{libelle}</p>
                </div>
              ))}
            </div>
            <Button
              className="w-full rounded-xl"
              size="lg"
              disabled={!pret || envoi.isPending}
              onClick={demanderEnvoi}
            >
              {envoi.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Envoyer à {formatNumber(destinataires)} personne(s)
            </Button>
            {!pret && !envoi.isPending ? (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {destinataires === 0
                  ? "Aucune personne ne correspond à ces critères."
                  : "Un titre et un texte d'au moins 3 caractères sont nécessaires."}
              </p>
            ) : null}
          </div>
        </ConsolePanneau>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span
          className="grid size-7 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklch, ${TEINTE} 14%, transparent)`,
            color: TEINTE,
          }}
        >
          <Bell className="size-3.5" aria-hidden />
        </span>
        <h2 className="text-sm font-bold">Annonces envoyées</h2>
        {historique.length ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
            {formatNumber(historique.length)}
          </span>
        ) : null}
      </div>
      <ConsoleTable
        lignes={historique}
        colonnes={colonnes}
        cle={(a) => a.id}
        chargement={chargement}
        rail={(a) =>
          a.statut === "EN_COURS"
            ? "var(--warning)"
            : a.statut === "INTERROMPUE"
              ? "var(--destructive)"
              : undefined
        }
        vide={
          <EmptyState
            icon={Megaphone}
            couleur={TEINTE}
            title="Aucune annonce envoyée pour l'instant"
            description="Rédigez un message ci-dessus, choisissez vos destinataires, puis envoyez-le."
          />
        }
      />
    </>
  );
}
