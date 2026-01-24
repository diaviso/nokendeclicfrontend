import { useEffect, useState } from "react";
import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { adminService } from "@/services";
import type { Statistics } from "@/types";
import {
  Users,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Award,
} from "lucide-react";

export function AdminDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStatistics();
        setStats(data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div>
        <Header title="Administration" subtitle="Statistiques de la plateforme" />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <Header title="Administration" subtitle="Statistiques de la plateforme" />
        <div className="p-6 text-center text-muted-foreground">
          Erreur lors du chargement des statistiques
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Administration" subtitle="Statistiques de la plateforme" />

      <div className="p-6 space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateurs</p>
                  <p className="text-3xl font-bold">{stats.totals.users}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{stats.thisMonth.newUsers} ce mois
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Offres</p>
                  <p className="text-3xl font-bold">{stats.totals.offres}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{stats.thisMonth.newOffres} ce mois
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Candidatures</p>
                  <p className="text-3xl font-bold">{stats.totals.retours}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{stats.thisMonth.newRetours} ce mois
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux conversion</p>
                  <p className="text-3xl font-bold">
                    {stats.totals.offres > 0
                      ? Math.round((stats.totals.retours / stats.totals.offres) * 100)
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Candidatures / Offres
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Offers by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Offres par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.offresByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          type === "EMPLOI"
                            ? "bg-blue-500"
                            : type === "FORMATION"
                            ? "bg-green-500"
                            : "bg-purple-500"
                        }`}
                      />
                      <span className="text-sm font-medium">{type}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Offers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top offres (candidatures)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topOffres.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Aucune donnée disponible
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.topOffres.map((offre, index) => (
                    <div key={offre.id} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{offre.titre}</p>
                        <p className="text-xs text-muted-foreground">{offre.auteur}</p>
                      </div>
                      <span className="text-sm font-medium">{offre.retoursCount}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Offers by Sector */}
        <Card>
          <CardHeader>
            <CardTitle>Offres par secteur</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.offresBySecteur.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Aucune donnée disponible
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stats.offresBySecteur.map(({ secteur, count }) => (
                  <div key={secteur} className="p-4 rounded-lg bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{secteur}</p>
                    <p className="text-2xl font-bold text-primary">{count}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
