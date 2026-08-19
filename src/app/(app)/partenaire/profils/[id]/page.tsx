"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  Briefcase,
  ExternalLink,
  GraduationCap,
  Heart,
  Languages,
  Layers,
  Loader2,
  MapPin,
  MessagesSquare,
  ShieldCheck,
  UserSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import {
  BoutonFavori,
  BoutonNote,
  useIdentifiantsFavoris,
} from "@/components/partenaire/bouton-favori";
import {
  errorMessage,
  fileUrl,
  messagingApi,
  partenaireApi,
  profilsApi,
} from "@/lib/api";
import { statutProfessionnelLabel } from "@/lib/enums";
import { formatDateShort, formatRelative, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Période d'une entrée de CV, avec « aujourd'hui » quand la fin est ouverte. */
function periode(debut: string, fin?: string | null, enCours?: boolean): string {
  const depuis = formatDateShort(debut);
  if (enCours || !fin) return `${depuis} — aujourd'hui`;
  return `${depuis} — ${formatDateShort(fin)}`;
}

function Panneau({
  titre,
  icone: Icone,
  teinte = "var(--chart-2)",
  index = 0,
  className,
  children,
}: {
  titre: string;
  icone: typeof Award;
  teinte?: string;
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "entree overflow-hidden rounded-2xl border bg-card shadow-sm",
        className,
      )}
    >
      <header className="flex items-center gap-2.5 border-b px-5 py-3.5">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklch, ${teinte} 13%, transparent)`,
            color: teinte,
          }}
        >
          <Icone className="size-3.5" aria-hidden />
        </span>
        <h2 className="text-sm font-bold">{titre}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ListeMots({ valeurs }: { valeurs?: string[] }) {
  if (!valeurs?.length) {
    return <p className="text-sm text-muted-foreground">Non renseigné.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {valeurs.map((valeur, rang) => (
        <li key={`${valeur}-${rang}`} className="rounded-md bg-muted px-2 py-0.5 text-sm">
          {valeur}
        </li>
      ))}
    </ul>
  );
}

export default function ProfilCandidatPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const userId = Number(id);
  const router = useRouter();

  const {
    data: cv,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profils", userId],
    queryFn: () => profilsApi.byUserId(userId),
    enabled: Number.isInteger(userId),
  });

  const { data: identifiantsFavoris = [] } = useIdentifiantsFavoris();
  const estFavori = identifiantsFavoris.includes(userId);

  // La note n'est chargée que si le profil est effectivement retenu : sans
  // favori, il n'y a rien à annoter, et la liste complète ne servirait à rien.
  const { data: favoris = [] } = useQuery({
    queryKey: ["partenaire", "favoris"],
    queryFn: partenaireApi.favoris,
    enabled: estFavori,
  });
  const note = favoris.find((favori) => favori.candidatId === userId)?.note;

  const contacter = useMutation({
    mutationFn: () => messagingApi.start(userId),
    onSuccess: () => {
      toast.success("Conversation ouverte", {
        description: "Présentez votre structure et le poste : le candidat reste libre de répondre.",
      });
      router.push("/messagerie");
    },
    onError: (error) =>
      toast.error("Prise de contact impossible", {
        description: errorMessage(error),
      }),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Chargement du profil…</span>
      </div>
    );
  }

  if (isError || !cv) {
    return (
      <EmptyState
        icon={UserSearch}
        couleur="var(--chart-2)"
        title="Profil introuvable"
        description="Ce membre a peut-être retiré la visibilité de son CV depuis votre recherche."
        action={
          <Button
            variant="outline"
            className="rounded-xl"
            render={<Link href="/partenaire/profils" />}
          >
            Retour à la recherche
          </Button>
        }
      />
    );
  }

  const nom = fullName(cv.user);
  const liens = [cv.linkedin, cv.github, cv.siteWeb].filter(
    (lien): lien is string => Boolean(lien),
  );

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 rounded-lg"
        render={<Link href="/partenaire/profils" />}
      >
        <ArrowLeft className="size-4" />
        Rechercher un profil
      </Button>

      <header className="entree relative mb-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-20"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklch, var(--chart-2) 16%, transparent), transparent 70%)",
          }}
        />

        <div className="relative flex flex-col gap-4 p-5 pt-8 sm:flex-row sm:items-end">
          <Avatar className="size-20 shrink-0 border-4 border-card shadow-sm">
            <AvatarImage src={fileUrl(cv.user.pictureUrl)} alt="" />
            <AvatarFallback className="text-2xl font-bold">
              {(cv.user.firstName?.[0] ?? cv.user.username[0] ?? "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 pb-1">
            <h1 className="truncate text-2xl font-bold tracking-tight">{nom}</h1>
            {cv.titreProfessionnel ? (
              <p className="mt-0.5 truncate text-base font-medium text-muted-foreground">
                {cv.titreProfessionnel}
              </p>
            ) : null}

            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {cv.ville || cv.user.region ? (
                <li className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden />
                  {[cv.ville, cv.user.region, cv.pays].filter(Boolean).join(", ")}
                </li>
              ) : null}
              {cv.user.statutProfessionnel ? (
                <li className="flex items-center gap-1.5">
                  <Briefcase className="size-3.5" aria-hidden />
                  {statutProfessionnelLabel(cv.user.statutProfessionnel)}
                </li>
              ) : null}
              <li>CV mis à jour {formatRelative(cv.dateModification)}</li>
            </ul>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <BoutonFavori
              candidatId={cv.userId}
              nom={nom}
              estFavori={estFavori}
              variante="complet"
            />
            {estFavori ? (
              <BoutonNote candidatId={cv.userId} nom={nom} note={note} />
            ) : null}
            <Button
              className="rounded-xl"
              disabled={contacter.isPending}
              onClick={() => contacter.mutate()}
            >
              {contacter.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MessagesSquare className="size-4" />
              )}
              Contacter
            </Button>
          </div>
        </div>
      </header>

      {/* Le recruteur doit savoir pourquoi il n'a ni numéro ni adresse : sans
          cette phrase, l'absence passe pour un défaut de l'outil. */}
      <p className="entree mb-4 flex items-start gap-2.5 rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        Les coordonnées personnelles ne sont pas communiquées. Écrivez au
        candidat par la messagerie de la plateforme : il choisit de vous
        répondre, et vos échanges restent au même endroit.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {cv.resume ? (
          <Panneau
            titre="Présentation"
            icone={UserSearch}
            index={0}
            className="lg:col-span-2"
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {cv.resume}
            </p>

            {liens.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3 text-sm">
                {liens.map((lien) => (
                  <li key={lien}>
                    <a
                      href={lien}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      {lien.replace(/^https?:\/\//, "")}
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panneau>
        ) : null}

        <Panneau titre="Compétences" icone={Award} teinte="var(--chart-1)" index={1}>
          <ListeMots valeurs={cv.competences} />
        </Panneau>

        <Panneau
          titre="Langues"
          icone={Languages}
          teinte="var(--chart-5)"
          index={2}
        >
          <ListeMots valeurs={cv.langues} />
        </Panneau>

        <Panneau
          titre="Expériences"
          icone={Briefcase}
          teinte="var(--chart-3)"
          index={3}
        >
          {!cv.experiences?.length ? (
            <p className="text-sm text-muted-foreground">Aucune renseignée.</p>
          ) : (
            <ul className="space-y-4">
              {cv.experiences.map((experience, rang) => (
                <li key={experience.id ?? rang} className="relative pl-4">
                  <span
                    aria-hidden
                    className="absolute left-0 top-1.5 size-2 rounded-full bg-[var(--chart-3)]"
                  />
                  <p className="text-sm font-bold">{experience.poste}</p>
                  <p className="text-sm text-muted-foreground">
                    {experience.entreprise}
                    {experience.ville ? ` · ${experience.ville}` : ""}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {periode(
                      experience.dateDebut,
                      experience.dateFin,
                      experience.enCours,
                    )}
                  </p>
                  {experience.description ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {experience.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        <Panneau
          titre="Formations"
          icone={GraduationCap}
          teinte="var(--chart-4)"
          index={4}
        >
          {!cv.formations?.length ? (
            <p className="text-sm text-muted-foreground">Aucune renseignée.</p>
          ) : (
            <ul className="space-y-4">
              {cv.formations.map((formation, rang) => (
                <li key={formation.id ?? rang} className="relative pl-4">
                  <span
                    aria-hidden
                    className="absolute left-0 top-1.5 size-2 rounded-full bg-[var(--chart-4)]"
                  />
                  <p className="text-sm font-bold">{formation.diplome}</p>
                  <p className="text-sm text-muted-foreground">
                    {formation.etablissement}
                    {formation.ville ? ` · ${formation.ville}` : ""}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {periode(
                      formation.dateDebut,
                      formation.dateFin,
                      formation.enCours,
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        {cv.certifications.length > 0 || cv.interets.length > 0 ? (
          <Panneau
            titre="Certifications et centres d'intérêt"
            icone={Heart}
            teinte="var(--chart-5)"
            index={5}
          >
            <div className="space-y-3">
              {cv.certifications.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Certifications
                  </p>
                  <ListeMots valeurs={cv.certifications} />
                </div>
              ) : null}
              {cv.interets.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Centres d&apos;intérêt
                  </p>
                  <ListeMots valeurs={cv.interets} />
                </div>
              ) : null}
            </div>
          </Panneau>
        ) : null}

        {cv.rubriques?.length > 0 ? (
          <Panneau
            titre="Autres rubriques"
            icone={Layers}
            teinte="var(--chart-1)"
            index={6}
            className="lg:col-span-2"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {cv.rubriques.map((rubrique) => (
                <div key={rubrique.titre}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {rubrique.titre}
                  </p>
                  <ul className="space-y-1.5">
                    {rubrique.entrees.map((entree, rang) => (
                      <li key={rang} className="text-sm">
                        <span className="font-medium">{entree.titre}</span>
                        {entree.sousTitre ? (
                          <span className="text-muted-foreground">
                            {" "}
                            — {entree.sousTitre}
                          </span>
                        ) : null}
                        {entree.periode ? (
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            ({entree.periode})
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Panneau>
        ) : null}
      </div>
    </>
  );
}
