import type { Metadata } from "next";

// Les pages d'authentification sont des composants client : elles ne peuvent
// pas exporter `metadata`. Le titre est donc porté par ce layout.
export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Recevez un lien de réinitialisation par email.",
  robots: { index: false, follow: false },
};

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
