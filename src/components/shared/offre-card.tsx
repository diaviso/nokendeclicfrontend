import Image from "next/image";
import Link from "next/link";
import { Building2, Clock, Heart, MapPin, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typeEmploiLabel } from "@/lib/enums";
import { styleOffre } from "@/lib/type-offre";
import { daysUntil, formatRelative, formatSalaryRange } from "@/lib/format";
import type { Offre } from "@/lib/types";

/**
 * Carte d'offre.
 *
 * Chaque carte s'ouvre sur un bandeau coloré : la photo de couverture lorsque
 * l'offre en a une, sinon un dégradé construit à partir de la couleur du type.
 * Sans lui, une grille de cartes n'était qu'une succession de rectangles blancs
 * — rien n'accrochait l'œil et le type, pourtant l'information de tri
 * principale, se réduisait à une pastille de quelques pixels.
 *
 * Le titre est limité à deux lignes : c'est ce qui égalise la hauteur des
 * cartes. Sans cette limite, la grille étirait toutes les cartes d'une rangée à
 * la hauteur de la plus longue, et les plus courtes se creusaient d'un grand
 * vide sous leur contenu.
 *
 * Le composant reste utilisable en Server Component : aucun état, aucun
 * gestionnaire d'événement.
 */
export function OffreCard({
  offre,
  href,
  action,
  className,
  style: styleExterne,
}: {
  offre: Offre;
  href?: string;
  action?: React.ReactNode;
  className?: string;
  /** Permet aux grilles de transmettre le rang d'entrée (`--i`) en cascade. */
  style?: React.CSSProperties;
}) {
  const style = styleOffre(offre);
  const Icon = style.icone;
  const restant = daysUntil(offre.dateLimite);
  const salaire = formatSalaryRange(
    offre.salaireMin,
    offre.salaireMax,
    offre.devise ?? "FCFA",
  );
  const likes = offre._count?.likes ?? 0;
  const commentaires = offre._count?.commentaires ?? 0;

  /** Urgence de l'échéance : elle décide de la couleur de la pastille. */
  const echeance =
    restant === null
      ? null
      : restant < 0
        ? { texte: "Échéance dépassée", ton: "border-border bg-muted text-muted-foreground" }
        : restant === 0
          ? { texte: "Dernier jour", ton: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" }
          : restant <= 7
            ? { texte: `${restant} jour${restant > 1 ? "s" : ""}`, ton: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300" }
            : { texte: `${restant} jours`, ton: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" };

  return (
    <article
      className={cn(
        // `h-full` est nécessaire même dans une grille : sans hauteur explicite,
        // la carte s'arrête à son contenu et le `mt-auto` du pied n'a rien à
        // repousser — les pieds de deux cartes voisines ne s'alignent plus.
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300",
        "hover:-translate-y-1 hover:border-transparent hover:shadow-xl",
        offre.estCloturee && "opacity-60",
        className,
      )}
      style={styleExterne}
    >
      {/* Liseré coloré au survol, à la teinte du type. Posé en superposition
          plutôt qu'en bordure : une bordure décalerait le contenu d'un pixel au
          survol, et toute la carte tressauterait. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1.5px ${style.teinte}` }}
      />

      {/* ────────────────────────────────────────────────── Bandeau */}
      <div className="relative h-28 shrink-0 overflow-hidden">
        {offre.imageUrl ? (
          <Image
            src={offre.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, color-mix(in oklch, ${style.teinte} 92%, black 8%) 0%, color-mix(in oklch, ${style.teinte} 62%, white 26%) 100%)`,
            }}
          >
            {/* Trame et icône en filigrane : de quoi habiller le bandeau sans
                suggérer un contenu qui n'existe pas. */}
            <span
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.65) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
              }}
              aria-hidden
            />
            <Icon
              className="absolute -bottom-3 -right-3 size-24 text-white/25 transition-transform duration-500 group-hover:-rotate-6"
              aria-hidden
            />
          </div>
        )}

        {/* Voile bas : assure la lisibilité des pastilles posées dessus. */}
        <span
          className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent"
          aria-hidden
        />

        <div className="absolute inset-x-3 bottom-2.5 flex flex-wrap items-center gap-1.5">
          <Badge className="h-6 gap-1.5 border-0 bg-white/95 px-2 text-[11px] font-semibold text-neutral-900 backdrop-blur">
            <Icon className="size-3" style={{ color: style.teinte }} aria-hidden />
            {style.libelle}
          </Badge>
          {offre.typeEmploi ? (
            <Badge className="h-6 border-0 bg-black/35 px-2 text-[11px] font-medium text-white backdrop-blur">
              {typeEmploiLabel(offre.typeEmploi)}
            </Badge>
          ) : null}
          {offre.estCloturee ? (
            <Badge className="h-6 border-0 bg-black/35 px-2 text-[11px] font-medium text-white backdrop-blur">
              Clôturée
            </Badge>
          ) : null}
        </div>

        {/* Le bouton d'action est posé sur un pastillage clair : à même le
            bandeau, son icône sombre se perdait dans le dégradé. */}
        {action ? (
          <div className="absolute right-2.5 top-2.5 z-20 rounded-full bg-white/90 text-neutral-900 shadow-sm backdrop-blur dark:bg-neutral-900/80 dark:text-white">
            {action}
          </div>
        ) : null}
      </div>

      {/* ─────────────────────────────────────────────────── Contenu */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[17px] font-bold leading-snug">
          {href ? (
            <Link
              href={href}
              className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {offre.titre}
            </Link>
          ) : (
            offre.titre
          )}
        </h3>

        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          {offre.entreprise ? (
            <p className="flex items-center gap-1.5">
              <Building2 className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{offre.entreprise}</span>
            </p>
          ) : null}
          {offre.localisation ? (
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{offre.localisation}</span>
            </p>
          ) : null}
        </div>

        {salaire ? (
          <p className="mt-3 text-sm font-semibold tabular-nums">{salaire}</p>
        ) : null}

        {/* Pied de carte, plaqué en bas : la ligne reste alignée d'une carte à
            l'autre quelle que soit la longueur du titre. */}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {formatRelative(offre.datePublication)}
          </span>

          {likes > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3.5" aria-hidden />
              <span className="tabular-nums">{likes}</span>
              <span className="sr-only">j&apos;aime</span>
            </span>
          ) : null}

          {commentaires > 0 ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5" aria-hidden />
              <span className="tabular-nums">{commentaires}</span>
              <span className="sr-only">commentaires</span>
            </span>
          ) : null}

          {echeance ? (
            <Badge
              variant="outline"
              className={cn("ml-auto h-6 px-2 text-[11px] font-medium", echeance.ton)}
            >
              {echeance.texte}
            </Badge>
          ) : null}
        </div>
      </div>
    </article>
  );
}
