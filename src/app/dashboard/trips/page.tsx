"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useTrips } from "@/context/trip-context";
import { StatusBadge } from "@/components/status-badge";
import { TripStatus, TRIP_STATUS_LABELS, MOBILITY_LABELS, MobilityType } from "@/types";
import Link from "next/link";

export default function TripsPage() {
  const { user } = useAuth();
  const { trips, loading, fetchTrips } = useTrips();
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch with filters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== "all") params.status = statusFilter;
    if (debouncedSearch) params.search = debouncedSearch;
    fetchTrips(params);
  }, [statusFilter, debouncedSearch, fetchTrips]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {user?.role === "provider" ? "My Trips" : "All Trips"}
          </h1>
          <p className="text-muted mt-1">{trips.length} trips found</p>
        </div>
        {user?.role !== "provider" && (
          <Link
            href="/dashboard/trips/new"
            className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors"
          >
            + New Trip
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by patient, trip ID, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-navy placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TripStatus | "all")}
            className="px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            {Object.entries(TRIP_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading trips...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Trip ID</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Patient</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Pickup</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Destination</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Date & Time</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Type</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Provider</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/dashboard/trips/${trip.tripNumber}`} className="text-teal font-medium hover:text-teal-dark">
                        {trip.tripNumber}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-navy font-medium">{trip.patientName}</td>
                    <td className="p-4 text-sm text-muted max-w-48 truncate">{trip.pickupAddress}</td>
                    <td className="p-4 text-sm text-muted max-w-48 truncate">{trip.destinationAddress}</td>
                    <td className="p-4 text-sm text-navy whitespace-nowrap">
                      {new Date(trip.appointmentDate).toLocaleDateString()}<br />
                      <span className="text-muted">{trip.appointmentTime}</span>
                    </td>
                    <td className="p-4 text-sm text-navy">{MOBILITY_LABELS[trip.mobilityType as MobilityType] || trip.mobilityType}</td>
                    <td className="p-4 text-sm text-navy">{trip.provider?.name || "—"}</td>
                    <td className="p-4"><StatusBadge status={trip.status as TripStatus} /></td>
                  </tr>
                ))}
                {trips.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted">
                      No trips found matching your criteria.
                    </td>
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
