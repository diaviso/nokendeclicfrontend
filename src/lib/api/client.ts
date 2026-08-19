import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/**
 * Le backend n'a pas de préfixe global : `auth`, `messaging` et `upload` sont
 * servis à la racine, tout le reste sous `/api`. Les chemins passés aux modules
 * de ce dossier sont donc absolus et explicites — on ne préfixe rien
 * automatiquement, ce serait une source d'erreurs silencieuses.
 */

const TOKEN_KEY = "noken.accessToken";
const REFRESH_KEY = "noken.refreshToken";

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(accessToken: string, refreshToken?: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Rafraîchissement du jeton, avec file d'attente : si plusieurs requêtes
 * échouent en 401 simultanément, une seule tentative de refresh est émise et
 * les autres attendent son issue plutôt que de la déclencher chacune.
 */
let refreshing: Promise<string | null> | null = null;

/**
 * Routes où un 401 ne doit pas déclencher de rafraîchissement.
 *
 * Ce sont celles qui n'exigent pas de session : un 401 y signifie « ces
 * identifiants sont faux », pas « ce jeton a expiré ». Tenter un
 * rafraîchissement puis rejouer la requête y reviendrait à resoumettre un
 * mot de passe erroné.
 *
 * La liste est nominative, et non un simple test sur « /auth/ » : les routes
 * authentifiées vivent au même endroit (`/auth/me`, `/auth/cgu`,
 * `/auth/logout`), et les exclure toutes leur retirait le rafraîchissement.
 * Une session de plus de quinze minutes échouait alors définitivement — sur la
 * boîte d'acceptation des conditions, bloquante par construction, il devenait
 * impossible d'en sortir autrement qu'en se déconnectant.
 */
const ROUTES_SANS_RAFRAICHISSEMENT = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/validate-reset-token",
  "/auth/verify-email",
  "/auth/resend-code",
];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<{
      accessToken: string;
      refreshToken: string;
    }>(`${API_URL}/auth/refresh`, { refreshToken });
    tokenStore.set(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    tokenStore.clear();
    return null;
  }
}

/**
 * Rafraîchissement à la demande, pour les appels qui n'empruntent pas axios.
 *
 * La lecture d'un flux passe par `fetch` — axios ne restitue pas un corps par
 * fragments dans le navigateur — et échappe donc à l'intercepteur. Cette porte
 * d'entrée réutilise la même file d'attente : deux appels simultanés ne
 * déclenchent qu'un seul rafraîchissement.
 */
export async function rafraichirJeton(): Promise<string | null> {
  refreshing ??= refreshAccessToken().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const sansRafraichissement = ROUTES_SANS_RAFRAICHISSEMENT.some((route) =>
      original?.url?.startsWith(route),
    );

    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !sansRafraichissement
    ) {
      original._retried = true;

      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });

      const token = await refreshing;

      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }

      if (typeof window !== "undefined") {
        // Rechargement complet volontaire, et non un router.push : ce module
        // n'est pas un composant React (pas d'accès au routeur), et surtout la
        // session vient d'être perdue — repartir d'une page vierge garantit
        // qu'aucun état en mémoire (cache de requêtes, formulaires, contexte
        // d'authentification) ne survit à la déconnexion.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

/** Message d'erreur exploitable pour l'interface, quelle que soit la forme de la réponse. */
export function errorMessage(error: unknown, fallback = "Une erreur est survenue"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const message = data?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === "string") return message;
    if (error.code === "ECONNABORTED") return "Le serveur met trop de temps à répondre";
    if (!error.response) return "Impossible de joindre le serveur";
  }
  return fallback;
}

/** Résout une URL de fichier renvoyée par l'API (absolue ou relative). */
export function fileUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Appel côté serveur (Server Components) : pas de jeton, pas d'intercepteur.
 * Réservé aux routes publiques — c'est ce qui permet le rendu serveur des pages
 * d'offres, et donc leur indexation, sans modification du backend.
 */
export async function serverFetch<T>(
  path: string,
  options?: { revalidate?: number; tags?: string[] },
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: {
      revalidate: options?.revalidate ?? 300,
      tags: options?.tags,
    },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`API ${path} → ${res.status}`);
  }

  return res.json() as Promise<T>;
}
