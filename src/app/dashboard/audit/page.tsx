"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details?: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  TRIP_CREATED: "Trip Created",
  STATUS_CHANGED: "Status Changed",
  PROVIDER_ASSIGNED: "Provider Assigned",
  TRIP_UPDATED: "Trip Updated",
  PROVIDER_CREATED: "Provider Created",
  PROVIDER_UPDATED: "Provider Updated",
};

export default function AuditLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filterAction, setFilterAction] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (filterAction) params.set("action", filterAction);

    const res = await fetch((`/api/audit?${params}`), { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
    }
    setLoading(false);
  }, [page, filterAction]);

  useEffect(() => {
    if (user?.role === "admin") fetchLogs();
  }, [user, fetchLogs]);

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-navy">Access Denied</h1>
        <p className="text-muted mt-2">Admin access required.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Audit Log</h1>
          <p className="text-muted mt-1">System activity history</p>
        </div>
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
        >
          <option value="">All Actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading audit log...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted">No audit entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Timestamp</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Action</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Entity</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Details</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">User ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="p-4 text-sm text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy/10 text-navy">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-navy">
                      {log.entityType} <span className="text-muted">{log.entityId.substring(0, 8)}...</span>
                    </td>
                    <td className="p-4 text-sm text-muted max-w-64 truncate">{log.details || "—"}</td>
                    <td className="p-4 text-sm text-muted">{log.userId.substring(0, 8)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end mt-4 gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
