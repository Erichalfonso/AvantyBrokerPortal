"use client";

import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/sidebar";
import { SessionTimeout } from "@/components/session-timeout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <SessionTimeout />
      <main className="lg:ml-64 p-4 pt-16 lg:p-8 lg:pt-8">{children}</main>
    </div>
  );
}
