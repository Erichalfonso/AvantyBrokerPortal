"use client";

import { useState } from "react";

export interface EditableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  providerId?: string | null;
}

interface ProviderOption {
  id: string;
  name: string;
}

interface EditUserModalProps {
  user: EditableUser;
  providers: ProviderOption[];
  onSaved: () => void | Promise<void>;
  onCancel: () => void;
}

export function EditUserModal({ user, providers, onSaved, onCancel }: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [providerId, setProviderId] = useState(user.providerId || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          role,
          providerId: role === "provider" ? providerId || null : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update user.");
        return;
      }
      await onSaved();
    } catch {
      setError("Network error updating user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={submitting ? undefined : onCancel} />
      <div className="relative bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-navy mb-4">Edit User</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-navy uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy uppercase tracking-wider mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value="broker">Broker Staff</option>
              <option value="provider">Transportation Provider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {role === "provider" && (
            <div>
              <label className="block text-xs font-medium text-navy uppercase tracking-wider mb-1">
                Assign to Provider
              </label>
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              >
                <option value="">Select a provider...</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-danger text-sm mt-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm text-muted hover:text-navy font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-4 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
