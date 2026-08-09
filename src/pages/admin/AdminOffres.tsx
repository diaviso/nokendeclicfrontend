import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, Button, Input, Badge, AlertModal, ConfirmModal } from "@/components/ui";
import { adminService } from "@/services";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  Calendar,
  MapPin,
  Building2,
  MessageSquare,
  Eye,
  Plus,
  Pencil,
  FileSpreadsheet,
  Lock,
  Unlock,
} from "lucide-react";
import { formatRelativeDate, truncate } from "@/lib/utils";
import { exportOffresToExcel } from "@/lib/excelExport";
import { TYPE_OFFRE_LABELS, TYPE_OFFRE_BADGE } from "@/lib/enums";

const typeOffreLabels = TYPE_OFFRE_LABELS as Record<string, string>;
const typeOffreColors = TYPE_OFFRE_BADGE as Record<string, string>;

interface AdminOffre {
  id: number;
  titre: string;
  description: string;
  typeOffre: string;
  typeEmploi?: string;
  localisation?: string;
  entreprise?: string;
  datePublication: string;
  dateLimite?: string;
  viewCount: number;
  estCloturee?: boolean;
  auteur?: {
    id: number;
    username: string;
    email: string;
  };
  _count?: {
    retours: number;
  };
}

export function AdminOffres() {
  const navigate = useNavigate();
  const [offres, setOffres] = useState<AdminOffre[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
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

  const fetchOffres = async () => {
    setLoading(true);
    try {
      const response = await adminService.getOffres(
        page,
        20,
        search || undefined,
        typeFilter || undefined
      );
      setOffres(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch (error) {
      console.error("Error fetching offres:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const allOffres = await adminService.getOffresForExport();
      exportOffresToExcel(allOffres);
      setModal({
        isOpen: true,
        type: "success",
        title: "Export réussi",
        message: `${allOffres.length} offres exportées avec succès.`,
      });
    } catch (error) {
      console.error("Error exporting offres:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible d'exporter les offres.",
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchOffres();
  }, [page, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchOffres();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = (offre: AdminOffre) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer l'offre",
      message: `Êtes-vous sûr de vouloir supprimer "${offre.titre}" ? Cette action est irréversible.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await adminService.deleteOffre(offre.id);
          setOffres((prev) => prev.filter((o) => o.id !== offre.id));
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setModal({
            isOpen: true,
            type: "success",
            title: "Offre supprimée",
            message: `L'offre "${offre.titre}" a été supprimée.`,
          });
        } catch (error) {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setModal({
            isOpen: true,
            type: "error",
            title: "Erreur",
            message: "Impossible de supprimer l'offre.",
          });
        }
      },
    });
  };

  const handleToggleCloture = async (offre: AdminOffre) => {
    try {
      const newStatus = !offre.estCloturee;
      await adminService.toggleOffreCloturee(offre.id, newStatus);
      setOffres((prev) =>
        prev.map((o) => (o.id === offre.id ? { ...o, estCloturee: newStatus } : o))
      );
      setModal({
        isOpen: true,
        type: "success",
        title: newStatus ? "Offre clôturée" : "Offre rouverte",
        message: `L'offre "${offre.titre}" a été ${newStatus ? "clôturée" : "rouverte"}.`,
      });
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible de modifier le statut de l'offre.",
      });
    }
  };

  return (
    <div>
      <Header title="Gestion des offres" subtitle={`${total} offres au total`} />

      <div className="p-6 space-y-6">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des offres</h2>
          <Button onClick={() => navigate("/admin/offres/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle offre
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par titre, entreprise..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Tous les types</option>
                <option value="EMPLOI">Emploi</option>
                <option value="FORMATION">Formation</option>
                <option value="BOURSE">Bourse</option>
                <option value="VOLONTARIAT">Volontariat</option>
                <option value="PROGRAMME">Programme</option>
              </select>
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

        {/* Offres List */}
        <div className="space-y-4">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded" />
                </CardContent>
              </Card>
            ))
          ) : offres.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune offre trouvée
              </CardContent>
            </Card>
          ) : (
            offres.map((offre) => (
              <Card key={offre.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={typeOffreColors[offre.typeOffre]}>
                          {typeOffreLabels[offre.typeOffre]}
                        </Badge>
                        {offre.typeEmploi && (
                          <Badge variant="outline">{offre.typeEmploi}</Badge>
                        )}
                        {offre.estCloturee && (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Clôturée
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {offre.titre}
                      </h3>

                      <p className="text-sm text-muted-foreground mb-3">
                        {truncate(offre.description, 150)}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {offre.entreprise && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {offre.entreprise}
                          </span>
                        )}
                        {offre.localisation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {offre.localisation}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatRelativeDate(offre.datePublication)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {offre.viewCount} vues
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {offre._count?.retours || 0} candidatures
                        </span>
                      </div>

                      {offre.auteur && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Publié par: {offre.auteur.username} ({offre.auteur.email})
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link to={`/offres/${offre.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/offres/${offre.id}/edit`)}
                        className="w-full"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCloture(offre)}
                        className={offre.estCloturee 
                          ? "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 w-full"
                          : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 w-full"
                        }
                      >
                        {offre.estCloturee ? (
                          <>
                            <Unlock className="h-4 w-4 mr-1" />
                            Rouvrir
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-1" />
                            Clôturer
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(offre)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

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
