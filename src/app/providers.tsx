"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/context/auth-context";
import { TripProvider } from "@/context/trip-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <TripProvider>
          {children}
        </TripProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
