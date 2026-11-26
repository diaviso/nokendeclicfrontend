"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowUpRight, Download, ExternalLink, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import {
  ConsoleFiltre,
  ConsolePagination,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import { ConsoleAction, ConsoleActions } from "@/components/admin/console-kit";
import { EmptyState } from "@/components/shared/empty-state";
import { useDebounced } from "@/hooks/use-debounced";
import {
  consultationsApi,
  errorMessage,
  exportsApi,
  telechargerFichier,
  type ConsultationsOffre,
} from "@/lib/api";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";

const TEINTE = "var(--c-sky)";
type Periode = "0" | "7" | "30" | "90" | "365";

export default function ConsultationsPage() {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [periode, setPeriode] = useState<Periode>("0");
  const [tri, setTri] = useState<"consultations" | "recentes">("consultations");
  const [page, setPage] = useState(1);
  const [exportEnCours, setExportEnCours] = useState(false);
  const q = useDebounced(recherche);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "consultations", { q, periode, tri, page }],
    queryFn: () =>
      consultationsApi.parOffre({ jours: Number(periode), q, page, tri }),
    placeholderData: (precedent) => precedent,
  });

  async function exporter() {
    setExportEnCours(true);
    try {
      const fichier = await exportsApi.telecharger("consultations", {
        jours: Number(periode),
      });
      telechargerFichier(
        fichier,
        `noken-consultations-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (erreur) {
      toast.error("Export impossible", { description: errorMessage(erreur) });
    } finally {
      setExportEnCours(false);
    }
  }

  const elements = data?.elements ?? [];
  const maximum = Math.max(1, ...elements.map((l) => l.consultations));

  const colonnes: ColonneConsole<ConsultationsOffre>[] = [
    {
      cle: "offre",
      entete: "Offre",
      cellule: (l) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{l.titre}</p>
          <p className="truncate text-xs text-muted-foreground">
            {l.entreprise ? `${l.entreprise} · ` : ""}
            {formatDate(l.datePublication)}
          </p>
        </div>
      ),
    },
    {
      cle: "vues",
      entete: "Vues totales",
      align: "right",
      secondaire: true,
      cellule: (l) => formatNumber(l.vues),
    },
    {
      cle: "consultations",
      entete: "Consultations",
      align: "right",
      cellule: (l) => (
        <div className="flex items-center justify-end gap-2.5">
          <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted xl:block">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${(l.consultations / maximum) * 100}%`,
                background: TEINTE,
              }}
            />
          </span>
          <span className="font-semibold tabular-nums">
            {formatNumber(l.consultations)}
          </span>
        </div>
      ),
    },
    {
      cle: "uniques",
      entete: "Personnes",
      align: "right",
      cellule: (l) => (
        <span className="tabular-nums">{formatNumber(l.uniques)}</span>
      ),
    },
    {
      cle: "repetees",
      entete: "Répétées",
      align: "right",
      secondaire: true,
      cellule: (l) => formatNumber(l.repetees),
    },
    {
      cle: "derniere",
      entete: "Dernière",
      secondaire: true,
      cellule: (l) => (
        <span className="text-xs text-muted-foreground">
          {l.derniere ? formatDateTime(l.derniere) : "—"}
        </span>
      ),
    },
    {
      cle: "actions",
      entete: "",
      align: "right",
      className: "w-24",
      cellule: (l) => (
        <ConsoleActions>
          <ConsoleAction
            libelle="Voir l'offre publique"
            icone={ExternalLink}
            href={`/offres/${l.id}`}
            cible="_blank"
          />
          <ConsoleAction
            libelle="Qui a consulté"
            icone={ArrowUpRight}
            ton="primaire"
            onClick={() => router.push(`/admin/consultations/${l.id}`)}
          />
        </ConsoleActions>
      ),
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="Consultations"
        icon={Eye}
        teinte={TEINTE}
        description={`Qui consulte quelles offres, et quand. Seules les personnes connectées sont identifiées ; une même personne n'est recomptée qu'après 30 minutes.${
          data?.bilan.suiviDepuis
            ? ` Suivi nominatif depuis le ${formatDate(data.bilan.suiviDepuis)}.`
            : ""
        }`}
        mesures={
          data
            ? [
                { label: "consultations", valeur: data.bilan.consultations, teinte: TEINTE },
                { label: "personnes uniques", valeur: data.bilan.personnes },
                { label: "offres consultées", valeur: data.total },
                {
                  label: "consultations par personne",
                  valeur: data.bilan.personnes
                    ? (data.bilan.consultations / data.bilan.personnes).toLocaleString("fr-FR", {
                        maximumFractionDigits: 1,
                      })
                    : "—",
                },
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

      <ConsoleToolbar>
        <ConsoleSearch
          valeur={recherche}
          onChange={(valeur) => {
            setRecherche(valeur);
            setPage(1);
          }}
          placeholder="Titre de l'offre…"
          label="Rechercher une offre"
          enCours={isFetching && !isLoading}
        />
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
        <ConsoleFiltre<"consultations" | "recentes">
          label="Tri"
          valeur={tri}
          onChange={(valeur) => {
            setTri(valeur);
            setPage(1);
          }}
          options={[
            { valeur: "consultations", libelle: "Les plus lues" },
            { valeur: "recentes", libelle: "Les plus récentes" },
          ]}
        />
      </ConsoleToolbar>

      <ConsoleTable
        lignes={elements}
        colonnes={colonnes}
        cle={(l) => l.id}
        chargement={isLoading}
        onLigneClick={(l) => router.push(`/admin/consultations/${l.id}`)}
        rail={() => TEINTE}
        vide={
          <EmptyState
            icon={Eye}
            couleur={TEINTE}
            title={recherche ? "Aucune offre ne correspond" : "Aucune consultation sur cette période"}
            description={
              recherche
                ? "Essayez avec un autre mot du titre."
                : "Élargissez la période pour voir des consultations plus anciennes."
            }
          />
        }
      />
      <ConsolePagination
        page={page}
        total={data?.pages ?? 1}
        onChange={setPage}
      />
    </>
  );
}
