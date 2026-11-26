"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  Download,
  Eye,
  FileUp,
  Loader2,
  QrCode,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ConsoleAction,
  ConsoleActions,
  useConfirmation,
} from "@/components/admin/console-kit";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import {
  ConsoleFiltre,
  ConsolePagination,
  ConsolePastille,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import { adminApi, errorMessage, fileUrl } from "@/lib/api";
import {
  ROLE_LABELS,
  STATUT_PROFESSIONNEL_LABELS,
  roleLabel,
} from "@/lib/enums";
import { formatDateShort, fullName } from "@/lib/format";
import type { Role, User } from "@/lib/types";

/** Teinte par rôle : la même dans le rail, la pastille et le filtre. */
const TEINTE_ROLE: Record<Role, string> = {
  ADMIN: "var(--c-rose)",
  PARTENAIRE: "var(--c-orange)",
  MEMBRE: "var(--c-blue)",
};

const TEINTE = "var(--c-blue)";

/** Cellule CSV : guillemets doublés, séparateur point-virgule (Excel FR). */
function celluleCsv(valeur: unknown): string {
  const texte = valeur === null || valeur === undefined ? "" : String(valeur);
  return /[";\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

/** Fichier CSV de tous les comptes, ouvrable directement dans Excel. */
function telechargerCsv(comptes: User[]) {
  const entetes = [
    "Identifiant",
    "Prénom",
    "Nom",
    "Nom d'utilisateur",
    "Email",
    "Téléphone",
    "Rôle",
    "Actif",
    "Statut professionnel",
    "Sexe",
    "Date de naissance",
    "Pays",
    "Région",
    "Département",
    "Commune",
    "Situation de handicap",
    "Connexion",
    "Inscrit le",
  ];
  const lignes = comptes.map((compte) => [
    compte.id,
    compte.firstName,
    compte.lastName,
    compte.username,
    compte.email,
    compte.telephone,
    roleLabel(compte.role),
    compte.isActive ? "Oui" : "Non",
    STATUT_PROFESSIONNEL_LABELS[compte.statutProfessionnel] ?? compte.statutProfessionnel,
    compte.sexe,
    compte.dateNaissance ? compte.dateNaissance.slice(0, 10) : "",
    compte.pays,
    compte.region,
    compte.departement,
    compte.commune,
    compte.handicap ? "Oui" : "Non",
    compte.isGoogleLogin ? "Google" : "Mot de passe",
    compte.createdAt.slice(0, 10),
  ]);
  const contenu = [entetes, ...lignes]
    .map((ligne) => ligne.map(celluleCsv).join(";"))
    .join("\r\n");
  // BOM : sans lui, Excel lit l'UTF-8 comme du Latin-1 et casse les accents.
  const blob = new Blob(["\uFEFF" + contenu], { type: "text/csv;charset=utf-8" });
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = `noken-utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(lien.href);
}

type FiltreRole = Role | "";

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmer = useConfirmation();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<FiltreRole>("");
  const [page, setPage] = useState(1);
  const rechercheDifferee = useDebounced(search);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "users", { search: rechercheDifferee, page, role }],
    queryFn: () =>
      adminApi.users({
        search: rechercheDifferee,
        page,
        limit: 20,
        role: role || undefined,
      }),
    placeholderData: (precedent) => precedent,
  });

  const changerRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) =>
      adminApi.setUserRole(id, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Rôle modifié");
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  const basculerActif = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      adminApi.toggleUserActive(id, isActive),
    onSuccess: async (_donnees, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(
        variables.isActive ? "Compte réactivé" : "Compte désactivé",
      );
    },
    onError: (error) =>
      toast.error("Modification impossible", { description: errorMessage(error) }),
  });

  const exporter = useMutation({
    mutationFn: adminApi.exportUsers,
    onSuccess: (comptes) => {
      telechargerCsv(comptes);
      toast.success(`${comptes.length} comptes exportés`);
    },
    onError: (error) =>
      toast.error("Export impossible", { description: errorMessage(error) }),
  });

  const meta = data?.meta;
  const pageUtilisateurs = useMemo(() => data?.data ?? [], [data]);

  // Le filtre de rôle est appliqué par le serveur, sur tous les comptes. Il
  // l'était auparavant ici, sur les vingt lignes de la page affichée : les
  // administrateurs, inscrits en premier, se trouvaient en dernières pages et
  // la console en annonçait zéro.
  const utilisateurs = pageUtilisateurs;

  // Compteurs de l'ensemble (recherche comprise, filtre de rôle non compris),
  // fournis par le serveur — plus ceux de la seule page.
  const comptesParRole: Partial<Record<Role, number>> = data?.comptes ?? {};
  const desactives = data?.comptes?.desactives ?? 0;

  const colonnes: ColonneConsole<User>[] = [
    {
      cle: "compte",
      entete: "Compte",
      cellule: (utilisateur) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={fileUrl(utilisateur.pictureUrl)} alt="" />
            <AvatarFallback
              className="text-xs font-semibold"
              style={{
                background: `color-mix(in oklch, ${TEINTE_ROLE[utilisateur.role]} 14%, transparent)`,
                color: TEINTE_ROLE[utilisateur.role],
              }}
            >
              {(
                utilisateur.firstName?.[0] ??
                utilisateur.username[0] ??
                "?"
              ).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 text-left">
            <p className="truncate font-semibold">{fullName(utilisateur)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {utilisateur.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      cle: "role",
      entete: "Rôle",
      className: "w-40",
      cellule: (utilisateur) => (
        <ConsolePastille
          libelle={roleLabel(utilisateur.role)}
          teinte={TEINTE_ROLE[utilisateur.role]}
          discret={utilisateur.role === "MEMBRE"}
        />
      ),
    },
    {
      cle: "statut",
      entete: "État",
      className: "w-32",
      cellule: (utilisateur) =>
        utilisateur.isActive ? (
          <ConsolePastille libelle="Actif" teinte="var(--success)" />
        ) : (
          <ConsolePastille libelle="Désactivé" discret />
        ),
    },
    {
      cle: "connexion",
      entete: "Connexion",
      secondaire: true,
      className: "w-36",
      cellule: (utilisateur) => (
        <span className="text-xs text-muted-foreground">
          {utilisateur.isGoogleLogin ? "Google" : "Mot de passe"}
        </span>
      ),
    },
    {
      cle: "inscription",
      entete: "Inscrit le",
      secondaire: true,
      align: "right",
      className: "w-32",
      cellule: (utilisateur) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatDateShort(utilisateur.createdAt)}
        </span>
      ),
    },
    {
      cle: "actions",
      entete: "",
      className: "w-36",
      align: "right",
      cellule: (utilisateur) => (
        <ConsoleActions>
          <ConsoleAction
            libelle="Ouvrir la fiche"
            icone={Eye}
            ton="primaire"
            onClick={() => router.push(`/admin/utilisateurs/${utilisateur.id}`)}
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Changer le rôle de ${fullName(utilisateur)}`}
                  title="Changer le rôle"
                >
                  {changerRole.isPending && changerRole.variables?.id === utilisateur.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserCog className="size-4" />
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                {/* Le libellé décrit un groupe d'éléments : Base UI exige qu'il
                    soit encadré par un DropdownMenuGroup, sans quoi il lève
                    « MenuGroupContext is missing ». */}
                <DropdownMenuLabel className="text-xs">
                  Changer le rôle
                </DropdownMenuLabel>
                {(Object.keys(ROLE_LABELS) as Role[]).map((valeur) => (
                  <DropdownMenuItem
                    key={valeur}
                    disabled={utilisateur.role === valeur || changerRole.isPending}
                    onClick={() =>
                      changerRole.mutate({ id: utilisateur.id, role: valeur })
                    }
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ background: TEINTE_ROLE[valeur] }}
                    />
                    {ROLE_LABELS[valeur]}
                    {utilisateur.role === valeur ? (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        actuel
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push(`/admin/utilisateurs/${utilisateur.id}`)}
              >
                <Eye className="size-4" />
                Ouvrir la fiche
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ConsoleAction
            libelle={utilisateur.isActive ? "Désactiver le compte" : "Réactiver le compte"}
            icone={utilisateur.isActive ? Ban : CheckCircle2}
            ton={utilisateur.isActive ? "danger" : "succes"}
            enCours={
              basculerActif.isPending && basculerActif.variables?.id === utilisateur.id
            }
            onClick={async () => {
              if (
                utilisateur.isActive &&
                !(await confirmer({
                  titre: `Désactiver le compte de ${fullName(utilisateur)} ?`,
                  message:
                    "La personne ne pourra plus se connecter. Ses données sont conservées et le compte peut être réactivé à tout moment.",
                  confirmer: "Désactiver",
                  danger: true,
                }))
              ) {
                return;
              }
              basculerActif.mutate({
                id: utilisateur.id,
                isActive: !utilisateur.isActive,
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
        title="Utilisateurs"
        icon={Users}
        teinte={TEINTE}
        description="Rôles, accès et fiches détaillées des comptes inscrits sur la plateforme."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={exporter.isPending}
              onClick={() => exporter.mutate()}
            >
              {exporter.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Exporter (CSV)
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              render={<Link href="/admin/utilisateurs/affiche-qr" />}
            >
              <QrCode className="size-4" />
              Affiche QR
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              render={<Link href="/admin/utilisateurs/import" />}
            >
              <FileUp className="size-4" />
              Importer depuis Excel
            </Button>
          </div>
        }
        mesures={
          meta
            ? [
                { label: "comptes", valeur: meta.total, teinte: TEINTE },
                {
                  label: (comptesParRole.MEMBRE ?? 0) > 1 ? "membres" : "membre",
                  valeur: comptesParRole.MEMBRE ?? 0,
                  teinte: TEINTE_ROLE.MEMBRE,
                },
                {
                  label: (comptesParRole.PARTENAIRE ?? 0) > 1 ? "partenaires" : "partenaire",
                  valeur: comptesParRole.PARTENAIRE ?? 0,
                  teinte: TEINTE_ROLE.PARTENAIRE,
                },
                {
                  label: (comptesParRole.ADMIN ?? 0) > 1 ? "administrateurs" : "administrateur",
                  valeur: comptesParRole.ADMIN ?? 0,
                  teinte: TEINTE_ROLE.ADMIN,
                },
                {
                  label: desactives > 1 ? "désactivés" : "désactivé",
                  valeur: desactives,
                },
              ]
            : undefined
        }
      />

      <ConsoleToolbar>
        <ConsoleSearch
          valeur={search}
          onChange={(valeur) => {
            // Retour à la première page dans le gestionnaire plutôt que dans un
            // effet : enchaîner un setState sur un changement de dépendance
            // provoquerait un rendu en cascade et une requête sur une page qui
            // n'existe plus dans le nouveau jeu de résultats.
            setSearch(valeur);
            setPage(1);
          }}
          placeholder="Nom, prénom, adresse email…"
          label="Rechercher un utilisateur"
          enCours={isFetching && !isLoading}
        />

        <ConsoleFiltre<FiltreRole>
          label="Filtrer par rôle"
          valeur={role}
          onChange={(valeur) => {
            // Même raison que pour la recherche : la page 30 d'un filtre qui
            // n'en compte qu'une n'existe pas.
            setRole(valeur);
            setPage(1);
          }}
          options={[
            { valeur: "", libelle: "Tous" },
            ...(Object.keys(ROLE_LABELS) as Role[]).map((valeur) => ({
              valeur: valeur as FiltreRole,
              libelle: ROLE_LABELS[valeur],
              compte: comptesParRole[valeur] ?? 0,
              teinte: TEINTE_ROLE[valeur],
            })),
          ]}
        />
      </ConsoleToolbar>

      <ConsoleTable
        lignes={utilisateurs}
        colonnes={colonnes}
        cle={(utilisateur) => utilisateur.id}
        chargement={isLoading}
        rail={(utilisateur) =>
          utilisateur.isActive
            ? TEINTE_ROLE[utilisateur.role]
            : "var(--muted-foreground)"
        }
        onLigneClick={(utilisateur) =>
          router.push(`/admin/utilisateurs/${utilisateur.id}`)
        }
        vide={
          <EmptyState
            icon={rechercheDifferee || role ? Users : ShieldCheck}
            couleur={TEINTE}
            title={
              rechercheDifferee || role
                ? "Aucun compte ne correspond"
                : "Aucun utilisateur"
            }
            description={
              rechercheDifferee
                ? "Essayez une autre orthographe, ou recherchez sur l'adresse email."
                : role
                  ? "Aucun compte n'a ce rôle sur la plateforme."
                  : "Les comptes apparaîtront ici dès la première inscription."
            }
            action={
              rechercheDifferee || role ? (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setSearch("");
                    setRole("");
                    setPage(1);
                  }}
                >
                  Effacer les filtres
                </Button>
              ) : (
                <Button className="rounded-xl" render={<Link href="/admin/utilisateurs/import" />}>
                  <FileUp className="size-4" />
                  Importer des comptes
                </Button>
              )
            }
          />
        }
      />

      <ConsolePagination
        page={page}
        total={meta?.totalPages ?? 1}
        onChange={setPage}
      />
    </>
  );
}
