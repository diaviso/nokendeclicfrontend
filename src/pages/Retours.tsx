import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { retoursService } from "@/services";
import type { Retour } from "@/types";
import {
  MessageSquare,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  Briefcase,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function Retours() {
  const [retours, setRetours] = useState<Retour[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRetours = async () => {
      try {
        const data = await retoursService.getMyRetours();
        setRetours(data);
      } catch (error) {
        console.error("Error fetching retours:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRetours();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <Header title="Mes Candidatures" subtitle="Suivez l'avancement de vos candidatures" />

      <div className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : retours.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune candidature</h3>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore postulé à des offres
            </p>
            <Link to="/offres">
              <Button>Parcourir les offres</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {retours.map((retour) => (
              <Card key={retour.id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleExpand(retour.id)}
                    className="w-full p-6 text-left flex items-start justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {retour.offre?.titre || "Offre supprimée"}
                        </Badge>
                        {retour.reponses && retour.reponses.length > 0 && (
                          <Badge variant="success">
                            {retour.reponses.length} réponse(s)
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{retour.contenu}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {retour.offre?.entreprise && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {retour.offre.entreprise}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Envoyé le {formatDate(retour.datePublication)}
                        </span>
                      </div>
                    </div>
                    {expandedId === retour.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {expandedId === retour.id && (
                    <div className="border-t px-6 py-4 bg-gray-50">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Votre message</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-lg border">
                          {retour.contenu}
                        </p>
                      </div>

                      {retour.reponses && retour.reponses.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Réponses</h4>
                          <div className="space-y-3">
                            {retour.reponses.map((reponse) => (
                              <div key={reponse.id} className="bg-white p-4 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-primary">
                                    {reponse.auteur.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(reponse.dateCreation)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{reponse.contenu}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {retour.offre && (
                        <div className="mt-4 pt-4 border-t">
                          <Link to={`/offres/${retour.offre.id}`}>
                            <Button variant="outline" size="sm">
                              Voir l'offre
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
