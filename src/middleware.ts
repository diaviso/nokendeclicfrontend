import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

/**
 * Le middleware ne s'applique qu'aux pages traduites.
 *
 * Une liste explicite plutôt qu'un motif attrape-tout : l'espace membre et la
 * console ne sont pas traduits, et les intercepter reviendrait à faire lire
 * « dashboard » comme un code de langue.
 */
export const config = {
  matcher: [
    "/",
    "/(fr|en)/:path*",
    "/offres/:path*",
    "/cgu",
    "/politique-confidentialite",
    "/login",
    "/forgot-password",
    "/reset-password",
  ],
};
