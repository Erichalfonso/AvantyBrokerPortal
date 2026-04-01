"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { MOBILITY_LABELS, MobilityType } from "@/types";
import Link from "next/link";

interface ProviderDetail {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  serviceAreas: string[];
  vehicleTypes: string[];
  active: boolean;
  users: { id: string; name: string; email: string; role: string }[];
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  providerId?: string | null;
}

export default function ProviderDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  const fetchProvider = useCallback(async () => {
    const res = await fetch((`/api/providers/${params.id}`), { credentials: "include" });
    if (res.ok) setProvider(await res.json());
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchProvider();
    if (isAdmin) {
      fetch(("/api/users"), { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .then(setAllUsers)
        .catch(() => {});
    }
  }, [fetchProvider, isAdmin]);

  const addUser = async () => {
    if (!selectedUserId) return;
    const res = await fetch((`/api/providers/${params.id}/users`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: selectedUserId }),
    });
    if (res.ok) {
      setSelectedUserId("");
      fetchProvider();
    }
  };

  const removeUser = async (userId: string) => {
    const res = await fetch((`/api/providers/${params.id}/users`), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId }),
    });
    if (res.ok) fetchProvider();
  };

  if (loading) return <div className="text-center py-16 text-muted">Loading provider...</div>;
  if (!provider) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-navy">Provider Not Found</h1>
        <Link href="/dashboard/providers" className="text-teal hover:text-teal-dark mt-4 inline-block">Back to Providers</Link>
      </div>
    );
  }

  // Users available to assign (not already linked to a provider)
  const availableUsers = allUsers.filter(
    (u) => !u.providerId && u.role !== "admin"
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/providers" className="text-sm text-teal hover:text-teal-dark font-medium">
          &larr; Back to Providers
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">{provider.name}</h1>
          <p className="text-muted mt-1">{provider.contactName}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          provider.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}>
          {provider.active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Provider Info */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Provider Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted uppercase">Phone</p>
            <p className="text-navy mt-0.5">{provider.phone}</p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase">Email</p>
            <p className="text-navy mt-0.5">{provider.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase">Service Areas</p>
            <p className="text-navy mt-0.5">{provider.serviceAreas.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase">Vehicle Types</p>
            <p className="text-navy mt-0.5">
              {provider.vehicleTypes.map((v) => MOBILITY_LABELS[v.toLowerCase() as MobilityType] || v).join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Users */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">
          Provider Users ({provider.users.length})
        </h2>

        {provider.users.length > 0 ? (
          <div className="space-y-3 mb-4">
            {provider.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div>
                  <p className="text-sm font-medium text-navy">{u.name}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => removeUser(u.id)}
                    className="text-xs text-danger hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted mb-4">No users assigned to this provider.</p>
        )}

        {isAdmin && availableUsers.length > 0 && (
          <div className="flex gap-3 pt-4 border-t border-border">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            >
              <option value="">Add user to this provider...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <button
              onClick={addUser}
              disabled={!selectedUserId}
              className="px-4 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
