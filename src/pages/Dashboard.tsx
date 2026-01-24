import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Tooltip } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { cvService, dashboardService } from "@/services";
import type { Offre, CV } from "@/types";
import {
  Briefcase,
  FileText,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Clock,
  MapPin,
  Building2,
  Heart,
  HelpCircle,
} from "lucide-react";
import { formatRelativeDate, truncate } from "@/lib/utils";

const typeOffreLabels: Record<string, string> = {
  EMPLOI: "Emploi",
  FORMATION: "Formation",
  BOURSE: "Bourse",
};

const typeOffreColors: Record<string, string> = {
  EMPLOI: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  FORMATION: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  BOURSE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export function Dashboard() {
  const { user } = useAuth();
  const [recentOffres, setRecentOffres] = useState<Offre[]>([]);
  const [cv, setCV] = useState<CV | null>(null);
  const [stats, setStats] = useState({
    totalOffres: 0,
    totalFavorites: 0,
    totalRetours: 0,
    offresByType: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardStats, cvRes] = await Promise.all([
          dashboardService.getStats(),
          cvService.getMyCV(),
        ]);
        setStats({
          totalOffres: dashboardStats.totalOffres,
          totalFavorites: dashboardStats.totalFavorites,
          totalRetours: dashboardStats.totalRetours,
          offresByType: dashboardStats.offresByType,
        });
        setRecentOffres(dashboardStats.recentOffres);
        setCV(cvRes.cv);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const profileCompletion = calculateProfileCompletion(user, cv);

  return (
    <div>
      <Header
        title={`Bonjour, ${user?.firstName || user?.username} 👋`}
        subtitle="Bienvenue sur votre tableau de bord"
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children perspective-container">
          <Tooltip content="Nombre total d'offres d'emploi, formations et bourses disponibles sur la plateforme" position="bottom">
            <Card className="card-3d cursor-help w-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Offres disponibles
                      <HelpCircle className="h-3 w-3 opacity-50" />
                    </p>
                    <p className="text-2xl font-bold">{stats.totalOffres}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center animate-float">
                    <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Tooltip>

          <Tooltip content="Offres que vous avez sauvegardées pour les consulter plus tard" position="bottom">
            <Card className="card-3d cursor-help w-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Mes favoris
                      <HelpCircle className="h-3 w-3 opacity-50" />
                    </p>
                    <p className="text-2xl font-bold">{stats.totalFavorites}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Tooltip>

          <Tooltip content="Vos candidatures et retours d'expérience partagés avec la communauté" position="bottom">
            <Card className="card-3d cursor-help w-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Mes retours
                      <HelpCircle className="h-3 w-3 opacity-50" />
                    </p>
                    <p className="text-2xl font-bold">{stats.totalRetours}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Tooltip>

          <Tooltip content="Votre CV en ligne permet aux recruteurs de mieux vous connaître" position="bottom">
            <Card className="card-3d cursor-help w-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Mon CV
                      <HelpCircle className="h-3 w-3 opacity-50" />
                    </p>
                    <p className="text-2xl font-bold">{cv ? "Complet" : "À créer"}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Tooltip>

          <Tooltip content="Un profil complet augmente vos chances d'être remarqué par les recruteurs" position="bottom">
            <Card className="card-3d cursor-help w-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Profil complété
                      <HelpCircle className="h-3 w-3 opacity-50" />
                    </p>
                    <p className="text-2xl font-bold">{profileCompletion}%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Tooltip>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Offers */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Offres récentes</CardTitle>
                <Link to="/offres">
                  <Button variant="ghost" size="sm">
                    Voir tout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : recentOffres.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune offre disponible pour le moment
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOffres.map((offre) => (
                      <Link
                        key={offre.id}
                        to={`/offres/${offre.id}`}
                        className="block p-4 rounded-lg border hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={typeOffreColors[offre.typeOffre]}>
                                {typeOffreLabels[offre.typeOffre]}
                              </Badge>
                              {offre.typeEmploi && (
                                <Badge variant="outline">{offre.typeEmploi}</Badge>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {offre.titre}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {truncate(offre.description, 100)}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {offre.entreprise && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {offre.entreprise}
                                </span>
                              )}
                              {offre.localisation && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {offre.localisation}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeDate(offre.datePublication)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/cv" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    {cv ? "Modifier mon CV" : "Créer mon CV"}
                  </Button>
                </Link>
                <Link to="/offres" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Parcourir les offres
                  </Button>
                </Link>
                <Link to="/chatbot" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Parler à l'assistant IA
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card>
              <CardHeader>
                <CardTitle>Compléter mon profil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{profileCompletion}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {!user?.firstName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-orange-400" />
                      Ajouter votre prénom
                    </div>
                  )}
                  {!cv && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-orange-400" />
                      Créer votre CV
                    </div>
                  )}
                  {!user?.pictureUrl && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-orange-400" />
                      Ajouter une photo de profil
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateProfileCompletion(user: any, cv: CV | null): number {
  let score = 0;
  const total = 6;

  if (user?.email) score++;
  if (user?.username) score++;
  if (user?.firstName) score++;
  if (user?.lastName) score++;
  if (user?.pictureUrl) score++;
  if (cv) score++;

  return Math.round((score / total) * 100);
}
