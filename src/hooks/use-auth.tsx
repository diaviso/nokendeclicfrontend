"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, tokenStore } from "@/lib/api";
import type { Role, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: Role) => boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.me,
    // On n'interroge pas /auth/me sans jeton : cela produirait un 401 à chaque
    // chargement de page publique.
    enabled: typeof window !== "undefined" && Boolean(tokenStore.access),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const user = data ?? null;

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
  }, [queryClient]);

  const logout = useCallback(async () => {
    await authApi.logout();
    queryClient.clear();
    router.push("/");
  }, [queryClient, router]);

  const hasRole = useCallback(
    (role: Role) => user?.role === role || user?.role === "ADMIN",
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      hasRole,
      refresh,
      logout,
    }),
    [user, isLoading, hasRole, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
