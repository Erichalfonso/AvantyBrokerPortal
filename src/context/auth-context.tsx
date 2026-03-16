"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
import { useSession } from "next-auth/react";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  providerId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role.toLowerCase(),
        providerId: session.user.providerId,
      }
    : null;

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      // Get CSRF token
      const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
      const { csrfToken } = await csrfRes.json();

      // Submit credentials - let browser handle cookies naturally
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, email, password }),
        credentials: "include",
        redirect: "follow",
      });

      // After redirect, check if we got a valid session
      const sessionRes = await fetch("/api/auth/session", { credentials: "include" });
      const sessionData = await sessionRes.json();
      return !!sessionData?.user;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
      const { csrfToken } = await csrfRes.json();
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken }),
        credentials: "include",
        redirect: "follow",
      });
    } catch { /* ignore */ }
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: status === "loading", login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
