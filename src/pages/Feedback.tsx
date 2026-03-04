import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Badge, AlertModal } from "@/components/ui";
import { feedbackService } from "@/services";
import type { Feedback, FeedbackCategory } from "@/services/feedbackService";
import {
  Bug,
  Lightbulb,
  HelpCircle,
  MessageCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  Send,
  ArrowRight,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

const categoryOptions: { value: FeedbackCategory; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { value: "BUG", label: "Bug", icon: Bug, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", description: "Quelque chose ne fonctionne pas correctement" },
  { value: "AMELIORATION", label: "Amélioration", icon: Lightbulb, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", description: "Suggestion pour améliorer la plateforme" },
  { value: "QUESTION", label: "Question", icon: HelpCircle, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", description: "Besoin d'aide ou d'éclaircissement" },
  { value: "AUTRE", label: "Autre", icon: MessageCircle, color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300", description: "Autre type de retour" },
];

const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  OUVERT: { label: "Ouvert", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  EN_COURS: { label: "En cours", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Loader2 },
  RESOLU: { label: "Résolu", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  FERME: { label: "Fermé", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400", icon: X },
};

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    categorie: "" as FeedbackCategory | "",
    pageUrl: "",
  });

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({ isOpen: false, type: "info", title: "", message: "" });

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await feedbackService.getMyFeedbacks(page, 10);
      setFeedbacks(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titre.trim() || !formData.description.trim() || !formData.categorie) {
      setModal({
        isOpen: true,
        type: "warning",
        title: "Champs requis",
        message: "Veuillez remplir le titre, la description et sélectionner une catégorie.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await feedbackService.create({
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        categorie: formData.categorie as FeedbackCategory,
        pageUrl: formData.pageUrl.trim() || undefined,
      });
      setModal({
        isOpen: true,
        type: "success",
        title: "Feedback envoyé !",
        message: "Merci pour votre retour. Un administrateur le traitera dans les plus brefs délais.",
      });
      setFormData({ titre: "", description: "", categorie: "", pageUrl: "" });
      setShowForm(false);
      setPage(1);
      fetchFeedbacks();
    } catch (error) {
      console.error("Error creating feedback:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible d'envoyer votre feedback. Veuillez réessayer.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header
        title="Feedback"
        subtitle="Aidez-nous à améliorer la plateforme en partageant vos retours"
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* New Feedback Button */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau feedback
          </Button>
        )}

        {/* New Feedback Form */}
        {showForm && (
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Nouveau feedback</CardTitle>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Type de feedback <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categoryOptions.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = formData.categorie === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, categorie: cat.value })}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <Icon className={`h-5 w-5 mb-2 ${isSelected ? "text-primary" : "text-gray-400"}`} />
                          <p className={`text-sm font-medium ${isSelected ? "text-primary" : "text-gray-700 dark:text-gray-300"}`}>
                            {cat.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    placeholder="Résumez votre feedback en une phrase..."
                    maxLength={200}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Description détaillée <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez le problème ou votre suggestion en détail. Plus vous êtes précis, plus nous pourrons agir rapidement..."
                    rows={5}
                  />
                </div>

                {/* Page URL */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Page concernée <span className="text-muted-foreground">(optionnel)</span>
                  </label>
                  <Input
                    value={formData.pageUrl}
                    onChange={(e) => setFormData({ ...formData, pageUrl: e.target.value })}
                    placeholder="Ex: /offres, /messagerie, /profil..."
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting} className="gap-2">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Feedbacks List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Mes feedbacks {total > 0 && <span className="text-muted-foreground font-normal">({total})</span>}
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Aucun feedback pour le moment</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Vous n'avez pas encore envoyé de feedback. Faites-nous part de vos observations !
                </p>
                {!showForm && (
                  <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Envoyer mon premier feedback
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((fb) => {
                const catInfo = categoryOptions.find((c) => c.value === fb.categorie);
                const statInfo = statusLabels[fb.statut];
                const CatIcon = catInfo?.icon || MessageCircle;
                const StatIcon = statInfo?.icon || Clock;

                return (
                  <Link key={fb.id} to={`/feedback/${fb.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${catInfo?.color || "bg-gray-100"}`}>
                            <CatIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                {fb.titre}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                              {fb.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <Badge className={statInfo?.color || ""}>
                                <StatIcon className="h-3 w-3 mr-1" />
                                {statInfo?.label || fb.statut}
                              </Badge>
                              <Badge className={catInfo?.color || ""}>
                                {catInfo?.label || fb.categorie}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeDate(fb.createdAt)}
                              </span>
                              {(fb._count?.reponses || 0) > 0 && (
                                <span className="flex items-center gap-1 text-primary font-medium">
                                  <MessageCircle className="h-3 w-3" />
                                  {fb._count?.reponses} réponse(s)
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
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
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertModal
        isOpen={modal.isOpen}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}
