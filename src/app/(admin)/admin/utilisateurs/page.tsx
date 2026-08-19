"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  ChevronRight,
  MoreHorizontal,
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
import { ROLE_LABELS, roleLabel } from "@/lib/enums";
import { formatDateShort, fullName } from "@/lib/format";
import type { Role, User } from "@/lib/types";

/** Teinte par rôle : la même dans le rail, la pastille et le filtre. */
const TEINTE_ROLE: Record<Role, string> = {
  ADMIN: "var(--destructive)",
  PARTENAIRE: "var(--chart-2)",
  MEMBRE: "var(--chart-1)",
};

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
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<FiltreRole>("");
  const [page, setPage] = useState(1);
  const rechercheDifferee = useDebounced(search);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "users", { search: rechercheDifferee, page }],
    queryFn: () => adminApi.users({ search: rechercheDifferee, page, limit: 20 }),
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

  const meta = data?.meta;
  const pageUtilisateurs = useMemo(() => data?.data ?? [], [data]);

  // Le filtre de rôle porte sur la page affichée, et non sur l'ensemble : le
  // backend ne l'accepte pas en paramètre. Le libellé le dit explicitement,
  // sinon un compte absent de la page en cours passerait pour inexistant.
  const utilisateurs = role
    ? pageUtilisateurs.filter((utilisateur) => utilisateur.role === role)
    : pageUtilisateurs;

  const comptesParRole = useMemo(
    () =>
      pageUtilisateurs.reduce(
        (acc, utilisateur) => {
          acc[utilisateur.role] = (acc[utilisateur.role] ?? 0) + 1;
          return acc;
        },
        {} as Record<Role, number>,
      ),
    [pageUtilisateurs],
  );

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
      className: "w-20",
      align: "right",
      cellule: (utilisateur) => (
        <div
          className="flex items-center justify-end gap-0.5"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg"
                  aria-label={`Actions sur ${fullName(utilisateur)}`}
                >
                  <MoreHorizontal className="size-4" />
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
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant={utilisateur.isActive ? "destructive" : undefined}
                onClick={() =>
                  basculerActif.mutate({
                    id: utilisateur.id,
                    isActive: !utilisateur.isActive,
                  })
                }
              >
                {utilisateur.isActive ? (
                  <>
                    <Ban className="size-4" />
                    Désactiver le compte
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Réactiver le compte
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
            aria-hidden
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="Utilisateurs"
        icon={Users}
        teinte="var(--chart-2)"
        description="Rôles, accès et fiches détaillées des comptes inscrits sur la plateforme."
        mesures={
          meta
            ? [
                { label: "comptes", valeur: meta.total, teinte: "var(--chart-2)" },
                {
                  label: "administrateurs sur cette page",
                  valeur: comptesParRole.ADMIN ?? 0,
                  teinte: "var(--destructive)",
                },
                {
                  label: "désactivés sur cette page",
                  valeur: pageUtilisateurs.filter((u) => !u.isActive).length,
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
          onChange={setRole}
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

      {role ? (
        <p className="mb-3 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <UserCog className="size-3.5" aria-hidden />
          Le filtre de rôle s&apos;applique aux {pageUtilisateurs.length} comptes
          de cette page. Utilisez la recherche pour balayer l&apos;ensemble.
        </p>
      ) : null}

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
            couleur="var(--chart-2)"
            title={
              rechercheDifferee || role
                ? "Aucun compte ne correspond"
                : "Aucun utilisateur"
            }
            description={
              rechercheDifferee
                ? "Essayez une autre orthographe, ou recherchez sur l'adresse email."
                : role
                  ? "Aucun compte de ce rôle sur la page affichée."
                  : "Les comptes apparaîtront ici dès la première inscription."
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
