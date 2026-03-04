import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, Button, Input, AlertModal, ConfirmModal } from "@/components/ui";
import { feedbackService } from "@/services";
import type { Feedback, FeedbackStatus, FeedbackPriority } from "@/services/feedbackService";
import {
  Search,
  Bug,
  Lightbulb,
  HelpCircle,
  MessageCircle,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  BUG: { label: "Bug", icon: Bug, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  AMELIORATION: { label: "Amélioration", icon: Lightbulb, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  QUESTION: { label: "Question", icon: HelpCircle, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  AUTRE: { label: "Autre", icon: MessageCircle, color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  OUVERT: { label: "Ouvert", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  EN_COURS: { label: "En cours", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Loader2 },
  RESOLU: { label: "Résolu", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  FERME: { label: "Fermé", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400", icon: X },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  BASSE: { label: "Basse", color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" },
  MOYENNE: { label: "Moyenne", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  HAUTE: { label: "Haute", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CRITIQUE: { label: "Critique", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});

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

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await feedbackService.adminGetAll(
        page, 20,
        statusFilter || undefined,
        categoryFilter || undefined,
        search || undefined,
      );
      setFeedbacks(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
      if (res.stats) setStats(res.stats);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [page, statusFilter, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchFeedbacks();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (fb: Feedback, newStatus: FeedbackStatus) => {
    try {
      const updated = await feedbackService.adminUpdateStatus(fb.id, newStatus);
      setFeedbacks((prev) => prev.map((f) => (f.id === fb.id ? updated : f)));
      setModal({
        isOpen: true,
        type: "success",
        title: "Statut mis à jour",
        message: `Le feedback "${fb.titre}" est maintenant ${statusConfig[newStatus]?.label || newStatus}.`,
      });
    } catch (error) {
      setModal({ isOpen: true, type: "error", title: "Erreur", message: "Impossible de modifier le statut." });
    }
  };

  const handlePriorityChange = async (fb: Feedback, newPriority: FeedbackPriority) => {
    try {
      const updated = await feedbackService.adminUpdatePriority(fb.id, newPriority);
      setFeedbacks((prev) => prev.map((f) => (f.id === fb.id ? updated : f)));
    } catch (error) {
      setModal({ isOpen: true, type: "error", title: "Erreur", message: "Impossible de modifier la priorité." });
    }
  };

  const handleDelete = (fb: Feedback) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer le feedback",
      message: `Êtes-vous sûr de vouloir supprimer "${fb.titre}" ? Cette action est irréversible.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await feedbackService.adminDelete(fb.id);
          setFeedbacks((prev) => prev.filter((f) => f.id !== fb.id));
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setModal({ isOpen: true, type: "success", title: "Supprimé", message: "Le feedback a été supprimé." });
        } catch (error) {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setModal({ isOpen: true, type: "error", title: "Erreur", message: "Impossible de supprimer le feedback." });
        }
      },
    });
  };

  return (
    <div>
      <Header title="Gestion des feedbacks" subtitle={`${total} feedback(s) au total`} />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter(""); setPage(1); }}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-200" onClick={() => { setStatusFilter("OUVERT"); setPage(1); }}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats["OUVERT"] || 0}</p>
              <p className="text-xs text-muted-foreground">Ouverts</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-amber-200" onClick={() => { setStatusFilter("EN_COURS"); setPage(1); }}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats["EN_COURS"] || 0}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200" onClick={() => { setStatusFilter("RESOLU"); setPage(1); }}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats["RESOLU"] || 0}</p>
              <p className="text-xs text-muted-foreground">Résolus</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par titre, description, utilisateur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="">Tous les statuts</option>
                <option value="OUVERT">Ouvert</option>
                <option value="EN_COURS">En cours</option>
                <option value="RESOLU">Résolu</option>
                <option value="FERME">Fermé</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="">Toutes les catégories</option>
                <option value="BUG">Bug</option>
                <option value="AMELIORATION">Amélioration</option>
                <option value="QUESTION">Question</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded" />
                ))}
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Aucun feedback trouvé
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {feedbacks.map((fb) => {
                  const cat = categoryConfig[fb.categorie];
                  const stat = statusConfig[fb.statut];
                  const prio = priorityConfig[fb.priorite];
                  const CatIcon = cat?.icon || MessageCircle;

                  return (
                    <div key={fb.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg shrink-0 ${cat?.color || "bg-gray-100"}`}>
                          <CatIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Link to={`/admin/feedback/${fb.id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors truncate">
                              {fb.titre}
                            </Link>
                            {(fb._count?.reponses || 0) > 0 && (
                              <span className="text-xs text-primary flex items-center gap-0.5">
                                <MessageCircle className="h-3 w-3" />
                                {fb._count?.reponses}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{fb.description}</p>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {/* Status selector */}
                            <select
                              value={fb.statut}
                              onChange={(e) => handleStatusChange(fb, e.target.value as FeedbackStatus)}
                              className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${stat?.color || ""}`}
                            >
                              <option value="OUVERT">Ouvert</option>
                              <option value="EN_COURS">En cours</option>
                              <option value="RESOLU">Résolu</option>
                              <option value="FERME">Fermé</option>
                            </select>
                            {/* Priority selector */}
                            <select
                              value={fb.priorite}
                              onChange={(e) => handlePriorityChange(fb, e.target.value as FeedbackPriority)}
                              className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${prio?.color || ""}`}
                            >
                              <option value="BASSE">Basse</option>
                              <option value="MOYENNE">Moyenne</option>
                              <option value="HAUTE">Haute</option>
                              <option value="CRITIQUE">Critique</option>
                            </select>
                            <span className="text-muted-foreground">
                              par {fb.auteur.firstName || fb.auteur.username}
                              {fb.auteur.email && ` (${fb.auteur.email})`}
                            </span>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeDate(fb.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Link to={`/admin/feedback/${fb.id}`}>
                            <Button variant="ghost" size="icon" title="Voir le détail">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(fb)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

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
