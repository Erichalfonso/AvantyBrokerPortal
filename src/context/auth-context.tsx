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

      console.log("[auth] signIn result:", JSON.stringify(result));

      // NextAuth v5 beta with redirect:false — check various response shapes
      if (result === undefined || result === null) {
        console.log("[auth] signIn returned null/undefined");
        return false;
      }

      // v4-style response object
      if (typeof result === "object" && "error" in result) {
        if (result.error) {
          console.log("[auth] signIn error:", result.error);
          return false;
        }
        return true;
      }

      // v5 beta may return a string URL or a Response
      // If we got here without error, assume success
      return true;
    } catch (err) {
      console.error("[auth] Login exception:", err);
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
