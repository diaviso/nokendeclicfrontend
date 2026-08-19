"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi, errorMessage } from "@/lib/api";
import { passwordChecks } from "@/lib/schemas/auth";
import { cn } from "@/lib/utils";

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
}: {
  utilisateurId: number;
  nomUtilisateur: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);

  const controles = passwordChecks(motDePasse);
  const valide = controles.every((controle) => controle.ok);
  const identiques = motDePasse.length > 0 && motDePasse === confirmation;

  const definir = useMutation({
    mutationFn: () => adminApi.definirMotDePasse(utilisateurId, motDePasse),
    onSuccess: (resultat) => {
      setOuvert(false);
      setMotDePasse("");
      setConfirmation("");
      toast.success("Mot de passe redéfini", { description: resultat.message });
    },
    onError: (error) =>
      toast.error("Changement impossible", { description: errorMessage(error) }),
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg"
        onClick={() => setOuvert(true)}
      >
        <KeyRound className="size-4" />
        Définir un mot de passe
      </Button>

      <Dialog
        open={ouvert}
        onOpenChange={(valeur) => {
          setOuvert(valeur);
          if (!valeur) {
            // Rien ne subsiste à la fermeture : un mot de passe laissé dans un
            // champ se retrouverait proposé au compte suivant.
            setMotDePasse("");
            setConfirmation("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mot de passe de {nomUtilisateur}</DialogTitle>
            <DialogDescription>
              Le nouveau mot de passe remplace l&apos;ancien immédiatement.{" "}
              {nomUtilisateur} sera déconnecté de tous ses appareils et recevra
              une notification l&apos;en informant. Transmettez-le-lui par un
              canal sûr, et invitez-le à le changer.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(evenement) => {
              evenement.preventDefault();
              if (valide && identiques) definir.mutate();
            }}
            className="space-y-4"
            noValidate
          >
            <div>
              <Label htmlFor="nouveau-mot-de-passe">Nouveau mot de passe</Label>
              <div className="relative mt-1.5">
                <Input
                  id="nouveau-mot-de-passe"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  value={motDePasse}
                  onChange={(evenement) => setMotDePasse(evenement.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setVisible((precedent) => !precedent)}
                  aria-label={
                    visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
                  }
                  className="absolute right-0 top-0 grid h-9 w-10 place-items-center text-muted-foreground hover:text-foreground"
                >
                  {visible ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>

              {motDePasse.length > 0 ? (
                <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  {controles.map((controle) => (
                    <li
                      key={controle.label}
                      className={cn(
                        "flex items-center gap-1 text-[11px]",
                        controle.ok
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {controle.ok ? (
                        <Check className="size-3" />
                      ) : (
                        <X className="size-3" />
                      )}
                      {controle.label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <Label htmlFor="confirmation-mot-de-passe">Confirmer</Label>
              <Input
                id="confirmation-mot-de-passe"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                value={confirmation}
                onChange={(evenement) => setConfirmation(evenement.target.value)}
                className="mt-1.5"
              />
              {confirmation.length > 0 && !identiques ? (
                <p role="alert" className="mt-1 text-xs text-destructive">
                  Les deux saisies diffèrent.
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setOuvert(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={!valide || !identiques || definir.isPending}
              >
                {definir.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                Définir le mot de passe
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
