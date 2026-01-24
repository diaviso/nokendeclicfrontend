import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { favoritesService } from "@/services";
import type { Offre } from "@/types";
import {
  Heart,
  MapPin,
  Building2,
  Clock,
  Briefcase,
  GraduationCap,
  Award,
  Trash2,
} from "lucide-react";
import { formatRelativeDate, truncate } from "@/lib/utils";

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

export function Favoris() {
  const [favorites, setFavorites] = useState<{ offre: Offre }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const data = await favoritesService.getAll();
        setFavorites(data);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const removeFavorite = async (offreId: number) => {
    try {
      await favoritesService.remove(offreId);
      setFavorites((prev) => prev.filter((f) => f.offre.id !== offreId));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  return (
    <div>
      <Header title="Mes Favoris" subtitle="Les offres que vous avez sauvegardées" />

      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun favori</h3>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore sauvegardé d'offres
            </p>
            <Link to="/offres">
              <Button>Parcourir les offres</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(({ offre }) => {
              const Icon = typeOffreIcons[offre.typeOffre];

              return (
                <Card key={offre.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={typeOffreColors[offre.typeOffre]}>
                        <Icon className="h-3 w-3 mr-1" />
                        {typeOffreLabels[offre.typeOffre]}
                      </Badge>
                      <button
                        onClick={() => removeFavorite(offre.id)}
                        className="p-1 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
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

                    <div className="mt-4 pt-4 border-t">
                      <Link to={`/offres/${offre.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Voir l'offre
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
