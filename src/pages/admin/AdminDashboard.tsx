import { useEffect, useState } from "react";
import { Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { adminService } from "@/services";
import type { DisaggregationStats } from "@/services/adminService";
import type { Statistics } from "@/types";
import {
  Users,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Award,
  Heart,
  Calendar,
  MapPin,
} from "lucide-react";

const genderColors: Record<string, string> = {
  hommes: "bg-blue-500",
  femmes: "bg-pink-500",
  autres: "bg-purple-500",
  nonPrecise: "bg-gray-400",
};

const genderLabels: Record<string, string> = {
  hommes: "Hommes",
  femmes: "Femmes",
  autres: "Autres",
  nonPrecise: "Non précisé",
};

const ageColors = [
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-gray-400",
];

export function AdminDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [disaggregation, setDisaggregation] = useState<DisaggregationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsData, disaggregationData] = await Promise.all([
          adminService.getStatistics(),
          adminService.getDisaggregationStats(),
        ]);
        setStats(statsData);
        setDisaggregation(disaggregationData);
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

        {/* Disaggregation Section */}
        {disaggregation && (
          <>
            <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Données désagrégées des utilisateurs
            </h2>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Gender Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Répartition par sexe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(disaggregation.gender)
                      .filter(([key]) => key !== "total")
                      .map(([key, value]) => {
                        const percentage = disaggregation.gender.total > 0
                          ? Math.round((value / disaggregation.gender.total) * 100)
                          : 0;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{genderLabels[key]}</span>
                              <span className="text-muted-foreground">{value} ({percentage}%)</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${genderColors[key]} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total</span>
                      <span>{disaggregation.gender.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Disability Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4" />
                    Situation de handicap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-8 py-4">
                    <div className="text-center">
                      <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl font-bold text-purple-600">
                          {disaggregation.handicap.avec}
                        </span>
                      </div>
                      <p className="text-sm font-medium">Avec handicap</p>
                      <p className="text-xs text-muted-foreground">
                        {disaggregation.handicap.total > 0
                          ? Math.round((disaggregation.handicap.avec / disaggregation.handicap.total) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl font-bold text-gray-600">
                          {disaggregation.handicap.sans}
                        </span>
                      </div>
                      <p className="text-sm font-medium">Sans handicap</p>
                      <p className="text-xs text-muted-foreground">
                        {disaggregation.handicap.total > 0
                          ? Math.round((disaggregation.handicap.sans / disaggregation.handicap.total) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    Répartition géographique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {disaggregation.geographic.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Aucune donnée disponible
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {disaggregation.geographic.slice(0, 5).map(({ pays, count }) => (
                        <div key={pays} className="flex justify-between items-center">
                          <span className="text-sm">{pays}</span>
                          <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Age Distribution */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Répartition par tranche d'âge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  {Object.entries(disaggregation.ageRanges).map(([range, count], index) => {
                    const total = Object.values(disaggregation.ageRanges).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={range} className="text-center">
                        <div className={`h-24 rounded-lg ${ageColors[index]} flex items-end justify-center pb-2 relative overflow-hidden`}>
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-white/20"
                            style={{ height: `${100 - percentage}%` }}
                          />
                          <span className="text-white font-bold text-xl relative z-10">{count}</span>
                        </div>
                        <p className="text-xs font-medium mt-2">{range}</p>
                        <p className="text-xs text-muted-foreground">{percentage}%</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
