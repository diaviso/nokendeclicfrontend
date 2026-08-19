import { offresServerApi } from "@/lib/api/offres";
import { partenaireServerApi } from "@/lib/api/partenaire";
import { typesOffresServerApi } from "@/lib/api/types-offres";
import { Landing, type TypeCompte } from "@/components/landing/landing";
import type { PartenaireVitrine } from "@/lib/api/partenaire";
import type { Offre } from "@/lib/types";

export const revalidate = 300;

/**
 * Page d'accueil.
 *
 * Les données sont chargées côté serveur — l'accueil doit rester indexable et
 * afficher des chiffres réels, pas des valeurs figées dans le code. La mise en
 * scène est déportée dans un composant client (`Landing`) qui porte les
 * animations ; ce fichier ne s'occupe que de la récupération et de la
 * dégradation en cas d'API indisponible.
 */
async function getData(): Promise<{
  offres: Offre[];
  total: number;
  comptes: TypeCompte[];
  partenaires: PartenaireVitrine[];
}> {
  try {
    // Les types viennent de l'API : une vignette apparaît d'elle-même dès qu'un
    // type est créé depuis le back-office, sans redéploiement du site.
    const types = await typesOffresServerApi.list();

    const [recentes, partenaires, ...parType] = await Promise.all([
      offresServerApi.list({ limit: 6 }),
      // La vitrine ne doit pas faire tomber la page : sans elle, la section
      // disparaît simplement.
      partenaireServerApi.vitrine().catch(() => [] as PartenaireVitrine[]),
      ...types.map((type) =>
        offresServerApi.list({ typeOffre: type.code, limit: 1 }),
      ),
    ]);

    return {
      offres: recentes.data,
      total: recentes.total,
      partenaires,
      comptes: types.map((type, index) => ({
        type,
        total: parType[index]?.total ?? 0,
      })),
    };
  } catch {
    // L'API peut être momentanément indisponible : la page publique doit
    // rester servie plutôt que de renvoyer une erreur 500 aux moteurs.
    return { offres: [], total: 0, comptes: [], partenaires: [] };
  }
}

export default async function HomePage() {
  const { offres, total, comptes, partenaires } = await getData();

  return (
    <Landing
      offres={offres}
      total={total}
      comptes={comptes}
      partenaires={partenaires}
    />
  );
}
