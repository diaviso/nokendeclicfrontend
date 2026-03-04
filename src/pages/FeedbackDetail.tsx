import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Textarea, AlertModal } from "@/components/ui";
import { feedbackService } from "@/services";
import type { Feedback, FeedbackReponse } from "@/services/feedbackService";
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  HelpCircle,
  MessageCircle,
  Clock,
  CheckCircle2,
  Loader2,
  X,
  Send,
  User,
  Shield,
  ExternalLink,
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

export function FeedbackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({ isOpen: false, type: "info", title: "", message: "" });

  useEffect(() => {
    if (!id) return;
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const data = await feedbackService.getById(parseInt(id));
        setFeedback(data);
      } catch (error) {
        console.error("Error fetching feedback:", error);
        setModal({
          isOpen: true,
          type: "error",
          title: "Erreur",
          message: "Impossible de charger le feedback.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [id]);

  const handleReply = async () => {
    if (!replyContent.trim() || !id) return;
    setSending(true);
    try {
      const newReponse = await feedbackService.addReponse(parseInt(id), replyContent.trim());
      setFeedback((prev) => {
        if (!prev) return prev;
        return { ...prev, reponses: [...(prev.reponses || []), newReponse] };
      });
      setReplyContent("");
    } catch (error) {
      console.error("Error sending reply:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Impossible d'envoyer la réponse.",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Feedback" subtitle="Chargement..." />
        <div className="p-6 max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div>
        <Header title="Feedback" subtitle="Non trouvé" />
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Ce feedback n'existe pas ou vous n'y avez pas accès.</p>
          <Button onClick={() => navigate("/feedback")} variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const cat = categoryConfig[feedback.categorie];
  const stat = statusConfig[feedback.statut];
  const CatIcon = cat?.icon || MessageCircle;
  const StatIcon = stat?.icon || Clock;
  const isClosed = feedback.statut === "FERME" || feedback.statut === "RESOLU";

  return (
    <div>
      <Header title="Détail du feedback" subtitle={feedback.titre} />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <Button onClick={() => navigate("/feedback")} variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux feedbacks
        </Button>

        {/* Feedback Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${cat?.color || "bg-gray-100"}`}>
                  <CatIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{feedback.titre}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Envoyé {formatRelativeDate(feedback.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cat?.color || ""}>
                  {cat?.label || feedback.categorie}
                </Badge>
                <Badge className={stat?.color || ""}>
                  <StatIcon className="h-3 w-3 mr-1" />
                  {stat?.label || feedback.statut}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
              {feedback.description}
            </div>
            {feedback.pageUrl && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                Page: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{feedback.pageUrl}</code>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation Thread */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Conversation ({feedback.reponses?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!feedback.reponses || feedback.reponses.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune réponse pour le moment. Un administrateur vous répondra bientôt.
              </p>
            ) : (
              feedback.reponses.map((rep: FeedbackReponse) => {
                const isAdmin = rep.auteur.role === "ADMIN";
                return (
                  <div
                    key={rep.id}
                    className={`flex gap-3 ${isAdmin ? "" : "flex-row-reverse"}`}
                  >
                    <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      isAdmin ? "bg-primary/10" : "bg-gray-100 dark:bg-gray-800"
                    }`}>
                      {rep.auteur.pictureUrl ? (
                        <img src={rep.auteur.pictureUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : isAdmin ? (
                        <Shield className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className={`max-w-[80%] ${isAdmin ? "" : "text-right"}`}>
                      <div className={`rounded-xl px-4 py-2.5 ${
                        isAdmin
                          ? "bg-primary/5 border border-primary/10"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {rep.auteur.firstName || rep.auteur.username}
                            {isAdmin && (
                              <Badge className="ml-1 text-[10px] px-1 py-0 bg-primary/10 text-primary">
                                Admin
                              </Badge>
                            )}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{rep.contenu}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeDate(rep.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {/* Reply form */}
            {!isClosed ? (
              <div className="flex gap-2 pt-4 border-t">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Ajouter un message..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleReply}
                  disabled={sending || !replyContent.trim()}
                  size="icon"
                  className="shrink-0 self-end"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="text-center py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Ce feedback est {feedback.statut === "RESOLU" ? "résolu" : "fermé"}. Vous ne pouvez plus y répondre.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
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
