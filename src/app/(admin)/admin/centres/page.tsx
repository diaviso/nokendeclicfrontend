"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  ExternalLink,
  ImageUp,
  Link2,
  Loader2,
  Pencil,
  Plus,
  School,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsoleHeader } from "@/components/admin/console-header";
import { ConsoleTable, type ColonneConsole } from "@/components/admin/console-table";
import {
  ConsolePastille,
  ConsoleSearch,
  ConsoleToolbar,
} from "@/components/admin/console-ui";
import { EmptyState } from "@/components/shared/empty-state";
import {
  adminApi,
  centresApi,
  errorMessage,
  fileUrl,
  type CentreFormationPayload,
  type CentrePourAdministration,
} from "@/lib/api";

const TEINTE = "var(--chart-2)";
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
  const apercuLogo = useMemo(() => (logo ? URL.createObjectURL(logo) : null), [logo]);
  const champLogo = useRef<HTMLInputElement>(null);

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
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div>
      <Label htmlFor={`centre-${id}`}>{libelle}</Label>
      <Input
        id={`centre-${id}`}
        className="mt-1.5"
        value={v[id]}
        onChange={changer(id)}
        {...props}
      />
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{centre ? `Modifier ${centre.nom}` : "Nouveau centre de formation"}</DialogTitle>
          <DialogDescription>
            Le téléphone et l&apos;email sont publiés sur la fiche du centre : un
            jeune doit pouvoir le joindre.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (v.nom.trim().length >= 2) enregistrer.mutate();
          }}
        >
          <div className="flex items-center gap-3">
            {apercuLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={apercuLogo} alt="" className="size-14 rounded-xl border object-contain p-1" />
            ) : (
              <Logo url={centre?.logoUrl} grand />
            )}
            <input
              ref={champLogo}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => champLogo.current?.click()}
            >
              <ImageUp className="size-4" />
              {centre?.logoUrl || logo ? "Changer le logo" : "Ajouter un logo"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {champ("nom", "Nom du centre", { required: true, maxLength: 160 })}
            </div>
            <div className="sm:col-span-2">
              {champ("domaines", "Domaines enseignés", {
                placeholder: "Numérique, couture, BTP…",
                maxLength: 300,
              })}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="centre-description">Présentation</Label>
              <Textarea
                id="centre-description"
                className="mt-1.5"
                rows={4}
                value={v.description}
                onChange={changer("description")}
                maxLength={2000}
              />
            </div>
            <div className="sm:col-span-2">{champ("adresse", "Adresse")}</div>
            {champ("ville", "Ville")}
            {champ("region", "Région")}
            {champ("telephone", "Téléphone")}
            {champ("emailContact", "Email", { type: "email" })}
            <div className="sm:col-span-2">
              {champ("siteWeb", "Site web", { type: "url", placeholder: "https://" })}
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={v.estPublie}
                onChange={(e) => setV((avant) => ({ ...avant, estPublie: e.target.checked }))}
              />
              Visible du public
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onFermer}>
              Annuler
            </Button>
            <Button type="submit" disabled={enregistrer.isPending || v.nom.trim().length < 2}>
              {enregistrer.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    <Dialog open onOpenChange={(o) => !o && onFermer()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Formations de {centre.nom}</DialogTitle>
          <DialogDescription>
            Cochez les offres de formation dispensées par ce centre. Le lien
            apparaît des deux côtés : sur la fiche du centre et sur chaque offre.
          </DialogDescription>
        </DialogHeader>

        {choisies.size ? (
          <ul className="flex flex-wrap gap-1.5">
            {[...choisies].map(([id, titre]) => (
              <li
                key={id}
                className="flex max-w-full items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-xs font-medium"
              >
                <span className="truncate">{titre}</span>
                <button
                  type="button"
                  aria-label={`Retirer ${titre}`}
                  onClick={() => basculer(id, titre)}
                  className="grid size-5 shrink-0 place-items-center rounded-full hover:bg-background"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune formation reliée.</p>
        )}

        <div className="relative">
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une offre de formation…"
            aria-label="Rechercher une offre de formation"
          />
          {isFetching ? (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
          {offres.length === 0 ? (
            <li className="p-3 text-sm text-muted-foreground">Aucune offre de formation trouvée.</li>
          ) : (
            offres.map((offre) => (
              <li key={offre.id}>
                <label className="flex cursor-pointer items-start gap-3 p-3 text-sm hover:bg-muted/40">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                    checked={choisies.has(offre.id)}
                    onChange={() => basculer(offre.id, offre.titre)}
                  />
                  <span className="min-w-0">
                    <span className="line-clamp-2 font-medium">{offre.titre}</span>
                    {offre.entreprise ? (
                      <span className="block text-xs text-muted-foreground">{offre.entreprise}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))
          )}
        </ul>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onFermer}>
            Annuler
          </Button>
          <Button disabled={enregistrer.isPending} onClick={() => enregistrer.mutate()}>
            {enregistrer.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Enregistrer ({choisies.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------------------------------------- Page */

export default function CentresConsolePage() {
  const queryClient = useQueryClient();
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
        <span className="tabular-nums">{centre.formations.length}</span>
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
        <div className="flex items-center justify-end gap-1">
          {centre.estPublie ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              aria-label={`Voir la fiche publique de ${centre.nom}`}
              render={<Link href={`/centres-formation/${centre.id}`} target="_blank" />}
            >
              <ExternalLink className="size-4" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            aria-label={`Modifier ${centre.nom}`}
            onClick={() => setEdition({ centre })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-destructive"
            aria-label={`Supprimer ${centre.nom}`}
            disabled={supprimer.isPending}
            onClick={() => {
              if (
                window.confirm(
                  `Supprimer « ${centre.nom} » ? Ses formations restent en ligne, simplement détachées du centre.`,
                )
              ) {
                supprimer.mutate(centre.id);
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => setLiaison(centre)}
          >
            <Link2 className="size-4" />
            Formations
          </Button>
        </div>
      ),
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
          { label: "Formations reliées", valeur: liens },
        ]}
      />

      <ConsoleToolbar>
        <ConsoleSearch
          valeur={recherche}
          onChange={setRecherche}
          placeholder="Nom, ville, région, domaine…"
          label="Rechercher un centre de formation"
        />
        <Button className="ml-auto rounded-lg" onClick={() => setEdition({ centre: null })}>
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
