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
  Sparkles,
  Rocket,
  Target,
  Zap,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const GENDER_COLORS = ["#3B82F6", "#EC4899", "#8B5CF6", "#9CA3AF"];
const AGE_COLORS = ["#10B981", "#14B8A6", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#9CA3AF"];
const HANDICAP_COLORS = ["#8B5CF6", "#D1D5DB"];
const OFFER_TYPE_COLORS: Record<string, string> = {
  EMPLOI: "#3B82F6",
  FORMATION: "#10B981",
  BOURSE: "#8B5CF6",
  VOLONTARIAT: "#F59E0B",
};


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
        {/* Animated 3D Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-1">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-pulse opacity-75" />
          <div className="relative rounded-xl bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-xl p-6 md:p-8">
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-4 left-[10%] w-2 h-2 bg-yellow-400 rounded-full animate-bounce opacity-80" style={{ animationDelay: '0s', animationDuration: '2s' }} />
              <div className="absolute top-8 left-[25%] w-3 h-3 bg-pink-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.3s', animationDuration: '2.5s' }} />
              <div className="absolute top-6 left-[45%] w-2 h-2 bg-cyan-400 rounded-full animate-bounce opacity-70" style={{ animationDelay: '0.6s', animationDuration: '1.8s' }} />
              <div className="absolute top-10 left-[65%] w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce opacity-75" style={{ animationDelay: '0.9s', animationDuration: '2.2s' }} />
              <div className="absolute top-4 left-[80%] w-2 h-2 bg-orange-400 rounded-full animate-bounce opacity-65" style={{ animationDelay: '1.2s', animationDuration: '2.8s' }} />
              <div className="absolute bottom-8 left-[15%] w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.2s' }} />
              <div className="absolute bottom-6 left-[55%] w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '0.8s' }} />
              <div className="absolute bottom-10 left-[75%] w-1.5 h-1.5 bg-rose-400 rounded-full animate-ping opacity-50" style={{ animationDelay: '1.4s' }} />
            </div>

            {/* 3D rotating icons */}
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-20 hidden lg:block">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                  <Rocket className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-10 text-cyan-400 transform -rotate-45" />
                  <Target className="absolute bottom-0 left-1/2 -translate-x-1/2 h-10 w-10 text-pink-400" />
                  <Zap className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-10 text-yellow-400" />
                  <Sparkles className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              {/* Animated icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 opacity-50" />
                  <Sparkles className="h-10 w-10 md:h-12 md:w-12 text-white relative z-10 animate-pulse" />
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
                  <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
                    Bienvenue sur votre tableau de bord !
                  </span>
                </h3>
                <p className="text-lg text-gray-300 mb-3 max-w-2xl">
                  Un profil complet augmente les chances de vos utilisateurs de trouver des offres qui leur correspondent !
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-300 font-medium">{stats.totals.users} utilisateurs actifs</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-blue-300 font-medium">{stats.totals.offres} offres disponibles</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                    <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-purple-300 font-medium">{stats.totals.retours} retours partagés</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom gradient line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </div>

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

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Gender Distribution - Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Répartition par sexe</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const genderData = [
                      { name: "Hommes", value: disaggregation.gender.hommes, color: GENDER_COLORS[0] },
                      { name: "Femmes", value: disaggregation.gender.femmes, color: GENDER_COLORS[1] },
                      { name: "Autres", value: disaggregation.gender.autres, color: GENDER_COLORS[2] },
                      { name: "Non précisé", value: disaggregation.gender.nonPrecise, color: GENDER_COLORS[3] },
                    ].filter(d => d.value > 0);
                    
                    return (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={genderData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {genderData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} utilisateurs`, ""]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                  <div className="text-center mt-2 text-sm font-medium">
                    Total: {disaggregation.gender.total} utilisateurs
                  </div>
                </CardContent>
              </Card>

              {/* Disability Status - Donut Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4" />
                    Situation de handicap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const handicapData = [
                      { name: "Avec handicap", value: disaggregation.handicap.avec },
                      { name: "Sans handicap", value: disaggregation.handicap.sans },
                    ];
                    
                    return (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={handicapData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {handicapData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={HANDICAP_COLORS[index]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} utilisateurs`, ""]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              {/* Age Distribution - Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Répartition par tranche d'âge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const ageData = Object.entries(disaggregation.ageRanges).map(([range, count], index) => ({
                      name: range,
                      value: count,
                      fill: AGE_COLORS[index % AGE_COLORS.length],
                    }));
                    
                    return (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ageData} layout="vertical">
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => [`${value} utilisateurs`, ""]} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {ageData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Geographic Distribution - Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    Répartition géographique (Top 10)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {disaggregation.geographic.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Aucune donnée disponible
                    </p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={disaggregation.geographic.slice(0, 10)} layout="vertical">
                          <XAxis type="number" />
                          <YAxis dataKey="pays" type="category" width={100} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value) => [`${value} utilisateurs`, ""]} />
                          <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Offers by Type - Colorful Pie Chart */}
            {stats && Object.keys(stats.offresByType).length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Répartition des offres par type</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const offerData = Object.entries(stats.offresByType).map(([type, count]) => ({
                      name: type,
                      value: count,
                      fill: OFFER_TYPE_COLORS[type] || "#6B7280",
                    }));
                    
                    return (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={offerData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                            >
                              {offerData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} offres`, ""]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
