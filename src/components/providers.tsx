"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { ServiceWorkerManager } from "@/components/pwa/service-worker";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { Confettis } from "@/components/shared/celebration";

export function Providers({ children }: { children: React.ReactNode }) {
  // Instancié dans un état pour ne pas partager le cache entre requêtes côté
  // serveur — un client au niveau module fuiterait des données entre visiteurs.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: (failureCount, error) => {
              // Inutile de réessayer une erreur d'autorisation.
              const status = (error as { response?: { status?: number } })
                ?.response?.status;
              if (status === 401 || status === 403 || status === 404) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <OfflineBanner />
          {children}
          <ServiceWorkerManager />
          <InstallPrompt />
          <Confettis />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
