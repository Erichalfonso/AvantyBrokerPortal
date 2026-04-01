"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useTrips } from "@/context/trip-context";
import { StatusBadge } from "@/components/status-badge";
import { RejectModal } from "@/components/reject-modal";
import { TripStatus, TRIP_STATUS_LABELS, MOBILITY_LABELS, MobilityType } from "@/types";
import Link from "next/link";

export default function TripsPage() {
  const { user } = useAuth();
  const { trips, loading, pagination, fetchTrips, updateTripStatus } = useTrips();
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rejectingTrip, setRejectingTrip] = useState<{ id: string; tripNumber: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isProvider = user?.role === "provider";

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Fetch with filters and pagination
  useEffect(() => {
    const params: Record<string, string> = { page: String(page), limit: "20" };
    if (statusFilter !== "all") params.status = statusFilter;
    if (debouncedSearch) params.search = debouncedSearch;
    fetchTrips(params);
  }, [statusFilter, debouncedSearch, page, fetchTrips]);

  // Split trips for providers: pending response vs rest
  const pendingResponse = isProvider ? trips.filter((t) => t.status === "assigned") : [];
  const otherTrips = isProvider ? trips.filter((t) => t.status !== "assigned") : trips;

  const handleAccept = async (tripNumber: string) => {
    setActionLoading(tripNumber);
    await updateTripStatus(tripNumber, "accepted");
    setActionLoading(null);
  };

  const handleReject = async (reason: string) => {
    if (!rejectingTrip) return;
    setActionLoading(rejectingTrip.id);
    await updateTripStatus(rejectingTrip.tripNumber, "rejected", reason);
    setRejectingTrip(null);
    setActionLoading(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {isProvider ? "My Trips" : "All Trips"}
          </h1>
          <p className="text-muted mt-1">{pagination.total} trips total</p>
        </div>
        {!isProvider && (
          <div className="flex gap-2">
            <Link
              href="/dashboard/trips/import"
              className="px-4 py-2 border border-teal text-teal hover:bg-teal hover:text-white font-medium rounded-lg transition-colors"
            >
              Import
            </Link>
            <Link
              href="/dashboard/trips/new"
              className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors"
            >
              + New Trip
            </Link>
          </div>
        )}
      </div>

      {/* Pending Response Section (Providers Only) */}
      {isProvider && pendingResponse.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-navy">Awaiting Your Response</h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              {pendingResponse.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingResponse.map((trip) => (
              <div
                key={trip.id}
                className="bg-card rounded-xl border-2 border-blue-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      href={`/dashboard/trips/${trip.tripNumber}`}
                      className="text-teal font-semibold hover:text-teal-dark"
                    >
                      {trip.tripNumber}
                    </Link>
                    <StatusBadge status={trip.status as TripStatus} />
                    <span className="text-xs text-muted bg-background px-2 py-0.5 rounded">
                      {MOBILITY_LABELS[trip.mobilityType as MobilityType] || trip.mobilityType}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-navy">{trip.patientName}</p>
                  <div className="flex flex-col sm:flex-row sm:gap-6 mt-1 text-sm text-muted">
                    <span>
                      {new Date(trip.appointmentDate).toLocaleDateString()} at {trip.appointmentTime}
                    </span>
                    <span className="truncate">{trip.pickupAddress}</span>
                  </div>
                  <p className="text-sm text-muted truncate mt-0.5">
                    &rarr; {trip.destinationAddress}
                  </p>
                  {trip.specialInstructions && (
                    <p className="text-xs text-muted mt-1 italic">
                      Note: {trip.specialInstructions}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAccept(trip.tripNumber)}
                    disabled={actionLoading === trip.tripNumber}
                    className="px-5 py-2.5 bg-success hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                  >
                    {actionLoading === trip.tripNumber ? "..." : "Accept"}
                  </button>
                  <button
                    onClick={() => setRejectingTrip({ id: trip.id, tripNumber: trip.tripNumber })}
                    disabled={actionLoading === trip.tripNumber}
                    className="px-5 py-2.5 bg-danger hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Section Header for Providers */}
      {isProvider && pendingResponse.length > 0 && otherTrips.length > 0 && (
        <h2 className="text-lg font-semibold text-navy mb-4">Active & Past Trips</h2>
      )}

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
                  {!isProvider && (
                    <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Provider</th>
                  )}
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                  {isProvider && (
                    <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(isProvider ? otherTrips : trips).map((trip) => (
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
                    {!isProvider && (
                      <td className="p-4 text-sm text-navy">{trip.provider?.name || "—"}</td>
                    )}
                    <td className="p-4"><StatusBadge status={trip.status as TripStatus} /></td>
                    {isProvider && (
                      <td className="p-4">
                        {trip.status === "assigned" ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleAccept(trip.tripNumber)}
                              disabled={actionLoading === trip.tripNumber}
                              className="px-3 py-1 text-xs bg-success hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => setRejectingTrip({ id: trip.id, tripNumber: trip.tripNumber })}
                              disabled={actionLoading === trip.tripNumber}
                              className="px-3 py-1 text-xs bg-danger hover:bg-red-600 disabled:opacity-50 text-white font-medium rounded transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        ) : trip.status === "accepted" ? (
                          <span className="text-xs text-success font-medium">Accepted</span>
                        ) : null}
                      </td>
                    )}
                  </tr>
                ))}
                {(isProvider ? otherTrips : trips).length === 0 && (
                  <tr>
                    <td colSpan={isProvider ? 8 : 8} className="p-8 text-center text-muted">
                      No trips found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    page === pageNum
                      ? "bg-teal text-white"
                      : "border border-border hover:bg-background"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingTrip && (
        <RejectModal
          tripNumber={rejectingTrip.tripNumber}
          onConfirm={handleReject}
          onCancel={() => setRejectingTrip(null)}
        />
      )}
    </div>
  );
}
