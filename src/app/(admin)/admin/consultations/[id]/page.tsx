"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import { ConsoleFiltre, ConsolePagination } from "@/components/admin/console-ui";
import {
  consultationsApi,
  errorMessage,
  exportsApi,
  telechargerFichier,
  type PersonneConsultation,
} from "@/lib/api";
import { roleLabel, statutProfessionnelLabel } from "@/lib/enums";
import { formatDateTime, fullName } from "@/lib/format";

const TEINTE = "var(--chart-1)";
type Periode = "0" | "7" | "30" | "90" | "365";

export default function DetailConsultationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const offreId = Number(id);
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
        <div className="min-w-0">
          <p className="truncate font-medium">{fullName(p)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {p.email}
            {p.telephone ? ` · ${p.telephone}` : ""}
          </p>
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
      cellule: (p) => <span className="font-semibold">{p.nombre}</span>,
    },
    {
      cle: "dates",
      entete: "Dates et heures",
      cellule: (p) =>
        p.nombre === 1 ? (
          formatDateTime(p.derniere)
        ) : (
          <details>
            <summary className="cursor-pointer">
              Dernière : {formatDateTime(p.derniere)}
            </summary>
            <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
              {p.dates.map((date) => (
                <li key={date}>{formatDateTime(date)}</li>
              ))}
            </ul>
          </details>
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
        description="Les vues totales comptent aussi les visiteurs anonymes et les consultations antérieures au suivi nominatif."
        mesures={
          data
            ? [
                { label: "vues totales", valeur: data.bilan.vues },
                { label: "consultations", valeur: data.bilan.consultations, teinte: TEINTE },
                { label: "personnes uniques", valeur: data.bilan.uniques },
                { label: "répétées", valeur: data.bilan.repetees },
              ]
            : undefined
        }
        actions={
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
        }
      />

      <div className="mb-4">
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
      </div>

      {error ? (
        <p className="rounded-xl border p-4 text-sm text-destructive">
          {errorMessage(error)}
        </p>
      ) : (
        <ConsoleTable
          lignes={data?.personnes ?? []}
          colonnes={colonnes}
          cle={(p) => p.id}
          chargement={isLoading}
          vide={
            <p className="p-8 text-center text-sm text-muted-foreground">
              Aucune personne connectée n&apos;a encore consulté cette offre sur
              cette période.
            </p>
          }
        />
      )}
      <ConsolePagination page={page} total={data?.pages ?? 1} onChange={setPage} />
    </>
  );
}
