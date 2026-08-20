/**
 * Service worker de Noken.
 *
 * Écrit à la main plutôt que généré : @serwist/next et workbox reposent sur
 * webpack, or Next 16 construit avec Turbopack et échoue si une configuration
 * webpack est détectée. Les besoins tiennent en trois stratégies.
 *
 * Incrémenter VERSION invalide tous les caches au prochain déploiement.
 */
const VERSION = "v3";
const STATIC_CACHE = `noken-static-${VERSION}`;
const PAGES_CACHE = `noken-pages-${VERSION}`;
const OFFLINE_URL = "/hors-ligne";

/** Ressources minimales pour afficher quelque chose sans réseau. */
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // `reload` contourne le cache HTTP : au moment de l'installation on veut
      // la version fraîche, pas une copie potentiellement périmée.
      .then((cache) =>
        cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" }))),
      )
      .catch(() => {
        // Une ressource manquante ne doit pas empêcher l'installation.
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("noken-") && !key.endsWith(VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/**
 * La page peut demander l'activation immédiate d'une version en attente,
 * après confirmation de l'utilisateur.
 */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Seules les lectures same-origin sont interceptées : les appels à l'API et
  // aux fichiers R2 partent sur d'autres origines et ne doivent pas être
  // servis depuis un cache local.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Jamais de cache sur les routes de données : une réponse périmée y serait
  // pire que pas de réponse du tout.
  if (url.pathname.startsWith("/api/")) return;

  // Ressources immuables (empreinte dans le nom) : cache d'abord.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Navigations : réseau d'abord, cache en repli, page hors-ligne en dernier
  // recours. L'utilisateur voit ainsi toujours du contenu à jour quand il a du
  // réseau, et quelque chose d'exploitable quand il n'en a pas.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return (
            offline ??
            new Response("Hors ligne", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })(),
    );
  }
});

/* ------------------------------------------------ Notifications poussées */

/**
 * Réception d'une notification.
 *
 * Le service de poussée réveille le service worker même application fermée :
 * c'est le seul chemin par lequel une notification atteint quelqu'un qui n'a
 * pas le site ouvert.
 *
 * Le `tag` regroupe les notifications de même nature — dix messages non lus
 * n'empilent pas dix bandeaux, le dernier remplace le précédent. La vibration
 * est le seul signal que le web permet de choisir : le son, lui, est celui du
 * canal de notification du système, hors de portée d'une page web.
 */
self.addEventListener("push", (event) => {
  let charge = {};
  try {
    charge = event.data ? event.data.json() : {};
  } catch {
    charge = { titre: "Noken", corps: event.data ? event.data.text() : "" };
  }

  const titre = charge.titre || "Noken";
  const options = {
    body: charge.corps || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: charge.groupe || "noken",
    renotify: true,
    // Rythme court-long-court : reconnaissable sans être agressif, et distinct
    // de la vibration par défaut d'un message entrant.
    vibrate: [90, 60, 140],
    data: { lien: charge.lien || "/dashboard" },
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(titre, options);

      // Si l'application est ouverte, on la prévient : elle peut alors jouer
      // son propre son, ce que la notification système ne permet pas.
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        client.postMessage({ type: "notification-poussee", charge });
      }
    })(),
  );
});

/**
 * Clic sur la notification.
 *
 * Un onglet déjà ouvert est réutilisé plutôt qu'un nouveau créé : sinon, une
 * personne qui reçoit cinq notifications se retrouve avec cinq onglets.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const lien = event.notification.data?.lien || "/dashboard";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(lien);
          return;
        }
      }

      await self.clients.openWindow(lien);
    })(),
  );
});

/**
 * Abonnement renouvelé par le navigateur.
 *
 * Les services de poussée font tourner leurs adresses. Sans ce réenregistrement,
 * l'abonnement devient muet sans que personne ne s'en aperçoive.
 */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: "abonnement-a-renouveler" });
      }
    })(),
  );
});
