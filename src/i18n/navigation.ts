import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Navigation consciente de la langue.
 *
 * Ces enveloppes ajoutent le préfixe de langue là où il faut : `<Link
 * href="/offres">` mène à `/offres` en français et à `/en/offres` en anglais,
 * sans que l'appelant ait à le savoir. Elles ne servent qu'aux pages traduites —
 * ailleurs, `next/link` reste le bon outil.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
