"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConsoleChamp, ConsoleDialogue } from "@/components/admin/console-kit";
import { adminApi, errorMessage } from "@/lib/api";
import { passwordChecks } from "@/lib/schemas/auth";
import { cn } from "@/lib/utils";

/**
 * Mot de passe aléatoire respectant les règles de `passwordChecks` : une
 * minuscule, une majuscule, un chiffre au moins, et une longueur confortable.
 * Les caractères ambigus (0/O, 1/l/I) sont écartés : il sera souvent dicté.
 */
function genererMotDePasse(longueur = 14): string {
  const minuscules = "abcdefghijkmnpqrstuvwxyz";
  const majuscules = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const chiffres = "23456789";
  const tous = minuscules + majuscules + chiffres;
  const tirage = new Uint32Array(longueur);
  crypto.getRandomValues(tirage);
  const caracteres = Array.from(tirage, (n, i) => {
    const source = i === 0 ? minuscules : i === 1 ? majuscules : i === 2 ? chiffres : tous;
    return source[n % source.length];
  });
  // Mélange : les trois caractères imposés ne restent pas en tête.
  for (let i = caracteres.length - 1; i > 0; i -= 1) {
    const j = tirage[i] % (i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join("");
}

/**
 * Redéfinition du mot de passe d'un compte, depuis la console.
 *
 * Sert au dépannage : une personne qui ne reçoit pas le courriel de
 * réinitialisation reste autrement enfermée dehors.
 *
 * L'écran énonce les conséquences avant l'action plutôt qu'après : le titulaire
 * sera déconnecté partout et recevra une notification. Ce n'est pas une
 * écriture discrète, et la présenter comme telle exposerait à des changements
 * faits à la légère.
 */
export function DefinirMotDePasse({
  utilisateurId,
  nomUtilisateur,
  className,
}: {
  utilisateurId: number;
  nomUtilisateur: string;
  className?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);

  const controles = passwordChecks(motDePasse);
  const valide = controles.every((controle) => controle.ok);
  const identiques = motDePasse.length > 0 && motDePasse === confirmation;

  // Rien ne subsiste à la fermeture : un mot de passe laissé dans un champ se
  // retrouverait proposé au compte suivant.
  const fermer = () => {
    setOuvert(false);
    setMotDePasse("");
    setConfirmation("");
    setVisible(false);
  };

  const definir = useMutation({
    mutationFn: () => adminApi.definirMotDePasse(utilisateurId, motDePasse),
    onSuccess: (resultat) => {
      fermer();
      toast.success("Mot de passe redéfini", { description: resultat.message });
    },
    onError: (error) =>
      toast.error("Changement impossible", { description: errorMessage(error) }),
  });

  const generer = () => {
    const nouveau = genererMotDePasse();
    setMotDePasse(nouveau);
    setConfirmation(nouveau);
    setVisible(true);
  };

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(motDePasse);
      toast.success("Mot de passe copié");
    } catch {
      toast.error("Copie impossible", {
        description: "Sélectionnez le mot de passe et copiez-le à la main.",
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn("rounded-lg", className)}
        onClick={() => setOuvert(true)}
      >
        <KeyRound className="size-4" />
        Définir un mot de passe
      </Button>

      <ConsoleDialogue
        ouvert={ouvert}
        onFermer={fermer}
        icone={KeyRound}
        teinte="var(--c-amber)"
        taille="sm"
        titre={`Mot de passe de ${nomUtilisateur}`}
        description="Le nouveau mot de passe remplace l'ancien immédiatement."
        onSubmit={() => {
          if (valide && identiques) definir.mutate();
        }}
        pied={
          <>
            <Button type="button" variant="ghost" className="rounded-lg" onClick={fermer}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="rounded-lg"
              disabled={!valide || !identiques || definir.isPending}
            >
              {definir.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Définir le mot de passe
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-[color-mix(in_oklch,var(--c-amber)_35%,transparent)] bg-[color-mix(in_oklch,var(--c-amber)_8%,transparent)] p-3 text-xs leading-relaxed">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--c-amber)]" aria-hidden />
            <p>
              {nomUtilisateur} sera <strong>déconnecté de tous ses appareils</strong> et
              recevra une notification l&apos;en informant. Transmettez-lui le mot de
              passe par un canal sûr, et invitez-le à le changer.
            </p>
          </div>

          <ConsoleChamp id="nouveau-mot-de-passe" libelle="Nouveau mot de passe" requis>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Input
                  id="nouveau-mot-de-passe"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  value={motDePasse}
                  onChange={(evenement) => setMotDePasse(evenement.target.value)}
                  className={cn("pr-10", visible && "font-mono")}
                />
                <button
                  type="button"
                  onClick={() => setVisible((precedent) => !precedent)}
                  aria-label={
                    visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
                  }
                  className="absolute right-0 top-0 grid h-9 w-10 place-items-center text-muted-foreground hover:text-foreground"
                >
                  {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 rounded-lg"
                onClick={generer}
                title="Générer un mot de passe solide"
              >
                <Sparkles className="size-4" />
                Générer
              </Button>
            </div>

            {motDePasse.length > 0 ? (
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                {controles.map((controle) => (
                  <li
                    key={controle.label}
                    className={cn(
                      "flex items-center gap-1 text-[11px]",
                      controle.ok ? "text-[var(--success)]" : "text-muted-foreground",
                    )}
                  >
                    {controle.ok ? <Check className="size-3" /> : <X className="size-3" />}
                    {controle.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </ConsoleChamp>

          <ConsoleChamp
            id="confirmation-mot-de-passe"
            libelle="Confirmer"
            requis
            erreur={
              confirmation.length > 0 && !identiques
                ? "Les deux saisies diffèrent."
                : undefined
            }
          >
            <Input
              id="confirmation-mot-de-passe"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(evenement) => setConfirmation(evenement.target.value)}
              className={cn(visible && "font-mono")}
            />
          </ConsoleChamp>

          {visible && valide && identiques ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={copier}
            >
              <Copy className="size-4" />
              Copier le mot de passe
            </Button>
          ) : null}
        </div>
      </ConsoleDialogue>
    </>
  );
}
