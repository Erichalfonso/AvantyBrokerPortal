"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";

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
      // POST directly to the credentials callback with redirect: manual
      // to get reliable success/failure detection in NextAuth v5
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          csrfToken,
          email,
          password,
        }),
        redirect: "follow",
        credentials: "include",
      });

      // After following redirects, check if we ended up on an error page
      if (res.url?.includes("error")) {
        return false;
      }

      // Verify session cookie was set
      const sessionRes = await fetch("/api/auth/session", {
        credentials: "include",
      });
      const sessionData = await sessionRes.json();
      return !!sessionData?.user;
    } catch (err) {
      console.error("[auth] Login error:", err);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
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
