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
  FileSpreadsheet,
  Send,
  X,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { exportUsersToExcel } from "@/lib/excelExport";

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
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [bulkMessageOpen, setBulkMessageOpen] = useState(false);
  const [bulkMessageContent, setBulkMessageContent] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);

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

  const toggleSelectUser = (userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    }
  };

  const handleSendBulkMessage = async () => {
    if (!bulkMessageContent.trim() || selectedUserIds.size === 0) return;
    setSendingBulk(true);
    try {
      const result = await adminService.sendBulkMessage(
        Array.from(selectedUserIds),
        bulkMessageContent.trim()
      );
      setBulkMessageOpen(false);
      setBulkMessageContent("");
      setSelectedUserIds(new Set());
      setModal({
        isOpen: true,
        type: "success",
        title: "Messages envoyés",
        message: result.message,
      });
    } catch (error) {
      console.error("Error sending bulk message:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible d'envoyer les messages.",
      });
    } finally {
      setSendingBulk(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const allUsers = await adminService.getUsersForExport();
      exportUsersToExcel(allUsers);
      setModal({
        isOpen: true,
        type: "success",
        title: "Export réussi",
        message: `${allUsers.length} utilisateurs exportés avec succès.`,
      });
    } catch (error) {
      console.error("Error exporting users:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible d'exporter les utilisateurs.",
      });
    } finally {
      setExporting(false);
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
        {/* Search, Export, and Bulk Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setBulkMessageOpen(true)}
                disabled={selectedUserIds.size === 0}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Envoyer message ({selectedUserIds.size})
              </Button>
              <Button
                variant="outline"
                onClick={handleExportAll}
                disabled={exporting || total === 0}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {exporting ? "Export en cours..." : `Exporter tout (${total})`}
              </Button>
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
                      <th className="px-2 py-3 text-center w-10">
                        <button onClick={toggleSelectAll} className="text-gray-500 hover:text-primary">
                          {selectedUserIds.size === users.length && users.length > 0 ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </th>
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
                        <td className="px-2 py-4 text-center">
                          <button onClick={() => toggleSelectUser(user.id)} className="text-gray-500 hover:text-primary">
                            {selectedUserIds.has(user.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
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

      {/* Bulk Message Modal */}
      {bulkMessageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Envoyer un message groupé
              </h3>
              <button
                onClick={() => { setBulkMessageOpen(false); setBulkMessageContent(""); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ce message sera envoyé à <strong>{selectedUserIds.size}</strong> utilisateur(s) sélectionné(s) via la messagerie privée.
            </p>
            <textarea
              value={bulkMessageContent}
              onChange={(e) => setBulkMessageContent(e.target.value)}
              placeholder="Écrivez votre message ici..."
              className="w-full h-32 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => { setBulkMessageOpen(false); setBulkMessageContent(""); }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSendBulkMessage}
                disabled={sendingBulk || !bulkMessageContent.trim()}
                className="gap-2"
              >
                {sendingBulk ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
