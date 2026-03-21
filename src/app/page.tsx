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

    try {
      const success = await login(email, password);
      if (success) {
        window.location.href = "/dashboard";
      } else {
        setError("Invalid email or password.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const quickLogin = async (quickEmail: string, quickPassword: string) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError("");
    setLoading(true);
    try {
      const success = await login(quickEmail, quickPassword);
      if (success) {
        window.location.href = "/dashboard";
      } else {
        setError("Invalid email or password.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Image
          src="/images/logo-dark.png"
          alt="Avanty Care"
          width={200}
          height={200}
          priority
          className="mx-auto mb-3"
        />
        <p className="text-muted text-sm">Broker Portal</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-navy">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Sign in to the Broker Portal</p>
        </div>

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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent focus:bg-white transition"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent focus:bg-white transition"
            />
          </div>

          {error && (
            <p className="text-danger text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      {/* Demo Quick Login - only visible in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="w-full max-w-md mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-muted mb-3">Demo Quick Login:</p>
          <div className="space-y-2">
            <button
              onClick={() => quickLogin("maria@avantycare.com", "broker123")}
              disabled={loading}
              className="w-full py-2 px-4 text-sm text-left rounded-lg border border-gray-200 hover:bg-teal/5 hover:border-teal transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-navy">Broker Staff</span>
              <span className="text-muted ml-2">- Maria Lopez</span>
            </button>
            <button
              onClick={() => quickLogin("dispatch@saferide.com", "provider123")}
              disabled={loading}
              className="w-full py-2 px-4 text-sm text-left rounded-lg border border-gray-200 hover:bg-teal/5 hover:border-teal transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-navy">Provider</span>
              <span className="text-muted ml-2">- SafeRide Transport</span>
            </button>
            <button
              onClick={() => quickLogin("admin@avantycare.com", "admin123")}
              disabled={loading}
              className="w-full py-2 px-4 text-sm text-left rounded-lg border border-gray-200 hover:bg-teal/5 hover:border-teal transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-navy">Admin</span>
              <span className="text-muted ml-2">- Admin User</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400">
        &copy; 2026 Avanty Care. All rights reserved.
      </p>
    </div>
  );
}
