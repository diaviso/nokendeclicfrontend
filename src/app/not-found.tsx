import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm text-center">
        <Logo className="mx-auto mb-8 w-fit" />

        <span className="mx-auto grid size-14 place-items-center rounded-lg border bg-muted/40">
          <Compass className="size-6 text-muted-foreground" aria-hidden />
        </span>

        <p className="mt-5 text-sm font-medium text-muted-foreground">Erreur 404</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          Cette page n&apos;existe pas
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Le lien est peut-être erroné, ou la ressource a été supprimée.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" render={<Link href="/" />}>
            <Home className="size-4" />
            Accueil
          </Button>
          <Button variant="outline" className="flex-1" render={<Link href="/offres" />}>
            <Search className="size-4" />
            Voir les offres
          </Button>
        </div>
      </div>
    </div>
  );
}
