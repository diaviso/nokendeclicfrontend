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
} from "lucide-react";
import { formatRelativeDate, truncate } from "@/lib/utils";

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
  auteur?: {
    id: number;
    username: string;
    email: string;
  };
  _count?: {
    retours: number;
  };
}

const typeOffreColors: Record<string, string> = {
  EMPLOI: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  FORMATION: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  BOURSE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  VOLONTARIAT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const typeOffreLabels: Record<string, string> = {
  EMPLOI: "Emploi",
  FORMATION: "Formation",
  BOURSE: "Bourse",
  VOLONTARIAT: "Volontariat",
};

export function AdminOffres() {
  const navigate = useNavigate();
  const [offres, setOffres] = useState<AdminOffre[]>([]);
  const [loading, setLoading] = useState(true);
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
              </select>
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
