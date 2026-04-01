"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";

interface UserEntry {
  id: string;
  name: string;
  email: string;
  role: string;
  providerId?: string | null;
  provider?: { id: string; name: string } | null;
  createdAt: string;
}

interface ProviderOption {
  id: string;
  name: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string; role: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "broker",
    providerId: "",
  });

  const fetchUsers = useCallback(async () => {
    const res = await fetch(("/api/users"), { credentials: "include" });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
      fetch(("/api/providers"), { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .then(setProviders)
        .catch(() => {});
    }
  }, [user, fetchUsers]);

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-navy">Access Denied</h1>
        <p className="text-muted mt-2">Admin access required.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const res = await fetch(("/api/users"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        providerId: form.role === "provider" ? form.providerId || null : null,
      }),
    });

    if (res.ok) {
      setCreatedCredentials({ name: form.name, email: form.email, password: form.password, role: form.role });
      setSuccess(`Account created for ${form.email}`);
      setForm({ name: "", email: "", password: "", role: "broker", providerId: "" });
      setShowForm(false);
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create user");
    }
    setSubmitting(false);
  };

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-800",
    broker: "bg-blue-100 text-blue-800",
    provider: "bg-teal/10 text-teal-dark",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">User Management</h1>
          <p className="text-muted mt-1">{users.length} users registered</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
          className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ Create User"}
        </button>
      </div>

      {createdCredentials && (
        <div className="mb-6 bg-green-50 border border-success/30 rounded-xl p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-success uppercase tracking-wider">Account Created Successfully</h3>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="text-muted hover:text-navy text-sm"
            >
              Dismiss
            </button>
          </div>
          <p className="text-sm text-navy mb-3">Share these credentials with the new user:</p>
          <div className="bg-white rounded-lg border border-border p-4 font-mono text-sm space-y-1">
            <p><span className="text-muted">Name:</span> <span className="text-navy">{createdCredentials.name}</span></p>
            <p><span className="text-muted">Email:</span> <span className="text-navy">{createdCredentials.email}</span></p>
            <p><span className="text-muted">Password:</span> <span className="text-navy">{createdCredentials.password}</span></p>
            <p><span className="text-muted">Role:</span> <span className="text-navy capitalize">{createdCredentials.role}</span></p>
          </div>
          <button
            onClick={() => {
              const text = `Login Credentials\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nRole: ${createdCredentials.role}`;
              navigator.clipboard.writeText(text);
            }}
            className="mt-3 px-4 py-2 text-sm bg-navy hover:bg-navy-dark text-white font-medium rounded-lg transition-colors"
          >
            Copy Credentials
          </button>
        </div>
      )}

      {success && !createdCredentials && (
        <div className="mb-6 p-4 bg-green-50 border border-success/30 rounded-xl text-sm text-success">
          {success}
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">New User Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Password *</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Role *</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                >
                  <option value="broker">Broker Staff</option>
                  <option value="provider">Transportation Provider</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {form.role === "provider" && (
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Assign to Provider *</label>
                <select
                  name="providerId"
                  value={form.providerId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                >
                  <option value="">Select a provider...</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {error && <p className="text-danger text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Name</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Email</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Role</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Provider</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-navy">{u.name}</td>
                    <td className="p-4 text-sm text-muted">{u.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[u.role] || "bg-gray-100 text-gray-800"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-navy">{u.provider?.name || "—"}</td>
                    <td className="p-4 text-sm text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
