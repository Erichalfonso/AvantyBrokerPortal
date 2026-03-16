"use client";

import { useAuth } from "@/context/auth-context";
import { useTrips } from "@/context/trip-context";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { TripStatus } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const { trips, loading } = useTrips();

  const stats = {
    total: trips.length,
    pending: trips.filter((t) => t.status === "pending").length,
    active: trips.filter((t) =>
      ["assigned", "accepted", "driver_en_route", "passenger_picked_up"].includes(t.status)
    ).length,
    completed: trips.filter((t) => t.status === "completed").length,
  };

  const recentTrips = trips.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted mt-1">
          Here&apos;s your trip overview for today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Trips" value={stats.total} color="bg-navy" />
        <StatCard label="Pending" value={stats.pending} color="bg-warning" />
        <StatCard label="Active" value={stats.active} color="bg-teal" />
        <StatCard label="Completed" value={stats.completed} color="bg-success" />
      </div>

      {/* Recent Trips */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-navy">Recent Trips</h2>
          <Link
            href="/dashboard/trips"
            className="text-sm text-teal hover:text-teal-dark font-medium"
          >
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
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <span className="text-white text-xl font-bold">{value}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-navy">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}
