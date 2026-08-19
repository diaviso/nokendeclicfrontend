/**
 * Carillon joué à l'arrivée d'une notification, application ouverte.
 *
 * Synthétisé plutôt que chargé : deux notes tenues une fraction de seconde ne
 * valent pas un fichier à télécharger, et un son engendré reste net à tous les
 * volumes. Il est aussi le seul son que le web permette de choisir — celui
 * d'une notification reçue application fermée est fixé par le système, aucune
 * page web ne peut en décider.
 */

/** Deux notes montantes, une quinte : reconnaissable, jamais stridente. */
const NOTES = [
  { frequence: 880, debut: 0, duree: 0.16 },
  { frequence: 1318.5, debut: 0.12, duree: 0.28 },
] as const;

let contexte: AudioContext | null = null;

export function jouerCarillon(volume = 0.18) {
  if (typeof window === "undefined") return;

  try {
    // Le contexte est conservé : en créer un par notification finit par
    // saturer le quota du navigateur.
    contexte ??= new (window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();

    // Un contexte créé hors d'un geste utilisateur démarre suspendu.
    if (contexte.state === "suspended") void contexte.resume();

    const depart = contexte.currentTime;

    for (const note of NOTES) {
      const oscillateur = contexte.createOscillator();
      const gain = contexte.createGain();

      oscillateur.type = "sine";
      oscillateur.frequency.value = note.frequence;

      // Enveloppe : une note coupée net produit un claquement audible.
      const t0 = depart + note.debut;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.duree);

      oscillateur.connect(gain).connect(contexte.destination);
      oscillateur.start(t0);
      oscillateur.stop(t0 + note.duree + 0.02);
    }
  } catch {
    // Un navigateur qui refuse l'audio ne doit pas faire échouer la réception.
  }
}

const CLE_SON = "noken.sonNotifications";

export function sonActif(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(CLE_SON) !== "0";
}

/**
 * Abonnés au réglage.
 *
 * `localStorage` ne prévient pas l'onglet qui écrit : sans cette liste, la
 * bascule ne rafraîchirait rien tant que la page n'est pas rechargée.
 */
const abonnes = new Set<() => void>();

export function abonnerSon(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

export function definirSon(actif: boolean) {
  window.localStorage.setItem(CLE_SON, actif ? "1" : "0");
  abonnes.forEach((rappel) => rappel());
}
