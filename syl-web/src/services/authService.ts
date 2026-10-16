import apiClient from "../lib/api-client";

export interface User {
  username: string;
  role: "admin" | "user" | "super_admin";
  token?: string;
}

const AUTH_KEY = "syl_auth_user";

export const authService = {
  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ): Promise<string> {
    const response = await apiClient.post("/api/auth/register", {
      firstName,
      lastName,
      email,
      password,
    });
    return response.data.message as string;
  },

  async verifyEmail(token: string): Promise<User> {
    const response = await apiClient.get(
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
    );
    const { accessToken, role } = response.data;
    const user: User = {
      username: "",
      role: (["admin", "user", "super_admin"].includes(role.toLowerCase())
        ? role.toLowerCase()
        : "user") as "admin" | "user" | "super_admin",
      token: accessToken,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const response = await apiClient.post("/api/auth/login", {
      email,
      password,
    });
    const { accessToken, role } = response.data;

    const user: User = {
      username: email,
      role: (["admin", "user", "super_admin"].includes(role.toLowerCase())
        ? role.toLowerCase()
        : "user") as "admin" | "user" | "super_admin",
      token: accessToken,
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "admin" || user?.role === "super_admin";
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/api/auth/forgot-password", { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post("/api/auth/reset-password", { token, newPassword });
  },
};
