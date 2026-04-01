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
