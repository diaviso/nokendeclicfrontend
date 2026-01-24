import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, Button, Badge, Input, Select } from "@/components/ui";
import { offresService, favoritesService } from "@/services";
import type { Offre, OffresFilters, TypeOffre } from "@/types";
import {
  Search,
  Filter,
  MapPin,
  Building2,
  Clock,
  Heart,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Award,
} from "lucide-react";
import { formatRelativeDate, truncate, cn } from "@/lib/utils";

const typeOffreLabels: Record<string, string> = {
  EMPLOI: "Emploi",
  FORMATION: "Formation",
  BOURSE: "Bourse",
};

const typeOffreColors: Record<string, string> = {
  EMPLOI: "bg-blue-100 text-blue-800",
  FORMATION: "bg-green-100 text-green-800",
  BOURSE: "bg-purple-100 text-purple-800",
};

const typeOffreIcons: Record<string, React.ElementType> = {
  EMPLOI: Briefcase,
  FORMATION: GraduationCap,
  BOURSE: Award,
};

export function Offres() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const currentPage = parseInt(searchParams.get("page") || "1");
  const typeOffre = searchParams.get("typeOffre") as TypeOffre | null;
  const keyword = searchParams.get("keyword") || "";

  useEffect(() => {
    const fetchOffres = async () => {
      setLoading(true);
      try {
        const filters: OffresFilters = {
          page: currentPage,
          limit: 12,
        };
        if (typeOffre) filters.typeOffre = typeOffre;
        if (keyword) filters.keyword = keyword;

        const res = await offresService.getAll(filters);
        setOffres(res.data);
        setTotalPages(res.totalPages);

        // Fetch favorites
        const favs = await favoritesService.getAll();
        setFavorites(new Set(favs.map((f) => f.offre.id)));
      } catch (error) {
        console.error("Error fetching offres:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffres();
  }, [currentPage, typeOffre, keyword]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    setSearchParams((prev) => {
      prev.set("keyword", search);
      prev.set("page", "1");
      return prev;
    });
  };

  const handleTypeFilter = (type: TypeOffre | "") => {
    setSearchParams((prev) => {
      if (type) {
        prev.set("typeOffre", type);
      } else {
        prev.delete("typeOffre");
      }
      prev.set("page", "1");
      return prev;
    });
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      prev.set("page", String(page));
      return prev;
    });
  };

  const toggleFavorite = async (offreId: number) => {
    try {
      if (favorites.has(offreId)) {
        await favoritesService.remove(offreId);
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(offreId);
          return next;
        });
      } else {
        await favoritesService.add(offreId);
        setFavorites((prev) => new Set(prev).add(offreId));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <div>
      <Header title="Offres" subtitle="Découvrez les opportunités qui vous correspondent" />

      <div className="p-6">
        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  name="search"
                  placeholder="Rechercher par titre, entreprise, compétences..."
                  defaultValue={keyword}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Rechercher</Button>
            </form>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!typeOffre ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeFilter("")}
            >
              Tout
            </Button>
            {(["EMPLOI", "FORMATION", "BOURSE"] as TypeOffre[]).map((type) => {
              const Icon = typeOffreIcons[type];
              return (
                <Button
                  key={type}
                  variant={typeOffre === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTypeFilter(type)}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {typeOffreLabels[type]}
                </Button>
              );
            })}
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Secteur</label>
                    <Select>
                      <option value="">Tous les secteurs</option>
                      <option value="INFORMATIQUE">Informatique</option>
                      <option value="FINANCE">Finance</option>
                      <option value="SANTE">Santé</option>
                      <option value="EDUCATION">Éducation</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Expérience</label>
                    <Select>
                      <option value="">Tous niveaux</option>
                      <option value="DEBUTANT">Débutant</option>
                      <option value="JUNIOR">Junior</option>
                      <option value="CONFIRME">Confirmé</option>
                      <option value="SENIOR">Senior</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Localisation</label>
                    <Input placeholder="Ville, région..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type de contrat</label>
                    <Select>
                      <option value="">Tous types</option>
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="STAGE">Stage</option>
                      <option value="ALTERNANCE">Alternance</option>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : offres.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune offre trouvée</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offres.map((offre) => {
                const Icon = typeOffreIcons[offre.typeOffre];
                const isFavorite = favorites.has(offre.id);

                return (
                  <Card key={offre.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={typeOffreColors[offre.typeOffre]}>
                          <Icon className="h-3 w-3 mr-1" />
                          {typeOffreLabels[offre.typeOffre]}
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(offre.id);
                          }}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Heart
                            className={cn(
                              "h-5 w-5 transition-colors",
                              isFavorite
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400 group-hover:text-gray-600"
                            )}
                          />
                        </button>
                      </div>

                      <Link to={`/offres/${offre.id}`}>
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                          {offre.titre}
                        </h3>
                      </Link>

                      <p className="text-sm text-muted-foreground mb-4">
                        {truncate(offre.description, 100)}
                      </p>

                      <div className="space-y-2 text-xs text-muted-foreground">
                        {offre.entreprise && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {offre.entreprise}
                          </div>
                        )}
                        {offre.localisation && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {offre.localisation}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeDate(offre.datePublication)}
                        </div>
                      </div>

                      {offre.tags && offre.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-4">
                          {offre.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
