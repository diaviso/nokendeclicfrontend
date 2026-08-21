/**
 * Reconnaissance des navigateurs intégrés aux applications.
 *
 * WhatsApp, Facebook, Instagram et consorts ouvrent les liens dans une vue web
 * embarquée. « Ajouter à l'écran d'accueil » y est absent ou sans effet : sans
 * avertissement, la personne touche un bouton qui ne fait rien et en conclut
 * que l'application ne s'installe pas.
 *
 * La détection repose sur la chaîne d'agent, faute de mieux — aucun navigateur
 * ne déclare franchement être embarqué. Elle est donc faillible dans les deux
 * sens ; l'écran qu'elle déclenche reste informatif et n'empêche jamais
 * d'essayer.
 */

export type Embarqueur =
  | "facebook"
  | "instagram"
  | "messenger"
  | "linkedin"
  | "snapchat"
  | "tiktok"
  | "twitter"
  | "autre";

// L'ordre compte : Messenger porte aussi les marqueurs de Facebook, et serait
// nommé « Facebook » si on le testait après.
const SIGNATURES: [RegExp, Embarqueur][] = [
  [/Messenger/i, "messenger"],
  [/FBAN|FB_IAB|FBIOS/i, "facebook"],
  [/Instagram/i, "instagram"],
  [/LinkedInApp/i, "linkedin"],
  [/Snapchat/i, "snapchat"],
  [/BytedanceWebview|musical_ly|TikTok/i, "tiktok"],
  [/Twitter/i, "twitter"],
];

export const NOMS: Record<Embarqueur, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  messenger: "Messenger",
  linkedin: "LinkedIn",
  snapchat: "Snapchat",
  tiktok: "TikTok",
  twitter: "X",
  autre: "cette application",
};

export function detecterNavigateurIntegre(): Embarqueur | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;

  for (const [motif, nom] of SIGNATURES) {
    if (motif.test(ua)) return nom;
  }

  // Vue web Android : le marqueur « wv » est posé par le système lui-même.
  if (/\bwv\b/.test(ua) && /Android/i.test(ua)) return "autre";

  // Sur iOS, une vue embarquée se reconnaît en creux : elle rend avec WebKit
  // mais n'annonce pas Safari. On écarte les navigateurs tiers légitimes, qui
  // se nomment, eux.
  const iOS = /iPhone|iPad|iPod/i.test(ua);
  const tiers = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Brave/i.test(ua);
  if (iOS && !tiers && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) {
    return "autre";
  }

  return null;
}

/**
 * Lien qui rouvre l'adresse dans Chrome sur Android.
 *
 * Le système résout l'intention même depuis une vue embarquée : c'est le seul
 * moyen d'en sortir en un geste. iOS n'a pas d'équivalent — il faut y passer
 * par le menu de l'application.
 */
export function lienChromeAndroid(url: string): string | null {
  if (typeof navigator === "undefined") return null;
  if (!/Android/i.test(navigator.userAgent)) return null;

  const sansSchema = url.replace(/^https?:\/\//, "");
  return `intent://${sansSchema}#Intent;scheme=https;package=com.android.chrome;end`;
}
