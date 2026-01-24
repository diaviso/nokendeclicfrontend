import api from "./api";
import type { AuthTokens, User } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken?: string;
  access_token?: string;
  user?: User;
  requiresVerification?: boolean;
  message?: string;
}

interface VerifyEmailData {
  email: string;
  code: string;
}

export const authService = {
  loginWithGoogle: () => {
    window.location.href = `${API_URL}/auth/google`;
  },

  async login(data: LoginData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/login", data);
    if (response.data.accessToken || response.data.access_token) {
      saveTokens(response.data);
    }
    return response.data;
  },

  async register(data: RegisterData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/register", data);
    return response.data;
  },

  async verifyEmail(data: VerifyEmailData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/auth/verify-email", data);
    if (response.data.access_token) {
      saveTokens(response.data);
    }
    return response.data;
  },

  async resendVerificationCode(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>("/auth/resend-code", { email });
    return response.data;
  },

  async refreshTokens(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem("refreshToken");
    const { data } = await api.post<AuthTokens>("/auth/refresh", {
      refreshToken,
    });
    saveTokens(data);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      clearTokens();
    }
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  getToken: () => localStorage.getItem("accessToken") || localStorage.getItem("access_token"),
  
  getUser: (): User | null => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!(localStorage.getItem("accessToken") || localStorage.getItem("access_token")),
};

function saveTokens(data: AuthTokens | any) {
  const accessToken = data.accessToken || data.access_token;
  const refreshToken = data.refreshToken || data.refresh_token;
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export default authService;
