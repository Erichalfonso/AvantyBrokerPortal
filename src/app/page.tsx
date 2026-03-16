"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(email, password);
    if (success) {
      window.location.href = "/dashboard";
    } else {
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  const quickLogin = async (quickEmail: string, quickPassword: string) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setLoading(true);
    const success = await login(quickEmail, quickPassword);
    if (success) {
      window.location.href = "/dashboard";
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-teal rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <Image
            src="/images/logo-dark.png"
            alt="Avanty Care"
            width={280}
            height={280}
            priority
            className="mx-auto mb-8"
          />
          <p className="text-white/80 text-lg max-w-md">
            Centralized trip coordination platform for Non-Emergency Medical Transportation
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Image
              src="/images/logo-dark.png"
              alt="Avanty Care"
              width={180}
              height={180}
              priority
              className="mx-auto"
            />
          </div>

          <h1 className="text-2xl font-bold text-navy mb-2">Welcome back</h1>
          <p className="text-muted mb-8">Sign in to the Broker Portal</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@avantycare.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-white text-navy placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-white text-navy placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-danger text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo Quick Login */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted mb-3">Demo Quick Login:</p>
            <div className="space-y-2">
              <button
                onClick={() => quickLogin("maria@avantycare.com", "broker123")}
                disabled={loading}
                className="w-full py-2 px-4 text-sm text-left rounded-lg border border-border hover:bg-teal/5 hover:border-teal transition-colors disabled:opacity-50"
              >
                <span className="font-medium text-navy">Broker Staff</span>
                <span className="text-muted ml-2">- Maria Lopez</span>
              </button>
              <button
                onClick={() => quickLogin("dispatch@saferide.com", "provider123")}
                disabled={loading}
                className="w-full py-2 px-4 text-sm text-left rounded-lg border border-border hover:bg-teal/5 hover:border-teal transition-colors disabled:opacity-50"
              >
                <span className="font-medium text-navy">Provider</span>
                <span className="text-muted ml-2">- SafeRide Transport</span>
              </button>
              <button
                onClick={() => quickLogin("admin@avantycare.com", "admin123")}
                disabled={loading}
                className="w-full py-2 px-4 text-sm text-left rounded-lg border border-border hover:bg-teal/5 hover:border-teal transition-colors disabled:opacity-50"
              >
                <span className="font-medium text-navy">Admin</span>
                <span className="text-muted ml-2">- Admin User</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
