"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";

interface PerformanceReport {
  reportType: string;
  generatedAt: string;
  totalTrips: number;
  summary: { completed: number; cancelled: number; noShow: number; pending: number };
  providers: {
    providerId: string;
    providerName: string;
    totalTrips: number;
    completed: number;
    cancelled: number;
    noShow: number;
    rejected: number;
    completionRate: number;
    onTimeRate: number | null;
  }[];
}

interface ComplaintReport {
  reportType: string;
  totalComplaints: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byProvider: Record<string, number>;
  avgResolutionHours: number | null;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("performance");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [perfReport, setPerfReport] = useState<PerformanceReport | null>(null);
  const [complaintReport, setComplaintReport] = useState<ComplaintReport | null>(null);
  const [tripLogUrl, setTripLogUrl] = useState<string | null>(null);

  if (user?.role === "provider") {
    return <div className="text-center py-16 text-muted">Reports are available to brokers and admins.</div>;
  }

  const generateReport = async () => {
    setLoading(true);
    setPerfReport(null);
    setComplaintReport(null);
    setTripLogUrl(null);

    const params = new URLSearchParams({ type: reportType });
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

    const res = await fetch(`/api/reports?${params}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      if (data.reportType === "performance") setPerfReport(data);
      else if (data.reportType === "complaints") setComplaintReport(data);
      else if (data.reportType === "trip-log") {
        // Create downloadable JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        setTripLogUrl(URL.createObjectURL(blob));
      }
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Reports</h1>
        <p className="text-muted mt-1">Generate performance, trip log, and complaint reports</p>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <option value="performance">Provider Performance</option>
              <option value="trip-log">Trip Log Export</option>
              <option value="complaints">Complaint Summary</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          </div>
          <div className="flex items-end">
            <button onClick={generateReport} disabled={loading}
              className="w-full px-4 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Performance Report */}
      {perfReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Trips" value={perfReport.totalTrips} />
            <StatCard label="Completed" value={perfReport.summary.completed} color="text-green-600" />
            <StatCard label="Cancelled" value={perfReport.summary.cancelled} color="text-red-600" />
            <StatCard label="No Show" value={perfReport.summary.noShow} color="text-orange-600" />
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy uppercase">Provider</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-navy uppercase">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-navy uppercase">Completed</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-navy uppercase">Cancelled</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-navy uppercase">No Show</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-navy uppercase">Completion %</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-navy uppercase">On-Time %</th>
                </tr>
              </thead>
              <tbody>
                {perfReport.providers.map((p) => (
                  <tr key={p.providerId} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-navy">{p.providerName}</td>
                    <td className="px-4 py-3 text-center">{p.totalTrips}</td>
                    <td className="px-4 py-3 text-center text-green-600">{p.completed}</td>
                    <td className="px-4 py-3 text-center text-red-600">{p.cancelled}</td>
                    <td className="px-4 py-3 text-center text-orange-600">{p.noShow}</td>
                    <td className="px-4 py-3 text-center font-semibold">{p.completionRate}%</td>
                    <td className="px-4 py-3 text-center font-semibold">{p.onTimeRate !== null ? `${p.onTimeRate}%` : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complaint Report */}
      {complaintReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Complaints" value={complaintReport.totalComplaints} />
            <StatCard label="Open" value={complaintReport.byStatus["open"] || 0} color="text-red-600" />
            <StatCard label="Resolved" value={complaintReport.byStatus["resolved"] || 0} color="text-green-600" />
            <StatCard label="Avg Resolution" value={complaintReport.avgResolutionHours !== null ? `${complaintReport.avgResolutionHours}h` : "N/A"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">By Category</h3>
              <div className="space-y-2">
                {Object.entries(complaintReport.byCategory).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-muted capitalize">{cat.replace(/_/g, " ")}</span>
                    <span className="font-medium text-navy">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">By Provider</h3>
              <div className="space-y-2">
                {Object.entries(complaintReport.byProvider).map(([prov, count]) => (
                  <div key={prov} className="flex justify-between text-sm">
                    <span className="text-muted">{prov}</span>
                    <span className="font-medium text-navy">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Log Download */}
      {tripLogUrl && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 text-center">
          <p className="text-navy font-medium mb-4">Trip log generated successfully.</p>
          <a href={tripLogUrl} download={`trip-log-${fromDate || "all"}-to-${toDate || "all"}.json`}
            className="inline-block px-6 py-3 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors">
            Download Trip Log (JSON)
          </a>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 text-center">
      <p className={`text-2xl font-bold ${color || "text-navy"}`}>{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
