"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { EditUserModal, type EditableUser } from "@/components/edit-user-modal";

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
  const [inviteResult, setInviteResult] = useState<{ name: string; email: string; emailed: boolean } | null>(null);
  const [resetResult, setResetResult] = useState<{ name: string; email: string; emailed: boolean } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
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
    setInviteResult(null);

    const res = await fetch(("/api/users"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        role: form.role,
        providerId: form.role === "provider" ? form.providerId || null : null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setInviteResult({ name: form.name, email: form.email, emailed: !!data.emailed });
      setForm({ name: "", email: "", role: "broker", providerId: "" });
      setShowForm(false);
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create user");
    }
    setSubmitting(false);
  };

  const handleResetPassword = async (userId: string, userName: string, userEmail: string) => {
    if (!confirm(`Reset password for ${userName}? A temporary password will be emailed to ${userEmail}.`)) return;
    setResettingId(userId);
    const res = await fetch(`/api/users/${userId}/reset-password`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setResetResult({ name: userName, email: userEmail, emailed: !!data.emailed });
    }
    setResettingId(null);
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
          onClick={() => { setShowForm(!showForm); setError(""); setInviteResult(null); }}
          className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ Create User"}
        </button>
      </div>

      {inviteResult && (
        inviteResult.emailed ? (
          <div className="mb-6 p-4 bg-green-50 border border-success/30 rounded-xl flex items-start justify-between">
            <div className="text-sm">
              <p className="font-semibold text-success">Invitation sent</p>
              <p className="text-navy mt-1">
                {inviteResult.name} ({<span className="font-mono">{inviteResult.email}</span>}) will receive a welcome email with sign-in instructions.
              </p>
            </div>
            <button onClick={() => setInviteResult(null)} className="text-muted hover:text-navy text-sm ml-3">Dismiss</button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300/50 rounded-xl flex items-start justify-between">
            <div className="text-sm">
              <p className="font-semibold text-amber-700">Account created, but invitation email failed</p>
              <p className="text-navy mt-1">
                The account for <span className="font-mono">{inviteResult.email}</span> was created. Email delivery failed — check SMTP configuration. Use <strong>Reset Password</strong> on the row to retry, or contact support.
              </p>
            </div>
            <button onClick={() => setInviteResult(null)} className="text-muted hover:text-navy text-sm ml-3">Dismiss</button>
          </div>
        )
      )}

      {resetResult && (
        <div className="mb-6 bg-amber-50 border border-amber-300/50 rounded-xl p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wider">Password Reset</h3>
            <button
              onClick={() => setResetResult(null)}
              className="text-muted hover:text-navy text-sm"
            >
              Dismiss
            </button>
          </div>
          {resetResult.emailed ? (
            <p className="text-sm text-navy">
              A temporary password has been emailed to <strong>{resetResult.email}</strong>. {resetResult.name} can use it to sign in and then change their password.
            </p>
          ) : (
            <p className="text-sm text-danger">
              Password was reset for <strong>{resetResult.email}</strong>, but email delivery failed. Check SMTP configuration and have the user contact support.
            </p>
          )}
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">New User Account</h2>
          <p className="text-sm text-muted mb-4">
            A temporary password will be generated and emailed to the new user. They&apos;ll be prompted to change it on first sign-in.
          </p>
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
              {submitting ? "Sending invitation…" : "Send Invitation"}
            </button>
          </form>
        </div>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          providers={providers}
          onSaved={async () => {
            setEditingUser(null);
            await fetchUsers();
          }}
          onCancel={() => setEditingUser(null)}
        />
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
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
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
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingUser({
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            role: u.role,
                            providerId: u.providerId,
                          })}
                          className="px-3 py-1 text-xs font-medium text-navy bg-background hover:bg-gray-100 border border-border rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleResetPassword(u.id, u.name, u.email)}
                          disabled={resettingId === u.id}
                          className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {resettingId === u.id ? "Resetting..." : "Reset Password"}
                        </button>
                      </div>
                    </td>
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
