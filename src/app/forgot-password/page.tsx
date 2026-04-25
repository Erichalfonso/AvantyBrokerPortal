"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Image src="/images/logo-dark.png" alt="Avanty Care" width={200} height={200} priority className="mx-auto mb-3" />
        <p className="text-muted text-sm">Broker Portal</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {submitted ? (
          <div>
            <h1 className="text-xl font-bold text-navy mb-2">Check your inbox</h1>
            <p className="text-sm text-muted mb-6">
              If an account exists for <strong className="text-navy">{email}</strong>, we&apos;ve sent a password reset link. The link expires in 1 hour.
            </p>
            <Link
              href="/"
              className="block w-full text-center py-3 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-navy">Forgot password?</h1>
              <p className="text-muted text-sm mt-1">Enter your email and we&apos;ll send you a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-navy mb-1">Email Address</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <Link href="/" className="block text-center text-sm text-teal hover:text-teal-dark font-medium">
                Back to Sign In
              </Link>
            </form>
          </>
        )}
      </div>

      <p className="mt-8 text-xs text-gray-400">&copy; 2026 Avanty Care. All rights reserved.</p>
    </div>
  );
}
