"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      // NextAuth v5 beta: signIn returns a URL string on success, or an object/undefined on failure
      if (!result || (typeof result === "object" && result.error)) {
        return false;
      }

      // If we got a non-error response, verify the session was actually created
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session?.user) {
        return false;
      }

      return true;
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
