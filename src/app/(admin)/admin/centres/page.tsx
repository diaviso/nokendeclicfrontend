"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Check,
  Eye,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  School,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import {
  ConsolePastille,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import {
  ConsoleAction,
  ConsoleActions,
  ConsoleChamp,
  ConsoleChoixImage,
  ConsoleDialogue,
  ConsoleInterrupteur,
  ConsoleSection,
  useConfirmation,
} from "@/components/admin/console-kit";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import {
  adminApi,
  centresApi,
  errorMessage,
  fileUrl,
  type CentreFormationPayload,
  type CentrePourAdministration,
} from "@/lib/api";

const TEINTE = "var(--c-teal)";
const CLE = ["admin", "centres"] as const;

function Logo({ url, grand }: { url?: string | null; grand?: boolean }) {
  const taille = grand ? "size-14 rounded-xl" : "size-9 rounded-lg";
  if (!url) {
    return (
      <span
        className={`grid ${taille} shrink-0 place-items-center border bg-muted/40 text-muted-foreground`}
      >
        <School className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fileUrl(url)}
      alt=""
      className={`${taille} shrink-0 border bg-background object-contain p-0.5`}
    />
  );
}

/* ------------------------------------------------------------- Fiche */

interface Valeurs {
  nom: string;
  description: string;
  domaines: string;
  adresse: string;
  ville: string;
  region: string;
  telephone: string;
  emailContact: string;
  siteWeb: string;
  estPublie: boolean;
}

function valeursInitiales(centre: CentrePourAdministration | null): Valeurs {
  return {
    nom: centre?.nom ?? "",
    description: centre?.description ?? "",
    domaines: centre?.domaines ?? "",
    adresse: centre?.adresse ?? "",
    ville: centre?.ville ?? "",
    region: centre?.region ?? "",
    telephone: centre?.telephone ?? "",
    emailContact: centre?.emailContact ?? "",
    siteWeb: centre?.siteWeb ?? "",
    estPublie: centre?.estPublie ?? true,
  };
}

function DialogueCentre({
  centre,
  onFermer,
}: {
  centre: CentrePourAdministration | null;
  onFermer: () => void;
}) {
  const queryClient = useQueryClient();
  const [v, setV] = useState<Valeurs>(() => valeursInitiales(centre));
  const [logo, setLogo] = useState<File | null>(null);

  const changer =
    (cle: Exclude<keyof Valeurs, "estPublie">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setV((avant) => ({ ...avant, [cle]: e.target.value }));

  const enregistrer = useMutation({
    mutationFn: async () => {
      // Les champs vidés partent en `undefined` : la validation du serveur
      // refuserait une adresse de site ou un email vides.
      const texte = (valeur: string) => valeur.trim() || undefined;
      const payload: CentreFormationPayload = {
        nom: v.nom.trim(),
        description: texte(v.description),
        domaines: texte(v.domaines),
        adresse: texte(v.adresse),
        ville: texte(v.ville),
        region: texte(v.region),
        telephone: texte(v.telephone),
        emailContact: texte(v.emailContact),
        siteWeb: texte(v.siteWeb),
        estPublie: v.estPublie,
      };
      const enregistre = centre
        ? await centresApi.modifier(centre.id, payload)
        : await centresApi.creer(payload);
      if (logo) await centresApi.logo(enregistre.id, logo);
      return enregistre;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLE });
      toast.success(centre ? "Centre mis à jour" : "Centre créé");
      onFermer();
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", { description: errorMessage(error) }),
  });

  const champ = (
    id: Exclude<keyof Valeurs, "estPublie">,
    libelle: string,
    props: React.ComponentProps<typeof Input> & { large?: boolean; aide?: string } = {},
  ) => {
    const { large, aide, ...reste } = props;
    return (
      <ConsoleChamp
        id={`centre-${id}`}
        libelle={libelle}
        requis={reste.required}
        large={large}
        aide={aide}
      >
        <Input id={`centre-${id}`} value={v[id]} onChange={changer(id)} {...reste} />
      </ConsoleChamp>
    );
  };

  const valide = v.nom.trim().length >= 2;

  return (
    <ConsoleDialogue
      onFermer={onFermer}
      icone={centre ? Pencil : Plus}
      teinte={TEINTE}
      taille="lg"
      titre={centre ? `Modifier ${centre.nom}` : "Nouveau centre de formation"}
      description="Le téléphone et l'email sont publiés sur la fiche du centre : un jeune doit pouvoir le joindre."
      onSubmit={() => valide && enregistrer.mutate()}
      pied={
        <>
          <Button type="button" variant="ghost" className="rounded-lg" onClick={onFermer}>
            Annuler
          </Button>
          <Button type="submit" className="rounded-lg" disabled={enregistrer.isPending || !valide}>
            {enregistrer.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {centre ? "Enregistrer" : "Créer le centre"}
          </Button>
        </>
      }
    >
      <ConsoleSection titre="Identité" icone={School}>
        <ConsoleChoixImage
          libelle="Logo du centre"
          aide="PNG, JPG ou WebP, fond clair de préférence"
          actuelle={centre?.logoUrl ? fileUrl(centre.logoUrl) : null}
          fichier={logo}
          onChange={setLogo}
          icone={School}
        />
        {champ("nom", "Nom du centre", { required: true, maxLength: 160, large: true })}
        {champ("domaines", "Domaines enseignés", {
          placeholder: "Numérique, couture, BTP…",
          maxLength: 300,
          large: true,
          aide: "Séparés par des virgules : ils servent aussi à la recherche.",
        })}
        <ConsoleChamp id="centre-description" libelle="Présentation" large>
          <Textarea
            id="centre-description"
            rows={4}
            value={v.description}
            onChange={changer("description")}
            maxLength={2000}
            placeholder="Public visé, conditions d'admission, durée des formations…"
          />
        </ConsoleChamp>
      </ConsoleSection>

      <ConsoleSection titre="Localisation" icone={MapPin}>
        {champ("adresse", "Adresse", { large: true })}
        {champ("ville", "Ville")}
        {champ("region", "Région")}
      </ConsoleSection>

      <ConsoleSection titre="Contact public" icone={Phone}>
        {champ("telephone", "Téléphone", { placeholder: "+221 …" })}
        {champ("emailContact", "Email", { type: "email" })}
        {champ("siteWeb", "Site web", { type: "url", placeholder: "https://", large: true })}
      </ConsoleSection>

      <ConsoleSection titre="Diffusion" icone={Globe} colonnes={1}>
        <ConsoleInterrupteur
          icone={Eye}
          libelle="Visible du public"
          description="Masqué, le centre reste éditable ici mais n'apparaît plus sur le site."
          coche={v.estPublie}
          onChange={(estPublie) => setV((avant) => ({ ...avant, estPublie }))}
        />
      </ConsoleSection>
    </ConsoleDialogue>
  );
}

/* ------------------------------------------------- Formations reliées */

function DialogueFormations({
  centre,
  onFermer,
}: {
  centre: CentrePourAdministration;
  onFermer: () => void;
}) {
  const queryClient = useQueryClient();
  const [choisies, setChoisies] = useState(
    () => new Map(centre.formations.map((f) => [f.id, f.titre])),
  );
  const [recherche, setRecherche] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["admin", "offres", "formations", recherche],
    queryFn: () =>
      adminApi.offres({ typeOffre: "FORMATION", search: recherche.trim(), limit: 50 }),
    placeholderData: (precedent) => precedent,
  });
  const offres = data?.data ?? [];

  const basculer = (id: number, titre: string) =>
    setChoisies((avant) => {
      const suite = new Map(avant);
      if (suite.has(id)) suite.delete(id);
      else suite.set(id, titre);
      return suite;
    });

  const enregistrer = useMutation({
    mutationFn: () => centresApi.definirFormations(centre.id, [...choisies.keys()]),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLE });
      toast.success("Formations du centre enregistrées");
      onFermer();
    },
    onError: (error) =>
      toast.error("Enregistrement impossible", { description: errorMessage(error) }),
  });

  return (
    <ConsoleDialogue
      onFermer={onFermer}
      icone={Link2}
      teinte={TEINTE}
      taille="lg"
      titre={`Formations de ${centre.nom}`}
      description="Cochez les offres de formation dispensées par ce centre. Le lien apparaît des deux côtés : sur la fiche du centre et sur chaque offre."
      pied={
        <>
          <span className="mr-auto hidden text-xs text-muted-foreground sm:block">
            {choisies.size} formation{choisies.size > 1 ? "s" : ""} sélectionnée
            {choisies.size > 1 ? "s" : ""}
          </span>
          <Button type="button" variant="ghost" className="rounded-lg" onClick={onFermer}>
            Annuler
          </Button>
          <Button
            className="rounded-lg"
            disabled={enregistrer.isPending}
            onClick={() => enregistrer.mutate()}
          >
            {enregistrer.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Enregistrer ({choisies.size})
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sélection
          </p>
          {choisies.size ? (
            <ul className="flex flex-wrap gap-1.5">
              {[...choisies].map(([id, titre]) => (
                <li
                  key={id}
                  className="flex max-w-full items-center gap-1 rounded-full border bg-background py-1 pl-3 pr-1 text-xs font-medium shadow-sm"
                >
                  <span className="truncate">{titre}</span>
                  <button
                    type="button"
                    aria-label={`Retirer ${titre}`}
                    onClick={() => basculer(id, titre)}
                    className="grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune formation reliée.</p>
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une offre de formation…"
            aria-label="Rechercher une offre de formation"
            className="pl-9"
          />
          {isFetching ? (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {offres.length === 0 ? (
            <li className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Aucune offre de formation trouvée.
            </li>
          ) : (
            offres.map((offre) => {
              const coche = choisies.has(offre.id);
              return (
                <li key={offre.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors",
                      coche
                        ? "border-primary/40 bg-primary/[0.05]"
                        : "border-transparent hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                      checked={coche}
                      onChange={() => basculer(offre.id, offre.titre)}
                    />
                    <span className="min-w-0">
                      <span className="line-clamp-2 font-medium">{offre.titre}</span>
                      {offre.entreprise ? (
                        <span className="block text-xs text-muted-foreground">
                          {offre.entreprise}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </ConsoleDialogue>
  );
}

/* ----------------------------------------------------------------- Page */

export default function CentresConsolePage() {
  const queryClient = useQueryClient();
  const confirmer = useConfirmation();
  const [recherche, setRecherche] = useState("");
  const [edition, setEdition] = useState<{ centre: CentrePourAdministration | null } | null>(
    null,
  );
  const [liaison, setLiaison] = useState<CentrePourAdministration | null>(null);

  const { data: centres = [], isLoading } = useQuery({
    queryKey: CLE,
    queryFn: centresApi.listerPourAdministration,
  });

  const supprimer = useMutation({
    mutationFn: (id: number) => centresApi.supprimer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CLE });
      toast.success("Centre supprimé");
    },
    onError: (error) =>
      toast.error("Suppression impossible", { description: errorMessage(error) }),
  });

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return centres;
    return centres.filter((centre) =>
      [centre.nom, centre.ville, centre.region, centre.domaines]
        .filter(Boolean)
        .some((valeur) => valeur!.toLowerCase().includes(terme)),
    );
  }, [centres, recherche]);

  const publies = centres.filter((c) => c.estPublie).length;
  const liens = centres.reduce((somme, c) => somme + c.formations.length, 0);

  const colonnes: ColonneConsole<CentrePourAdministration>[] = [
    {
      cle: "nom",
      entete: "Centre",
      className: "w-[34%]",
      cellule: (centre) => (
        <div className="flex min-w-0 items-center gap-3">
          <Logo url={centre.logoUrl} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{centre.nom}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[centre.ville, centre.region].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      cle: "domaines",
      entete: "Domaines",
      secondaire: true,
      cellule: (centre) => (
        <span className="line-clamp-1 text-sm text-muted-foreground">
          {centre.domaines || "—"}
        </span>
      ),
    },
    {
      cle: "formations",
      entete: "Formations",
      align: "right",
      cellule: (centre) => (
        <span
          className={cn(
            "inline-flex min-w-7 justify-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums",
            centre.formations.length ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {centre.formations.length}
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "État",
      cellule: (centre) =>
        centre.estPublie ? (
          <ConsolePastille libelle="Publié" teinte="var(--success)" />
        ) : (
          <ConsolePastille libelle="Masqué" discret />
        ),
    },
    {
      cle: "actions",
      entete: "",
      align: "right",
      cellule: (centre) => (
        <ConsoleActions>
          <Button
            variant="outline"
            size="sm"
            className="mr-1 h-8 rounded-lg"
            onClick={() => setLiaison(centre)}
          >
            <Link2 className="size-3.5" />
            Formations
          </Button>
          {centre.estPublie ? (
            <ConsoleAction
              libelle="Voir la fiche publique"
              icone={ExternalLink}
              href={`/centres-formation/${centre.id}`}
              cible="_blank"
            />
          ) : null}
          <ConsoleAction
            libelle="Modifier"
            icone={Pencil}
            ton="primaire"
            onClick={() => setEdition({ centre })}
          />
          <ConsoleAction
            libelle="Supprimer"
            icone={Trash2}
            ton="danger"
            enCours={supprimer.isPending && supprimer.variables === centre.id}
            onClick={async () => {
              if (
                await confirmer({
                  titre: `Supprimer « ${centre.nom} » ?`,
                  message:
                    "Ses formations restent en ligne, simplement détachées du centre. Cette action est définitive.",
                  confirmer: "Supprimer",
                  danger: true,
                })
              ) {
                supprimer.mutate(centre.id);
              }
            }}
          />
        </ConsoleActions>
      ),
      className: "w-[17rem]",
    },
  ];

  return (
    <>
      <ConsoleHeader
        title="Centres de formation"
        icon={School}
        teinte={TEINTE}
        description="Les centres où se former, reliés aux offres de formation qu'ils dispensent. Dans la catégorie Formation, les membres choisissent entre les offres et les centres."
        mesures={[
          { label: "Centres", valeur: centres.length },
          { label: "Publiés", valeur: publies, teinte: "var(--success)" },
          { label: "Masqués", valeur: centres.length - publies },
          { label: "Formations reliées", valeur: liens, teinte: TEINTE },
        ]}
      />

      <ConsoleToolbar>
        <ConsoleSearch
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Nom, ville, région, domaine…"
          label="Rechercher un centre de formation"
        />
        <Button className="rounded-xl sm:ml-auto" onClick={() => setEdition({ centre: null })}>
          <Plus className="size-4" />
          Nouveau centre
        </Button>
      </ConsoleToolbar>

      <ConsoleTable
        lignes={filtres}
        colonnes={colonnes}
        cle={(centre) => centre.id}
        chargement={isLoading}
        rail={(centre) => (centre.estPublie ? "var(--success)" : undefined)}
        vide={
          <EmptyState
            icon={recherche ? BookOpen : School}
            couleur={TEINTE}
            title={recherche ? "Aucun centre ne correspond" : "Aucun centre de formation"}
            description={
              recherche
                ? "Essayez sur le nom, la ville ou un domaine."
                : "Créez un premier centre, puis reliez-lui ses offres de formation."
            }
            action={
              recherche ? undefined : (
                <Button className="rounded-xl" onClick={() => setEdition({ centre: null })}>
                  <Plus className="size-4" />
                  Nouveau centre
                </Button>
              )
            }
          />
        }
      />

      {edition ? (
        <DialogueCentre
          key={edition.centre?.id ?? "nouveau"}
          centre={edition.centre}
          onFermer={() => setEdition(null)}
        />
      ) : null}
      {liaison ? (
        <DialogueFormations
          key={liaison.id}
          centre={liaison}
          onFermer={() => setLiaison(null)}
        />
      ) : null}
    </>
  );
}
