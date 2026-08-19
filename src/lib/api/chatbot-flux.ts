import { API_URL, rafraichirJeton, tokenStore } from "./client";

/** Ce que le serveur pousse sur le flux. */
export type EvenementFlux =
  | { type: "debut"; conversationId: string }
  | { type: "morceau"; texte: string }
  | { type: "outil"; nom: string }
  | { type: "fin"; conversationId: string }
  | { type: "erreur"; message: string };

export interface EcouteursFlux {
  surDebut?: (conversationId: string) => void;
  surMorceau?: (texte: string) => void;
  surOutil?: (nom: string) => void;
  surErreur?: (message: string) => void;
}

/**
 * Envoie un message et restitue la réponse au fil de l'eau.
 *
 * `fetch` plutôt qu'axios : dans un navigateur, axios ne donne accès au corps
 * qu'une fois complet, ce qui annulerait tout l'intérêt. `EventSource` était
 * exclu pour deux raisons — il ne pose pas d'en-tête `Authorization`, et il
 * n'émet que des requêtes GET, or le message n'a pas sa place dans une adresse.
 *
 * @returns l'identifiant de la conversation, connu dès le premier événement.
 */
export async function envoyerEnFlux(
  message: string,
  conversationId: string | undefined,
  ecouteurs: EcouteursFlux,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const appeler = (jeton: string | null) =>
    fetch(`${API_URL}/api/chatbot/chat/flux`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      },
      body: JSON.stringify({ message, conversationId }),
      signal,
    });

  let reponse = await appeler(tokenStore.access);

  // Hors intercepteur : le rafraîchissement est rejoué ici, une seule fois.
  if (reponse.status === 401) {
    const nouveau = await rafraichirJeton();
    if (!nouveau) throw new Error("Session expirée");
    reponse = await appeler(nouveau);
  }

  if (!reponse.ok || !reponse.body) {
    throw new Error(
      reponse.status === 429
        ? "Trop de messages envoyés. Patientez une minute."
        : "L'assistant n'a pas pu répondre.",
    );
  }

  const lecteur = reponse.body.getReader();
  const decodeur = new TextDecoder();
  let tampon = "";
  let identifiant = conversationId;

  while (true) {
    const { done, value } = await lecteur.read();
    if (done) break;

    tampon += decodeur.decode(value, { stream: true });

    // Un fragment réseau ne coïncide pas avec une frontière d'événement : le
    // reste après le dernier séparateur est conservé pour le tour suivant.
    const blocs = tampon.split("\n\n");
    tampon = blocs.pop() ?? "";

    for (const bloc of blocs) {
      const ligne = bloc.trim();
      if (!ligne.startsWith("data:")) continue;

      let evenement: EvenementFlux;
      try {
        evenement = JSON.parse(ligne.slice(5).trim());
      } catch {
        continue;
      }

      switch (evenement.type) {
        case "debut":
          identifiant = evenement.conversationId;
          ecouteurs.surDebut?.(evenement.conversationId);
          break;
        case "morceau":
          ecouteurs.surMorceau?.(evenement.texte);
          break;
        case "outil":
          ecouteurs.surOutil?.(evenement.nom);
          break;
        case "fin":
          identifiant = evenement.conversationId;
          break;
        case "erreur":
          ecouteurs.surErreur?.(evenement.message);
          break;
      }
    }
  }

  return identifiant;
}

/** Ce que l'assistant est en train de consulter, dit en clair. */
export const LIBELLES_OUTILS: Record<string, string> = {
  get_offres_par_localisation: "Je regarde les offres de cette zone…",
  get_offres_par_type: "Je parcours ce type d'opportunité…",
  get_offres_par_secteur: "Je regarde ce secteur…",
  get_formations_disponibles: "Je consulte les formations…",
  get_bourses_disponibles: "Je consulte les bourses…",
  get_volontariats_disponibles: "Je consulte les missions de volontariat…",
  get_statistiques_offres: "Je fais le point sur le catalogue…",
};
