"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";

interface Complaint {
  id: string;
  complaintNumber: string;
  category: string;
  status: string;
  description: string;
  resolution?: string | null;
  provider?: { id: string; name: string } | null;
  trip?: { id: string; tripNumber: string } | null;
  reportedBy: string;
  createdAt: string;
  resolvedAt?: string | null;
}

interface Provider {
  id: string;
  name: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  late_pickup: "Late Pickup",
  no_show_driver: "Driver No-Show",
  vehicle_condition: "Vehicle Condition",
  driver_behavior: "Driver Behavior",
  billing: "Billing",
  accessibility: "Accessibility",
  safety: "Safety",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  investigating: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({ category: "other", description: "", providerId: "", tripId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  const fetchComplaints = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/complaints?${params}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setComplaints(data.complaints);
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    fetchComplaints();
    fetch("/api/providers", { credentials: "include" })
      .then((r) => r.ok ? r.json() : [])
      .then(setProviders)
      .catch(() => {});
  }, [fetchComplaints]);

  const createComplaint = async () => {
    const res = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ category: "other", description: "", providerId: "", tripId: "" });
      fetchComplaints();
    }
  };

  const updateComplaint = async (id: string, status: string, resolutionText?: string) => {
    const body: Record<string, string> = { status };
    if (resolutionText) body.resolution = resolutionText;
    const res = await fetch(`/api/complaints/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setEditingId(null);
      setResolution("");
      fetchComplaints();
    }
  };

  if (loading) return <div className="text-center py-16 text-muted">Loading complaints...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Complaint Tracking</h1>
          <p className="text-muted mt-1">{complaints.length} complaints</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          {user?.role !== "provider" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors"
            >
              + New Complaint
            </button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">New Complaint</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              >
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Provider</label>
              <select
                value={form.providerId}
                onChange={(e) => setForm({ ...form, providerId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              >
                <option value="">No provider</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Trip # (optional)</label>
              <input
                value={form.tripId}
                onChange={(e) => setForm({ ...form, tripId: e.target.value })}
                placeholder="e.g. T-1001"
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={createComplaint} disabled={!form.description.trim()} className="px-4 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              Submit Complaint
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border text-navy text-sm rounded-lg hover:bg-background transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="text-center py-16 text-muted">No complaints found.</div>
        ) : (
          complaints.map((c) => (
            <div key={c.id} className="bg-card rounded-xl border border-border shadow-sm p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-medium text-teal">{c.complaintNumber}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-800"}`}>
                    {c.status}
                  </span>
                  <span className="text-xs text-muted px-2 py-0.5 bg-background rounded-full">
                    {CATEGORY_LABELS[c.category] || c.category}
                  </span>
                </div>
                <span className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-navy mb-2">{c.description}</p>
              {c.provider && <p className="text-xs text-muted">Provider: {c.provider.name}</p>}
              {c.trip && <p className="text-xs text-muted">Trip: {c.trip.tripNumber}</p>}
              {c.resolution && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-medium text-green-800">Resolution:</p>
                  <p className="text-sm text-green-900">{c.resolution}</p>
                </div>
              )}

              {/* Actions */}
              {user?.role !== "provider" && c.status !== "closed" && (
                <div className="mt-4 pt-3 border-t border-border">
                  {editingId === c.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Enter resolution..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => updateComplaint(c.id, "resolved", resolution)} className="px-3 py-1.5 bg-success hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors">
                          Resolve
                        </button>
                        <button onClick={() => { setEditingId(null); setResolution(""); }} className="px-3 py-1.5 border border-border text-navy text-xs rounded-lg hover:bg-background transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {c.status === "open" && (
                        <button onClick={() => updateComplaint(c.id, "investigating")} className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors">
                          Investigate
                        </button>
                      )}
                      <button onClick={() => setEditingId(c.id)} className="px-3 py-1.5 bg-success hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors">
                        Resolve
                      </button>
                      <button onClick={() => updateComplaint(c.id, "closed")} className="px-3 py-1.5 border border-border text-navy text-xs rounded-lg hover:bg-background transition-colors">
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
