"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, ExternalLink, Eye, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import {
  ConsoleFiltre,
  ConsolePagination,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import { ConsoleAction, ConsoleActions } from "@/components/admin/console-kit";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  consultationsApi,
  errorMessage,
  exportsApi,
  telechargerFichier,
  type PersonneConsultation,
} from "@/lib/api";
import { roleLabel, statutProfessionnelLabel } from "@/lib/enums";
import { formatDate, formatDateTime, fullName } from "@/lib/format";

const TEINTE = "var(--c-sky)";
type Periode = "0" | "7" | "30" | "90" | "365";

export default function DetailConsultationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const offreId = Number(id);
  const router = useRouter();
  const [periode, setPeriode] = useState<Periode>("0");
  const [page, setPage] = useState(1);
  const [exportEnCours, setExportEnCours] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "consultations", offreId, { periode, page }],
    queryFn: () =>
      consultationsApi.detail(offreId, { jours: Number(periode), page }),
    placeholderData: (precedent) => precedent,
  });

  async function exporter() {
    setExportEnCours(true);
    try {
      const fichier = await exportsApi.telecharger("consultations", {
        jours: Number(periode),
        offreId,
      });
      telechargerFichier(
        fichier,
        `noken-consultations-offre-${offreId}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (erreur) {
      toast.error("Export impossible", { description: errorMessage(erreur) });
    } finally {
      setExportEnCours(false);
    }
  }

  const colonnes: ColonneConsole<PersonneConsultation>[] = [
    {
      cle: "personne",
      entete: "Personne",
      cellule: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarFallback
              className="text-xs font-semibold"
              style={{
                background: `color-mix(in oklch, ${TEINTE} 14%, transparent)`,
                color: TEINTE,
              }}
            >
              {(fullName(p)[0] ?? "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link
              href={`/admin/utilisateurs/${p.id}`}
              className="block truncate font-semibold hover:text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {fullName(p)}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {p.email}
              {p.telephone ? ` · ${p.telephone}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      cle: "profil",
      entete: "Profil",
      secondaire: true,
      cellule: (p) => (
        <div className="min-w-0 text-sm">
          <p className="truncate">
            {roleLabel(p.role)} ·{" "}
            {statutProfessionnelLabel(p.statutProfessionnel)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[p.departement, p.region].filter(Boolean).join(", ") || "Lieu non renseigné"}
          </p>
        </div>
      ),
    },
    {
      cle: "nombre",
      entete: "Consultations",
      align: "right",
      cellule: (p) => (
        <span
          className="inline-flex min-w-7 justify-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums"
          style={
            p.nombre > 1
              ? {
                  background: `color-mix(in oklch, ${TEINTE} 14%, transparent)`,
                  color: TEINTE,
                }
              : undefined
          }
        >
          {p.nombre}
        </span>
      ),
    },
    {
      cle: "dates",
      entete: "Dates et heures",
      cellule: (p) =>
        p.nombre === 1 ? (
          formatDateTime(p.derniere)
        ) : (
          <details onClick={(e) => e.stopPropagation()} className="text-sm">
            <summary className="cursor-pointer select-none hover:text-primary">
              Dernière : {formatDateTime(p.derniere)}
            </summary>
            <ul className="mt-1.5 space-y-0.5 border-l-2 pl-2.5 text-xs text-muted-foreground">
              {p.dates.map((date) => (
                <li key={date}>{formatDateTime(date)}</li>
              ))}
            </ul>
          </details>
        ),
    },
    {
      cle: "actions",
      entete: "",
      align: "right",
      className: "w-14",
      cellule: (p) => (
        <ConsoleActions>
          <ConsoleAction
            libelle="Ouvrir la fiche"
            icone={UserRound}
            ton="primaire"
            onClick={() => router.push(`/admin/utilisateurs/${p.id}`)}
          />
        </ConsoleActions>
      ),
    },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 rounded-lg"
        render={<Link href="/admin/consultations" />}
      >
        <ArrowLeft className="size-4" />
        Toutes les offres
      </Button>

      <ConsoleHeader
        title={data?.offre.titre ?? "Consultations de l'offre"}
        icon={Eye}
        teinte={TEINTE}
        description={`${
          data?.offre.entreprise ? `${data.offre.entreprise} · ` : ""
        }${
          data ? `publiée le ${formatDate(data.offre.datePublication)}. ` : ""
        }Les vues totales comptent aussi les visiteurs anonymes et les consultations antérieures au suivi nominatif.`}
        mesures={
          data
            ? [
                { label: "vues totales", valeur: data.bilan.vues },
                { label: "consultations", valeur: data.bilan.consultations, teinte: TEINTE },
                { label: "personnes uniques", valeur: data.bilan.uniques },
                { label: "répétées", valeur: data.bilan.repetees },
                ...(data.bilan.comptesSupprimes
                  ? [
                      {
                        label: "comptes supprimés depuis",
                        valeur: data.bilan.comptesSupprimes,
                      },
                    ]
                  : []),
              ]
            : undefined
        }
        actions={
          <>
            <Button
              variant="ghost"
              className="rounded-xl"
              render={<Link href={`/offres/${offreId}`} target="_blank" />}
            >
              <ExternalLink className="size-4" />
              Voir l&apos;offre
            </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={exportEnCours}
            onClick={() => void exporter()}
          >
            {exportEnCours ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Exporter en Excel
          </Button>
          </>
        }
      />

      <ConsoleToolbar>
        <ConsoleFiltre<Periode>
          label="Période"
          valeur={periode}
          onChange={(valeur) => {
            setPeriode(valeur);
            setPage(1);
          }}
          options={[
            { valeur: "0", libelle: "Tout" },
            { valeur: "7", libelle: "7 j" },
            { valeur: "30", libelle: "30 j" },
            { valeur: "90", libelle: "3 mois" },
            { valeur: "365", libelle: "1 an" },
          ]}
        />
        {data ? (
          <p className="text-xs text-muted-foreground sm:ml-auto">
            {data.total} personne{data.total > 1 ? "s" : ""} identifiée
            {data.total > 1 ? "s" : ""}
          </p>
        ) : null}
      </ConsoleToolbar>

      {error ? (
        <EmptyState
          icon={Eye}
          couleur="var(--destructive)"
          title="Consultations indisponibles"
          description={errorMessage(error)}
        />
      ) : (
        <ConsoleTable
          lignes={data?.personnes ?? []}
          colonnes={colonnes}
          cle={(p) => p.id}
          chargement={isLoading}
          onLigneClick={(p) => router.push(`/admin/utilisateurs/${p.id}`)}
          rail={(p) => (p.nombre > 1 ? TEINTE : undefined)}
          vide={
            <EmptyState
              icon={Eye}
              couleur={TEINTE}
              title="Aucune consultation identifiée"
              description="Aucune personne connectée n'a encore consulté cette offre sur cette période."
            />
          }
        />
      )}
      <ConsolePagination page={page} total={data?.pages ?? 1} onChange={setPage} />
    </>
  );
}
