"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Abonnement de cet appareil aux notifications poussées.
 *
 * Trois états se confondent souvent et qu'il faut distinguer : le navigateur
 * *sait-il* pousser, la personne a-t-elle *autorisé*, et cet appareil est-il
 * *abonné* ? Un refus d'autorisation est définitif tant qu'il n'est pas levé
 * dans les réglages du navigateur — l'interface doit le dire, et non proposer
 * un bouton qui ne fera rien.
 */

export type EtatPush =
  | "indisponible"
  | "refusee"
  | "a-activer"
  | "activee"
  | "en-cours";

/** La clé publique voyage en base64url ; l'API d'abonnement veut des octets. */
function versOctets(base64url: string): BufferSource {
  const complement = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + complement).replace(/-/g, "+").replace(/_/g, "/");
  const brut = window.atob(base64);
  const octets = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i += 1) octets[i] = brut.charCodeAt(i);
  return octets;
}

export function useNotificationsPush() {
  const [etat, setEtat] = useState<EtatPush>("indisponible");
  const [erreur, setErreur] = useState<string | null>(null);

  const supporte =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  /** Interroge le navigateur, sans rien demander à l'utilisateur. */
  const lireEtat = useCallback(async (): Promise<EtatPush> => {
    if (!supporte) return "indisponible";
    if (Notification.permission === "denied") return "refusee";

    // `serviceWorker.ready` ne se résout que lorsqu'un service worker est
    // actif — et jamais s'il n'y en a pas. Sans cette limite de temps, l'état
    // restait « indisponible » pour toujours et *tous* les points d'entrée du
    // réglage disparaissaient en silence : c'est précisément le symptôme
    // remonté, « on ne trouve pas l'option ». Passé le délai, on propose
    // l'activation : au pire elle échouera en le disant.
    const enregistrement = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resoudre) => setTimeout(() => resoudre(null), 4000)),
    ]);

    if (!enregistrement) return "a-activer";

    const abonnement = await enregistrement.pushManager.getSubscription();
    return abonnement ? "activee" : "a-activer";
  }, [supporte]);

  const relire = useCallback(async () => {
    setEtat(await lireEtat());
  }, [lireEtat]);

  // L'état vient d'un système extérieur — permission du navigateur et
  // abonnement du service worker — qu'on ne peut lire que de façon
  // asynchrone. Le composant se monte donc dans l'état « indisponible » et se
  // corrige au premier tour, plutôt que de deviner.
  useEffect(() => {
    let vivant = true;
    void (async () => {
      const lu = await lireEtat();
      if (vivant) setEtat(lu);
    })();
    return () => {
      vivant = false;
    };
  }, [lireEtat]);

  const activer = useCallback(async () => {
    setErreur(null);
    setEtat("en-cours");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat(permission === "denied" ? "refusee" : "a-activer");
        return false;
      }

      const { data } = await api.get<{ cle: string | null; actif: boolean }>(
        "/api/notifications/push/cle-publique",
      );
      if (!data.cle) {
        setErreur("Les notifications ne sont pas configurées sur le serveur.");
        setEtat("a-activer");
        return false;
      }

      const enregistrement = await navigator.serviceWorker.ready;
      // Un abonnement déjà présent est réutilisé : en redemander un créerait
      // une seconde adresse, et chaque notification arriverait en double.
      const abonnement =
        (await enregistrement.pushManager.getSubscription()) ??
        (await enregistrement.pushManager.subscribe({
          // Obligatoire sur Chrome : le navigateur refuse les abonnements
          // silencieux, chaque poussée doit se voir.
          userVisibleOnly: true,
          applicationServerKey: versOctets(data.cle),
        }));

      await api.post("/api/notifications/push/abonnement", abonnement.toJSON());
      setEtat("activee");
      return true;
    } catch (cause) {
      setErreur(
        cause instanceof Error
          ? cause.message
          : "L'activation n'a pas abouti sur cet appareil.",
      );
      setEtat("a-activer");
      return false;
    }
  }, []);

  const desactiver = useCallback(async () => {
    setEtat("en-cours");
    try {
      const enregistrement = await navigator.serviceWorker.ready;
      const abonnement = await enregistrement.pushManager.getSubscription();

      if (abonnement) {
        // Le serveur est prévenu avant la désinscription locale : l'inverse
        // perdrait l'adresse, et l'abonnement resterait en base à jamais.
        await api
          .delete("/api/notifications/push/abonnement", {
            data: { endpoint: abonnement.endpoint },
          })
          .catch(() => undefined);
        await abonnement.unsubscribe();
      }

      setEtat("a-activer");
    } catch {
      await relire();
    }
  }, [relire]);

  const essayer = useCallback(async () => {
    const { data } = await api.post<{ envoyees: number }>(
      "/api/notifications/push/essai",
    );
    return data.envoyees;
  }, []);

  return { etat, erreur, supporte, activer, desactiver, essayer, relire };
}
