import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Textarea } from "@/components/ui";
import { offresService, retoursService, favoritesService } from "@/services";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Offre, Retour } from "@/types";

interface Commentaire {
  id: number;
  contenu: string;
  datePublication: string;
  auteur: {
    id: number;
    username: string;
    pictureUrl: string | null;
  };
}
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  Heart,
  ExternalLink,
  Send,
  Briefcase,
  GraduationCap,
  Award,
  HandHeart,
  Calendar,
  DollarSign,
  Users,
  FileText,
  MessageCircle,
  Loader2,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const typeOffreLabels: Record<string, string> = {
  EMPLOI: "Emploi",
  FORMATION: "Formation",
  BOURSE: "Bourse",
  VOLONTARIAT: "Volontariat",
};

const typeOffreColors: Record<string, string> = {
  EMPLOI: "bg-blue-100 text-blue-800",
  FORMATION: "bg-green-100 text-green-800",
  BOURSE: "bg-purple-100 text-purple-800",
  VOLONTARIAT: "bg-orange-100 text-orange-800",
};

const typeOffreIcons: Record<string, React.ElementType> = {
  EMPLOI: Briefcase,
  FORMATION: GraduationCap,
  BOURSE: Award,
  VOLONTARIAT: HandHeart,
};

export function OffreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth();
  const [offre, setOffre] = useState<Offre | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [retourContent, setRetourContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmittedRetour, setHasSubmittedRetour] = useState(false);
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    const fetchOffre = async () => {
      if (!id) return;
      try {
        const [offreData, favStatus, myRetours, commentsData] = await Promise.all([
          offresService.getById(parseInt(id)),
          favoritesService.isFavorite(parseInt(id)),
          retoursService.getMyRetours(),
          api.get(`/api/commentaires/offre/${id}`),
        ]);
        setOffre(offreData);
        setIsFavorite(favStatus);
        setHasSubmittedRetour(myRetours.some((r: Retour) => r.offre?.id === parseInt(id)));
        setCommentaires(commentsData.data);
      } catch (error) {
        console.error("Error fetching offre:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffre();
  }, [id]);

  const toggleFavorite = async () => {
    if (!offre) return;
    try {
      if (isFavorite) {
        await favoritesService.remove(offre.id);
      } else {
        await favoritesService.add(offre.id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleSubmitRetour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offre || !retourContent.trim()) return;

    setSubmitting(true);
    try {
      await retoursService.create(offre.id, retourContent);
      setHasSubmittedRetour(true);
      setRetourContent("");
    } catch (error) {
      console.error("Error submitting retour:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offre || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await api.post("/api/commentaires", {
        contenu: newComment,
        offreId: offre.id,
      });
      setCommentaires([response.data, ...commentaires]);
      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.delete(`/api/commentaires/${commentId}`);
      setCommentaires(commentaires.filter(c => c.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Chargement..." />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!offre) {
    return (
      <div>
        <Header title="Offre non trouvée" />
        <div className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Cette offre n'existe pas ou a été supprimée.</p>
          <Button onClick={() => navigate("/offres")}>Retour aux offres</Button>
        </div>
      </div>
    );
  }

  const Icon = typeOffreIcons[offre.typeOffre];

  return (
    <div>
      <Header title="Détail de l'offre" />

      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge className={cn("text-sm", typeOffreColors[offre.typeOffre])}>
                      <Icon className="h-4 w-4 mr-1" />
                      {typeOffreLabels[offre.typeOffre]}
                    </Badge>
                    {offre.typeEmploi && <Badge variant="outline">{offre.typeEmploi}</Badge>}
                    {offre.secteur && <Badge variant="secondary">{offre.secteur}</Badge>}
                  </div>
                  <button
                    onClick={toggleFavorite}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Heart
                      className={cn(
                        "h-6 w-6 transition-colors",
                        isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
                      )}
                    />
                  </button>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">{offre.titre}</h1>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
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
                    <Clock className="h-4 w-4" />
                    Publié le {formatDate(offre.datePublication)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {offre.viewCount} vues
                  </span>
                </div>

                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="whitespace-pre-wrap text-gray-700">{offre.description}</p>
                </div>

                {offre.tags && offre.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2">Compétences requises</h3>
                    <div className="flex flex-wrap gap-2">
                      {offre.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External Application Link */}
            {offre.url && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <ExternalLink className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Postuler à cette offre</h3>
                      <p className="text-sm text-muted-foreground">
                        Cliquez sur le bouton pour accéder au site de dépôt de candidature
                      </p>
                    </div>
                    <a href={offre.url} target="_blank" rel="noopener noreferrer">
                      <Button size="lg" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Postuler
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Commentaires ({commentaires.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <Textarea
                    placeholder="Partagez votre avis sur cette offre..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="mb-3"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                      {submittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Publier
                    </Button>
                  </div>
                </form>

                <div className="space-y-4">
                  {commentaires.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Aucun commentaire pour le moment. Soyez le premier à commenter !
                    </p>
                  ) : (
                    commentaires.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {comment.auteur.pictureUrl ? (
                            <img src={comment.auteur.pictureUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-primary">
                              {comment.auteur.username[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{comment.auteur.username}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.datePublication)}
                              </span>
                              {(user?.id === comment.auteur.id || isAdmin) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1 hover:bg-red-100 rounded text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.contenu}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feedback/Retour Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Partager votre expérience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Vous avez postulé à cette offre ? Partagez votre retour d'expérience avec les administrateurs.
                  Ces retours nous aident à améliorer la qualité des offres partagées.
                </p>
                {hasSubmittedRetour ? (
                  <div className="text-center py-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-green-800 dark:text-green-400">Merci pour votre retour !</p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Votre expérience a été partagée avec les administrateurs.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRetour}>
                    <Textarea
                      placeholder="Ex: J'ai postulé et j'ai été sélectionné pour un entretien. Merci pour le partage !"
                      value={retourContent}
                      onChange={(e) => setRetourContent(e.target.value)}
                      rows={4}
                      className="mb-3"
                    />
                    <div className="flex justify-end">
                      <Button type="submit" variant="outline" disabled={submitting || !retourContent.trim()}>
                        {submitting ? "Envoi..." : "Envoyer mon retour"}
                        <Send className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offre.dateLimite && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Date limite</p>
                      <p className="text-sm text-muted-foreground">{formatDate(offre.dateLimite)}</p>
                    </div>
                  </div>
                )}

                {(offre.salaireMin || offre.salaireMax) && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Salaire</p>
                      <p className="text-sm text-muted-foreground">
                        {offre.salaireMin && offre.salaireMax
                          ? `${offre.salaireMin.toLocaleString()} - ${offre.salaireMax.toLocaleString()} ${offre.devise || "FCFA"}`
                          : offre.salaireMin
                          ? `À partir de ${offre.salaireMin.toLocaleString()} ${offre.devise || "FCFA"}`
                          : `Jusqu'à ${offre.salaireMax?.toLocaleString()} ${offre.devise || "FCFA"}`}
                      </p>
                    </div>
                  </div>
                )}

                {offre.niveauExperience && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Expérience</p>
                      <p className="text-sm text-muted-foreground">{offre.niveauExperience}</p>
                    </div>
                  </div>
                )}

                {offre.montantBourse && (
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Montant de la bourse</p>
                      <p className="text-sm text-muted-foreground">
                        {offre.montantBourse.toLocaleString()} {offre.devise || "FCFA"}
                      </p>
                    </div>
                  </div>
                )}

                {offre.dureeFormation && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Durée de formation</p>
                      <p className="text-sm text-muted-foreground">{offre.dureeFormation} mois</p>
                    </div>
                  </div>
                )}

                {offre.typeVolontariat && (
                  <div className="flex items-center gap-3">
                    <HandHeart className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Type de volontariat</p>
                      <p className="text-sm text-muted-foreground">{offre.typeVolontariat}</p>
                    </div>
                  </div>
                )}

                {offre.dureeVolontariat && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Durée du volontariat</p>
                      <p className="text-sm text-muted-foreground">{offre.dureeVolontariat} mois</p>
                    </div>
                  </div>
                )}

                {offre.indemnite && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Indemnité</p>
                      <p className="text-sm text-muted-foreground">
                        {offre.indemnite.toLocaleString()} {offre.devise || "FCFA"}
                      </p>
                    </div>
                  </div>
                )}

                {offre.hebergement !== undefined && offre.hebergement !== null && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Hébergement</p>
                      <p className="text-sm text-muted-foreground">
                        {offre.hebergement ? "Fourni" : "Non fourni"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                {offre.url && (
                  <a href={offre.url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir l'offre originale
                    </Button>
                  </a>
                )}
                {offre.documentUrl && (
                  <a href={offre.documentUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Télécharger le document
                    </Button>
                  </a>
                )}
                <Button
                  variant={isFavorite ? "secondary" : "outline"}
                  className="w-full"
                  onClick={toggleFavorite}
                >
                  <Heart className={cn("h-4 w-4 mr-2", isFavorite && "fill-current")} />
                  {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                </Button>
              </CardContent>
            </Card>

            {/* Publisher */}
            <Card>
              <CardHeader>
                <CardTitle>Publié par</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {offre.auteur.pictureUrl ? (
                      <img
                        src={offre.auteur.pictureUrl}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-primary">
                        {offre.auteur.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{offre.auteur.username}</p>
                    <p className="text-xs text-muted-foreground">Partenaire Noken</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
