import { ConsoleShell } from "@/components/admin/console-shell";

/**
 * La console vit dans son propre groupe de routes : elle ne traverse pas
 * `AppShell` et n'hérite donc ni du menu vertical de l'espace membre ni de la
 * barre basse mobile. Les URL restent inchangées — les parenthèses d'un groupe
 * ne comptent pas dans le chemin.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ConsoleShell>
      <div id="contenu">{children}</div>
    </ConsoleShell>
  );
}
