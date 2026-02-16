import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, Button, Input, Badge, AlertModal, ConfirmModal } from "@/components/ui";
import { adminService } from "@/services";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Mail,
  Calendar,
  Briefcase,
  MessageSquare,
  Eye,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

interface AdminUser {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  statutProfessionnel?: string;
  pictureUrl?: string;
  createdAt: string;
  _count?: {
    retours: number;
    offres: number;
  };
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  PARTENAIRE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  MEMBRE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  PARTENAIRE: "Partenaire",
  MEMBRE: "Membre",
};

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({ isOpen: false, type: "info", title: "", message: "" });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "warning" | "info";
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {}, type: "info" });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers(page, 20, search || undefined);
      setUsers(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await adminService.toggleUserActive(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
      setModal({
        isOpen: true,
        type: "success",
        title: "Statut modifié",
        message: `L'utilisateur ${user.username} a été ${!user.isActive ? "activé" : "désactivé"}.`,
      });
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible de modifier le statut de l'utilisateur.",
      });
    }
  };

  const handleChangeRole = async (user: AdminUser, newRole: string) => {
    try {
      await adminService.updateUserRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      setModal({
        isOpen: true,
        type: "success",
        title: "Rôle modifié",
        message: `Le rôle de ${user.username} a été changé en ${roleLabels[newRole]}.`,
      });
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible de modifier le rôle de l'utilisateur.",
      });
    }
  };

  const handleDelete = (user: AdminUser) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer l'utilisateur",
      message: `Êtes-vous sûr de vouloir supprimer ${user.username} ? Cette action est irréversible.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await adminService.deleteUser(user.id);
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setModal({
            isOpen: true,
            type: "success",
            title: "Utilisateur supprimé",
            message: `L'utilisateur ${user.username} a été supprimé.`,
          });
        } catch (error) {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setModal({
            isOpen: true,
            type: "error",
            title: "Erreur",
            message: "Impossible de supprimer l'utilisateur.",
          });
        }
      },
    });
  };

  return (
    <div>
      <Header title="Gestion des utilisateurs" subtitle={`${total} utilisateurs au total`} />

      <div className="p-6 space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email ou username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800 rounded" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Activité
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Inscription
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {user.pictureUrl ? (
                                <img src={user.pictureUrl} alt="" className="h-10 w-10 object-cover" />
                              ) : (
                                <UserIcon className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.username}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user, e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${roleColors[user.role]}`}
                          >
                            <option value="MEMBRE">Membre</option>
                            <option value="PARTENAIRE">Partenaire</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            className={
                              user.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                            }
                          >
                            {user.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {user._count?.offres || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {user._count?.retours || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatRelativeDate(user.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/admin/users/${user.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Voir les détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(user)}
                              title={user.isActive ? "Désactiver" : "Activer"}
                            >
                              {user.isActive ? (
                                <ToggleRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={modal.isOpen}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Supprimer"
      />
    </div>
  );
}
