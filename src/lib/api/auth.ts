import { api, API_URL, tokenStore } from "./client";
import type { AuthTokens, User } from "../types";

export interface LoginResult {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  requiresVerification?: boolean;
  message?: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResult> {
    const { data } = await api.post<LoginResult>("/auth/login", {
      email,
      password,
    });
    if (data.accessToken) tokenStore.set(data.accessToken, data.refreshToken);
    return data;
  },

  /** Consigne l'acceptation de la version en vigueur pour le compte connecté. */
  async accepterCgu(): Promise<{ cguVersion: string; cguAccepteeLe: string }> {
    const { data } = await api.post<{ cguVersion: string; cguAccepteeLe: string }>(
      "/auth/cgu",
    );
    return data;
  },

  async register(payload: {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
    /** Le serveur consigne sa propre version : on ne transmet qu'un accord. */
    accepteCgu: boolean;
  }): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      "/auth/register",
      payload,
    );
    return data;
  },

  async verifyEmail(email: string, code: string): Promise<LoginResult> {
    const { data } = await api.post<LoginResult>("/auth/verify-email", {
      email,
      code,
    });
    // L'API renvoie `accessToken` en camelCase — l'ancien front ne testait que
    // `access_token`, si bien que les jetons n'étaient jamais persistés ici.
    if (data.accessToken) tokenStore.set(data.accessToken, data.refreshToken);
    return data;
  },

  async resendCode(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("/auth/resend-code", {
      email,
    });
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      "/auth/forgot-password",
      { email },
    );
    return data;
  },

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    const { data } = await api.post<{ valid: boolean }>(
      "/auth/validate-reset-token",
      { token },
    );
    return data;
  },

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      "/auth/reset-password",
      { token, password },
    );
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenStore.clear();
    }
  },

  googleUrl(): string {
    return `${API_URL}/auth/google`;
  },
};

export type { AuthTokens };
