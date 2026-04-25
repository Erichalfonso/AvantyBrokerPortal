"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);
  const [tokenValid, setTokenValid] = useState<null | boolean>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setTokenValid(!!data.valid); })
      .catch(() => { if (!cancelled) setTokenValid(false); });
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/"), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to reset password. The link may have expired.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Image src="/images/logo-dark.png" alt="Avanty Care" width={200} height={200} priority className="mx-auto mb-3" />
        <p className="text-muted text-sm">Broker Portal</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {tokenValid === null && (
          <p className="text-muted text-sm text-center">Verifying link…</p>
        )}

        {tokenValid === false && (
          <div>
            <h1 className="text-xl font-bold text-navy mb-2">Link expired</h1>
            <p className="text-sm text-muted mb-6">
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="block w-full text-center py-3 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Request New Link
            </Link>
          </div>
        )}

        {tokenValid === true && success && (
          <div>
            <h1 className="text-xl font-bold text-navy mb-2">Password reset</h1>
            <p className="text-sm text-muted mb-6">Your password has been updated. Redirecting you to sign in…</p>
            <Link
              href="/"
              className="block w-full text-center py-3 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Sign In Now
            </Link>
          </div>
        )}

        {tokenValid === true && !success && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-navy">Choose a new password</h1>
              <p className="text-muted text-sm mt-1">Pick something at least 8 characters long.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-navy mb-1">New Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent focus:bg-white transition"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-navy mb-1">Confirm Password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent focus:bg-white transition"
                />
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                {loading ? "Saving..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-8 text-xs text-gray-400">&copy; 2026 Avanty Care. All rights reserved.</p>
    </div>
  );
}
