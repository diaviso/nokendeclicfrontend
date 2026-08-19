"use client";

import { Building2, ExternalLink, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/landing/motion";
import { fileUrl } from "@/lib/api";
import { secteurLabel } from "@/lib/enums";
import type { PartenaireVitrine } from "@/lib/api";

/**
 * Vitrine des structures partenaires.
 *
 * Elle répond à une question que se pose tout visiteur avant de créer un
 * compte : « qui publie ici ? ». Des noms et des logos réels valent mieux que
 * n'importe quelle promesse, et c'est aussi la contrepartie visible de ce que
 * les partenaires apportent à la plateforme.
 *
 * La section disparaît entièrement quand aucune structure n'est mise en avant :
 * une bande vide, ou remplie de logos d'exemple, ferait exactement l'inverse de
 * ce qu'on cherche.
 */
export function SectionPartenaires({
  partenaires,
}: {
  partenaires: PartenaireVitrine[];
}) {
  const t = useTranslations("partenaires");

  if (partenaires.length === 0) return null;

  return (
    <section className="border-b bg-muted/25 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t("surtitre")}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold sm:text-4xl">
              {t("titre")}
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              {t("texte")}
            </p>
          </div>
        </Reveal>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partenaires.map((partenaire, index) => {
            const details = [
              partenaire.secteur ? secteurLabel(partenaire.secteur) : null,
              partenaire.ville,
            ].filter(Boolean);

            const contenu = (
              <>
                <div className="flex items-start gap-4">
                  <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-background">
                    {partenaire.logoUrl ? (
                      /* Balise native : le logo vient du stockage distant ou du
                         dossier local selon l'environnement, et l'optimiseur
                         d'images refuse tout domaine non déclaré. */
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={fileUrl(partenaire.logoUrl)}
                        alt=""
                        loading="lazy"
                        className="size-full object-contain p-1.5"
                      />
                    ) : (
                      <Building2
                        className="size-6 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold">
                      {partenaire.nom}
                    </h3>
                    {details.length > 0 ? (
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                        {partenaire.ville ? (
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                        ) : null}
                        {details.join(" · ")}
                      </p>
                    ) : null}
                  </div>

                  {partenaire.siteWeb ? (
                    <ExternalLink
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                      aria-hidden
                    />
                  ) : null}
                </div>

                {partenaire.description ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {partenaire.description}
                  </p>
                ) : null}
              </>
            );

            return (
              <Reveal key={partenaire.id} delay={(index % 3) * 0.07}>
                {partenaire.siteWeb ? (
                  <a
                    href={partenaire.siteWeb}
                    target="_blank"
                    // `nofollow` en plus de `noopener` : la vitrine ne doit pas
                    // devenir un dispositif de référencement monnayable.
                    rel="noopener noreferrer nofollow"
                    className="group block h-full rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                  >
                    {contenu}
                  </a>
                ) : (
                  <div className="h-full rounded-2xl border bg-card p-5">
                    {contenu}
                  </div>
                )}
              </Reveal>
            );
          })}
        </ul>

        <Reveal delay={0.1}>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t("appelDebut")}{" "}
            <a
              href="mailto:contact@nokendeclic.com?subject=Devenir%20partenaire"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("appelLien")}
            </a>{" "}
            {t("appelFin")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
