"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { MOBILITY_LABELS, MobilityType } from "@/types";
import Link from "next/link";

interface ProviderDetail {
  id: string;
  code: string;
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

interface Credential {
  id: string;
  type: string;
  status: string;
  documentNumber?: string | null;
  issuedDate?: string | null;
  expirationDate?: string | null;
  verifiedAt?: string | null;
  notes?: string | null;
}

const CREDENTIAL_TYPE_LABELS: Record<string, string> = {
  business_license: "Business License",
  insurance_coi: "Insurance (COI)",
  vehicle_inspection: "Vehicle Inspection",
  background_check: "Background Check",
  drug_test: "Drug Test",
  cpr_certification: "CPR Certification",
  hipaa_training: "HIPAA Training",
  fwa_training: "FWA Training",
  ada_training: "ADA Training",
  drivers_license: "Driver's License",
  oig_screening: "OIG Screening",
  sam_screening: "SAM.gov Screening",
  other: "Other",
};

const CREDENTIAL_STATUS_COLORS: Record<string, string> = {
  valid: "bg-green-100 text-green-800",
  expiring: "bg-yellow-100 text-yellow-800",
  expired: "bg-red-100 text-red-800",
  pending: "bg-blue-100 text-blue-800",
  rejected: "bg-gray-100 text-gray-800",
};

export default function ProviderDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCredForm, setShowCredForm] = useState(false);
  const [credForm, setCredForm] = useState({ type: "business_license", status: "pending", documentNumber: "", expirationDate: "", notes: "" });

  const isAdmin = user?.role === "admin";

  const fetchProvider = useCallback(async () => {
    const res = await fetch((`/api/providers/${params.id}`), { credentials: "include" });
    if (res.ok) setProvider(await res.json());
    setLoading(false);
  }, [params.id]);

  const fetchCredentials = useCallback(async () => {
    const res = await fetch(`/api/providers/${params.id}/credentials`, { credentials: "include" });
    if (res.ok) setCredentials(await res.json());
  }, [params.id]);

  useEffect(() => {
    fetchProvider();
    fetchCredentials();
    if (isAdmin) {
      fetch(("/api/users"), { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .then(setAllUsers)
        .catch(() => {});
    }
  }, [fetchProvider, fetchCredentials, isAdmin]);

  const addCredential = async () => {
    const res = await fetch(`/api/providers/${params.id}/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credForm),
    });
    if (res.ok) {
      setShowCredForm(false);
      setCredForm({ type: "business_license", status: "pending", documentNumber: "", expirationDate: "", notes: "" });
      fetchCredentials();
    }
  };

  const updateCredentialStatus = async (credId: string, status: string) => {
    const res = await fetch(`/api/providers/${params.id}/credentials/${credId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchCredentials();
  };

  const deleteCredential = async (credId: string) => {
    const res = await fetch(`/api/providers/${params.id}/credentials/${credId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) fetchCredentials();
  };

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
          <p className="text-sm font-mono text-teal font-medium">{provider.code}</p>
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

      {/* Credentials */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">
            Credentials ({credentials.length})
          </h2>
          {isAdmin && (
            <button
              onClick={() => setShowCredForm(!showCredForm)}
              className="text-sm px-3 py-1.5 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors"
            >
              + Add Credential
            </button>
          )}
        </div>

        {/* Add Credential Form */}
        {showCredForm && isAdmin && (
          <div className="mb-4 p-4 bg-background rounded-lg border border-border space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted uppercase mb-1">Type</label>
                <select
                  value={credForm.type}
                  onChange={(e) => setCredForm({ ...credForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                >
                  {Object.entries(CREDENTIAL_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted uppercase mb-1">Status</label>
                <select
                  value={credForm.status}
                  onChange={(e) => setCredForm({ ...credForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                >
                  <option value="pending">Pending</option>
                  <option value="valid">Valid</option>
                  <option value="expiring">Expiring</option>
                  <option value="expired">Expired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted uppercase mb-1">Document #</label>
                <input
                  value={credForm.documentNumber}
                  onChange={(e) => setCredForm({ ...credForm, documentNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
              <div>
                <label className="block text-xs text-muted uppercase mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={credForm.expirationDate}
                  onChange={(e) => setCredForm({ ...credForm, expirationDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted uppercase mb-1">Notes</label>
              <input
                value={credForm.notes}
                onChange={(e) => setCredForm({ ...credForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addCredential} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-medium rounded-lg transition-colors">
                Save
              </button>
              <button onClick={() => setShowCredForm(false)} className="px-4 py-2 border border-border text-navy text-sm rounded-lg hover:bg-background transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {credentials.length > 0 ? (
          <div className="space-y-2">
            {credentials.map((cred) => (
              <div key={cred.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CREDENTIAL_STATUS_COLORS[cred.status] || "bg-gray-100 text-gray-800"}`}>
                    {cred.status}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-navy">{CREDENTIAL_TYPE_LABELS[cred.type] || cred.type}</p>
                    <p className="text-xs text-muted">
                      {cred.documentNumber && `#${cred.documentNumber}`}
                      {cred.expirationDate && ` | Expires: ${new Date(cred.expirationDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    {cred.status !== "valid" && (
                      <button onClick={() => updateCredentialStatus(cred.id, "valid")} className="text-xs text-success hover:text-green-700 font-medium">
                        Verify
                      </button>
                    )}
                    <button onClick={() => deleteCredential(cred.id)} className="text-xs text-danger hover:text-red-700 font-medium">
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No credentials on file.</p>
        )}
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
