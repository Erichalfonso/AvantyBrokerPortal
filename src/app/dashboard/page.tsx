"use client";

import { useAuth } from "@/context/auth-context";
import { useTrips } from "@/context/trip-context";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { TripStatus } from "@/types";
import { useState, useEffect } from "react";

interface DashboardStats {
  totalTrips: number;
  pendingTrips: number;
  activeTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  todayTrips: number;
  statusBreakdown: { status: string; count: number; color: string }[];
  providerStats: { id: string; name: string; tripCount: number }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { trips, loading } = useTrips();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch(("/api/dashboard/stats"), { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});
  }, []);

  // Fallback stats from context if API fails
  const displayStats = stats || {
    totalTrips: trips.length,
    pendingTrips: trips.filter((t) => t.status === "pending").length,
    activeTrips: trips.filter((t) => ["assigned", "accepted", "driver_en_route", "passenger_picked_up"].includes(t.status)).length,
    completedTrips: trips.filter((t) => t.status === "completed").length,
    cancelledTrips: trips.filter((t) => t.status === "cancelled").length,
    todayTrips: 0,
    statusBreakdown: [],
    providerStats: [],
  };

  const isProvider = user?.role === "provider";
  const pendingResponse = isProvider ? trips.filter((t) => t.status === "assigned") : [];
  const recentTrips = trips.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted mt-1">
          Here&apos;s your trip overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total" value={displayStats.totalTrips} color="bg-navy" />
        <StatCard label="Today" value={displayStats.todayTrips} color="bg-indigo-500" />
        <StatCard label="Pending" value={displayStats.pendingTrips} color="bg-warning" />
        <StatCard label="Active" value={displayStats.activeTrips} color="bg-teal" />
        <StatCard label="Completed" value={displayStats.completedTrips} color="bg-success" />
        <StatCard label="Cancelled" value={displayStats.cancelledTrips} color="bg-muted" />
      </div>

      {/* Pending Assignments Alert (Providers) */}
      {isProvider && pendingResponse.length > 0 && (
        <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">{pendingResponse.length}</span>
              </div>
              <div>
                <h3 className="text-navy font-semibold">
                  {pendingResponse.length === 1
                    ? "1 trip awaiting your response"
                    : `${pendingResponse.length} trips awaiting your response`}
                </h3>
                <p className="text-sm text-muted">Review and accept or decline assigned trips</p>
              </div>
            </div>
            <Link
              href="/dashboard/trips"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Review Trips
            </Link>
          </div>
        </div>
      )}

      {/* Reimbursement Forms - Quick Access */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Reimbursement Forms</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role !== "provider" && (
            <>
              <Link href="/dashboard/reimbursements/medicaid-trip" className="bg-card rounded-xl border border-border shadow-sm p-5 hover:border-teal hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-navy group-hover:text-teal transition-colors">Medicaid Trip Reimbursement</h3>
                <p className="text-sm text-muted mt-1">Submit trip reimbursement claims to Medicaid and health plans</p>
              </Link>
              <Link href="/dashboard/reimbursements/cms-1500" className="bg-card rounded-xl border border-border shadow-sm p-5 hover:border-teal hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-navy group-hover:text-teal transition-colors">CMS-1500 Claim Form</h3>
                <p className="text-sm text-muted mt-1">Standard healthcare claim form for NEMT reimbursement</p>
              </Link>
            </>
          )}
          {user?.role === "provider" && (
            <Link href="/dashboard/reimbursements/provider-invoice" className="bg-card rounded-xl border border-border shadow-sm p-5 hover:border-teal hover:shadow-md transition-all group">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              </div>
              <h3 className="font-semibold text-navy group-hover:text-teal transition-colors">Submit Invoice</h3>
              <p className="text-sm text-muted mt-1">Submit billing invoices for completed trips</p>
            </Link>
          )}
          <Link href="/dashboard/reimbursements" className="bg-card rounded-xl border border-border shadow-sm p-5 hover:border-teal hover:shadow-md transition-all group flex flex-col justify-center items-center text-center">
            <svg className="w-8 h-8 text-muted group-hover:text-teal transition-colors mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <h3 className="font-semibold text-navy group-hover:text-teal transition-colors">View All Forms</h3>
            <p className="text-sm text-muted mt-1">Browse and manage all reimbursement forms</p>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Status Breakdown */}
        {displayStats.statusBreakdown.length > 0 && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Trip Status Breakdown</h2>
            <div className="space-y-3">
              {displayStats.statusBreakdown.map((item) => {
                const pct = displayStats.totalTrips > 0 ? (item.count / displayStats.totalTrips) * 100 : 0;
                return (
                  <div key={item.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-navy capitalize">{item.status}</span>
                      <span className="text-muted">{item.count} ({Math.round(pct)}%)</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Provider Workload */}
        {displayStats.providerStats.length > 0 && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Provider Workload</h2>
            <div className="space-y-3">
              {displayStats.providerStats.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between">
                  <span className="text-sm text-navy">{provider.name}</span>
                  <span className="text-sm font-semibold text-teal">{provider.tripCount} trips</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {user?.role !== "provider" && (
              <>
                <Link href="/dashboard/trips/new" className="block w-full py-2.5 px-4 text-sm text-center bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors">
                  Create New Trip
                </Link>
                <Link href="/dashboard/queue" className="block w-full py-2.5 px-4 text-sm text-center border border-navy text-navy hover:bg-navy hover:text-white font-medium rounded-lg transition-colors">
                  View Assignment Queue
                </Link>
              </>
            )}
            <Link href="/dashboard/trips" className="block w-full py-2.5 px-4 text-sm text-center border border-border text-navy hover:bg-background font-medium rounded-lg transition-colors">
              View All Trips
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-navy">Recent Trips</h2>
          <Link href="/dashboard/trips" className="text-sm text-teal hover:text-teal-dark font-medium">
            View All
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted">Loading trips...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Trip ID</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Patient</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Date & Time</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Provider</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip) => (
                  <tr key={trip.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/dashboard/trips/${trip.tripNumber}`} className="text-teal font-medium hover:text-teal-dark">
                        {trip.tripNumber}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-navy">{trip.patientName}</td>
                    <td className="p-4 text-sm text-muted">
                      {new Date(trip.appointmentDate).toLocaleDateString()} at {trip.appointmentTime}
                    </td>
                    <td className="p-4 text-sm text-navy">{trip.provider?.name || "—"}</td>
                    <td className="p-4"><StatusBadge status={trip.status as TripStatus} /></td>
                  </tr>
                ))}
                {recentTrips.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted">No trips yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-2`}>
        <span className="text-white text-lg font-bold">{value}</span>
      </div>
      <p className="text-xl font-bold text-navy">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
