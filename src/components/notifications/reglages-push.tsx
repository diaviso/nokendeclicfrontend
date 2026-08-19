"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  BellRing,
  Loader2,
  Smartphone,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNotificationsPush } from "@/hooks/use-notifications-push";
import { useInstallation } from "@/hooks/use-installation";
import {
  abonnerSon,
  definirSon,
  jouerCarillon,
  sonActif,
} from "@/lib/son-notification";

/**
 * Réglage des notifications sur l'appareil courant.
 *
 * « Sur cet appareil » n'est pas une formule : l'autorisation et l'abonnement
 * sont propres au navigateur. Quelqu'un qui active sur son téléphone ne recevra
 * rien sur son ordinateur, et l'écran doit le dire plutôt que de laisser croire
 * à un réglage de compte.
 */
export function ReglagesPush() {
  const { etat, erreur, activer, desactiver, essayer } = useNotificationsPush();
  const { installee, ios } = useInstallation();
  const [essaiEnCours, setEssaiEnCours] = useState(false);

  // Le réglage vit dans `localStorage`, absent au rendu serveur : il est lu par
  // un abonnement plutôt que posé dans un effet, ce qui évite à la fois l'écart
  // d'hydratation et un second rendu au montage.
  const avecSon = useSyncExternalStore(
    abonnerSon,
    () => (sonActif() ? "1" : "0"),
    () => "1",
  ) === "1";

  const active = etat === "activee";
  const occupe = etat === "en-cours";

  return (
    <section className="rounded-2xl border bg-card">
      <header className="flex items-start gap-3.5 border-b px-5 py-4">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{
            background: "color-mix(in oklch, var(--chart-4) 13%, transparent)",
            color: "var(--chart-4)",
          }}
        >
          {active ? (
            <BellRing className="size-5" aria-hidden />
          ) : (
            <Bell className="size-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold">Notifications sur cet appareil</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Nouvelles offres, réponses à vos messages, échéances proches.
          </p>
        </div>
      </header>

      <div className="space-y-4 p-5">
        {etat === "indisponible" ? (
          <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
            Ce navigateur ne sait pas recevoir de notifications.
            {ios && !installee ? (
              <>
                {" "}
                Sur iPhone, elles ne fonctionnent qu&apos;une fois
                l&apos;application ajoutée à l&apos;écran d&apos;accueil.
              </>
            ) : null}
          </p>
        ) : etat === "refusee" ? (
          <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
            Vous avez refusé les notifications pour ce site. Le navigateur ne
            redemandera plus : l&apos;autorisation se rétablit depuis ses
            réglages, à la ligne « Notifications » du cadenas dans la barre
            d&apos;adresse.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {active ? (
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={occupe}
                    onClick={() => void desactiver()}
                  >
                    {occupe ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <BellOff className="size-4" />
                    )}
                    Désactiver ici
                  </Button>

                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    disabled={essaiEnCours}
                    onClick={async () => {
                      setEssaiEnCours(true);
                      try {
                        const envoyees = await essayer();
                        if (envoyees === 0) {
                          toast.error("Aucun appareil n'a reçu l'essai", {
                            description:
                              "L'abonnement a peut-être été révoqué. Désactivez puis réactivez.",
                          });
                        }
                      } catch {
                        toast.error("L'essai n'a pas pu être envoyé");
                      } finally {
                        setEssaiEnCours(false);
                      }
                    }}
                  >
                    {essaiEnCours ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Envoyer un essai
                  </Button>
                </>
              ) : (
                <Button
                  className="rounded-xl"
                  disabled={occupe}
                  onClick={async () => {
                    const ok = await activer();
                    if (ok) {
                      jouerCarillon();
                      toast.success("Notifications activées sur cet appareil");
                    }
                  }}
                >
                  {occupe ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Bell className="size-4" />
                  )}
                  Activer les notifications
                </Button>
              )}
            </div>

            {erreur ? (
              <p role="alert" className="text-sm text-destructive">
                {erreur}
              </p>
            ) : null}

            <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
              <Volume2
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="son-notifications"
                    className="text-sm font-semibold"
                  >
                    Carillon quand l&apos;application est ouverte
                  </label>
                  <Switch
                    id="son-notifications"
                    checked={avecSon}
                    onCheckedChange={(valeur) => {
                      definirSon(valeur);
                      if (valeur) jouerCarillon();
                    }}
                  />
                </div>
                {/* Cette limite est celle du web, pas de la plateforme : autant
                    la dire ici plutôt que de laisser chercher un réglage qui
                    n'existe pas. */}
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Application fermée, le son est celui que votre téléphone
                  réserve aux notifications — aucun site web ne peut en choisir
                  un autre. La vibration, elle, suit un rythme propre à Noken.
                </p>
              </div>
            </div>

            {!installee ? (
              <p className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <Smartphone className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Installez l&apos;application sur votre écran d&apos;accueil pour
                recevoir les notifications même navigateur fermé.
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
