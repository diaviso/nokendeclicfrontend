"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  Heart,
  Info,
  Link2,
  Loader2,
  MessageSquare,
  Send,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import {
  EmojiPicker,
  insererAuCurseur,
} from "@/components/shared/emoji-picker";
import { celebrer } from "@/components/shared/celebration";
import { errorMessage, likesApi, offresApi, retoursApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { absoluteUrl } from "@/lib/site";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Interactions d'une offre : « j'aime », partage et commentaires.
 *
 * La page de détail est rendue côté serveur pour l'indexation ; ce bloc est le
 * seul îlot client. Les compteurs initiaux viennent du rendu serveur, ce qui
 * évite un affichage à zéro le temps de la première requête.
 */

function initiales(nom: string): string {
  return nom.slice(0, 2).toUpperCase();
}

function BoutonLike({
  offreId,
  totalInitial,
}: {
  offreId: number;
  totalInitial: number;
}) {
  const t = useTranslations("interactions");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["likes", offreId],
    queryFn: () => likesApi.statut(offreId),
    // Sans session, la route personnelle répond 401 : le total du rendu serveur
    // suffit, et le bouton renvoie vers la connexion.
    enabled: Boolean(user),
    initialData: { total: totalInitial, liked: false },
  });

  const toggle = useMutation({
    mutationFn: () => likesApi.toggle(offreId),
    onSuccess: (statut) => {
      queryClient.setQueryData(["likes", offreId], statut);
      queryClient.invalidateQueries({ queryKey: ["offres"] });
    },
    onError: (error) =>
      toast.error(t("actionImpossible"), { description: errorMessage(error) }),
  });

  const total = data?.total ?? totalInitial;
  const liked = data?.liked ?? false;

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        render={<Link href={`/login?next=/offres/${offreId}`} />}
      >
        <Heart className="size-4" />
        J&apos;aime
        {total > 0 ? <span className="tabular-nums">{total}</span> : null}
      </Button>
    );
  }

  return (
    <Button
      variant={liked ? "default" : "outline"}
      size="sm"
      disabled={toggle.isPending}
      onClick={() => toggle.mutate()}
      aria-pressed={liked}
    >
      <Heart className={cn("size-4", liked && "fill-current")} />
      {liked ? t("aimeActif") : t("aime")}
      {total > 0 ? <span className="tabular-nums">{total}</span> : null}
    </Button>
  );
}

/** Aucune souscription : la présence de `navigator.share` ne change pas. */
const jamais = () => () => {};

export function BoutonPartage({
  titre,
  resume,
  url,
  pleineLargeur = false,
}: {
  titre: string;
  resume: string;
  url: string;
  /** Rendu en bloc, pour s'aligner sous un bouton d'action principal. */
  pleineLargeur?: boolean;
}) {
  const t = useTranslations("interactions");
  const [copie, setCopie] = useState(false);

  // `navigator.share` n'existe pas au rendu serveur ni sur la plupart des
  // navigateurs de bureau. `useSyncExternalStore` fournit un instantané serveur
  // explicite (false), ce qui évite une divergence d'hydratation sans passer
  // par un effet.
  const partageNatif = useSyncExternalStore(
    jamais,
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false,
  );

  async function copier() {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      toast.error(t("copieImpossible"), {
        description: t("copieAide"),
      });
    }
  }

  async function partager() {
    try {
      await navigator.share({ title: titre, text: resume, url });
    } catch {
      // Un partage annulé par l'utilisateur lève aussi : rien à signaler.
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTexte = encodeURIComponent(`${titre} — ${resume}`);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size={pleineLargeur ? "lg" : "sm"}
            className={pleineLargeur ? "w-full rounded-xl" : undefined}
          >
            <Share2 className="size-4" />
            {t("partager")}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        {partageNatif ? (
          <DropdownMenuItem onClick={partager}>
            <Share2 className="size-4" />
            {t("partagerNatif")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={copier}>
          {copie ? <Check className="size-4" /> : <Link2 className="size-4" />}
          {copie ? t("lienCopie") : t("copierLien")}
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`https://wa.me/?text=${encodedTexte}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`mailto:?subject=${encodeURIComponent(titre)}&body=${encodedTexte}%20${encodedUrl}`}
            />
          }
        >
          E-mail
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Commentaires({ offreId }: { offreId: number }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [contenu, setContenu] = useState("");
  const champ = useRef<HTMLTextAreaElement>(null);

  const { data: commentaires = [], isLoading } = useQuery({
    queryKey: ["commentaires", offreId],
    queryFn: () => offresApi.commentaires(offreId),
  });

  const publier = useMutation({
    mutationFn: () => offresApi.addCommentaire(offreId, contenu.trim()),
    onSuccess: async () => {
      setContenu("");
      await queryClient.invalidateQueries({ queryKey: ["commentaires", offreId] });
      toast.success("Commentaire publié");
    },
    onError: (error) =>
      toast.error("Publication impossible", { description: errorMessage(error) }),
  });

  const supprimer = useMutation({
    mutationFn: (id: number) => offresApi.removeCommentaire(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["commentaires", offreId] });
      toast.success("Commentaire supprimé");
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  return (
    <section id="commentaires" className="mt-4 rounded-lg border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <MessageSquare className="size-4" aria-hidden />
        Commentaires
        {commentaires.length > 0 ? (
          <span className="tabular-nums">({commentaires.length})</span>
        ) : null}
      </h2>

      {user ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (contenu.trim().length < 2) return;
            publier.mutate();
          }}
          className="mb-5"
        >
          <Textarea
            ref={champ}
            value={contenu}
            onChange={(event) => setContenu(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Posez une question ou partagez une information utile…"
            aria-label="Votre commentaire"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <EmojiPicker
                onChoisir={(symbole) =>
                  setContenu((precedent) =>
                    insererAuCurseur(champ.current, precedent, symbole),
                  )
                }
                label="Insérer un émoji dans le commentaire"
              />
              <span className="text-xs tabular-nums text-muted-foreground">
                {contenu.length}/2000
              </span>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={publier.isPending || contenu.trim().length < 2}
            >
              {publier.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Publier
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour participer à la discussion.
          </p>
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/login?next=/offres/${offreId}#commentaires`} />}
          >
            Se connecter
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid place-items-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : commentaires.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aucun commentaire"
          description="Soyez la première personne à réagir à cette offre."
        />
      ) : (
        <ul className="divide-y">
          {commentaires.map((commentaire) => {
            const peutSupprimer =
              user?.id === commentaire.auteur.id || user?.role === "ADMIN";
            return (
              <li key={commentaire.id} className="flex gap-3 py-4 first:pt-0">
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={commentaire.auteur.pictureUrl ?? undefined} alt="" />
                  <AvatarFallback className="text-xs">
                    {initiales(commentaire.auteur.username)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {commentaire.auteur.username}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelative(commentaire.datePublication)}
                    </span>
                    {peutSupprimer ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto size-7 text-muted-foreground hover:text-destructive"
                        aria-label="Supprimer le commentaire"
                        disabled={supprimer.isPending}
                        onClick={() => supprimer.mutate(commentaire.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                    {commentaire.contenu}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Retour d'expérience du membre sur cette offre.
 *
 * Un retour n'est pas un commentaire : il est privé. Le service ne renvoie à un
 * membre que les siens — seule l'équipe voit l'ensemble et peut y répondre.
 * C'est ce qui permet d'écrire « je n'ai jamais eu de réponse » ou « l'annonce
 * ne correspondait pas » sans que l'employeur le lise.
 *
 * La section ne s'affiche donc qu'aux membres connectés, et reste discrète tant
 * que rien n'a été écrit : ce n'est pas la raison pour laquelle on ouvre la
 * page d'une offre.
 */
/**
 * Explication de ce qu'est un « retour ».
 *
 * Le mot ne dit pas de lui-même s'il s'agit d'un avis public, d'un signalement
 * ou d'un message à l'équipe — et cette hésitation suffit à ce qu'on n'écrive
 * rien. L'explication est donc posée à côté du titre, dans une bulle ouverte au
 * clic plutôt qu'au survol : sur un téléphone, il n'y a pas de survol.
 */
function ExplicationRetour() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Qu'est-ce qu'un retour d'expérience ?"
            className="grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <Info className="size-3.5" aria-hidden />
          </button>
        }
      />
      <PopoverContent align="start" className="w-80 text-sm leading-relaxed">
        <p className="font-semibold text-foreground">
          Qu&apos;est-ce qu&apos;un retour d&apos;expérience ?
        </p>
        <p className="mt-1.5 text-muted-foreground">
          C&apos;est ce que vous avez vécu avec cette opportunité : avez-vous
          candidaté, obtenu une réponse, passé un entretien ? L&apos;offre
          était-elle conforme à l&apos;annonce ?
        </p>
        <ul className="mt-2.5 space-y-1.5 text-muted-foreground">
          <li className="flex gap-2">
            <span aria-hidden className="text-primary">•</span>
            <span>
              Il aide l&apos;équipe Noken à vérifier la qualité des offres
              publiées.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-primary">•</span>
            <span>
              Il reste{" "}
              <strong className="font-semibold text-foreground">privé</strong> :
              ni les autres membres ni la structure qui recrute ne le voient.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-primary">•</span>
            <span>Pour une question publique, utilisez plutôt les commentaires.</span>
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function MonRetour({ offreId }: { offreId: number }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [contenu, setContenu] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const champ = useRef<HTMLTextAreaElement>(null);

  const { data: retours = [] } = useQuery({
    queryKey: ["retours", "offre", offreId],
    queryFn: () => retoursApi.byOffre(offreId),
    enabled: Boolean(user),
  });

  const publier = useMutation({
    mutationFn: () =>
      retoursApi.create({ offreId, contenu: contenu.trim() }),
    onSuccess: async () => {
      setContenu("");
      setOuvert(false);
      await queryClient.invalidateQueries({ queryKey: ["retours"] });
      celebrer();
      toast.success("Merci pour votre retour", {
        description: "Il aide l'équipe à vérifier la qualité des offres publiées.",
      });
    },
    onError: (error) =>
      toast.error("Envoi impossible", { description: errorMessage(error) }),
  });

  const supprimer = useMutation({
    mutationFn: (id: number) => retoursApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["retours"] });
      toast.success("Retour supprimé");
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  if (!user) return null;

  return (
    <section className="mt-4 rounded-lg border bg-card p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Star className="size-4" aria-hidden />
        Mon retour d&apos;expérience
        <ExplicationRetour />
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Visible uniquement par vous et par l&apos;équipe Noken. Il ne sera jamais
        publié sur cette page.
      </p>

      {retours.length > 0 ? (
        <ul className="mb-4 space-y-3">
          {retours.map((retour) => (
            <li key={retour.id} className="rounded-xl border bg-muted/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 whitespace-pre-wrap text-sm leading-relaxed">
                  {retour.contenu}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Supprimer mon retour"
                  disabled={supprimer.isPending}
                  onClick={() => supprimer.mutate(retour.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatRelative(retour.datePublication)}
              </p>

              {retour.reponses?.length ? (
                <ul className="mt-3 space-y-2 border-t pt-3">
                  {retour.reponses.map((reponse) => (
                    <li key={reponse.id} className="text-sm">
                      <p className="text-xs font-semibold">
                        {reponse.auteur.username}
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          {formatRelative(reponse.dateCreation)}
                        </span>
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-muted-foreground">
                        {reponse.contenu}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {ouvert ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (contenu.trim().length >= 2) publier.mutate();
          }}
        >
          <Textarea
            ref={champ}
            value={contenu}
            onChange={(event) => setContenu(event.target.value)}
            rows={4}
            maxLength={2000}
            autoFocus
            placeholder="Avez-vous candidaté ? Avez-vous eu une réponse ? L'annonce correspondait-elle à la réalité ?"
            aria-label="Votre retour d'expérience"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <EmojiPicker
                onChoisir={(symbole) =>
                  setContenu((precedent) =>
                    insererAuCurseur(champ.current, precedent, symbole),
                  )
                }
                label="Insérer un émoji dans le retour"
              />
              <span className="text-xs tabular-nums text-muted-foreground">
                {contenu.length}/2000
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOuvert(false);
                  setContenu("");
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={publier.isPending || contenu.trim().length < 2}
              >
                {publier.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Envoyer
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => setOuvert(true)}
        >
          <Star className="size-4" />
          {retours.length > 0 ? "Ajouter un retour" : "Partager mon retour"}
        </Button>
      )}
    </section>
  );
}

export function OffreInteractions({
  offreId,
  titre,
  resume,
  likesInitial,
}: {
  offreId: number;
  titre: string;
  resume: string;
  likesInitial: number;
}) {
  // L'URL de partage est construite à partir de l'adresse publique configurée,
  // et non de `window.location` : elle est ainsi identique au rendu serveur et
  // ne dépend pas du domaine par lequel la page a été atteinte.
  const url = absoluteUrl(`/offres/${offreId}`);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <BoutonLike offreId={offreId} totalInitial={likesInitial} />
        <BoutonPartage titre={titre} resume={resume} url={url} />
      </div>

      <MonRetour offreId={offreId} />
      <Commentaires offreId={offreId} />
    </>
  );
}
