"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { StatusBadge } from "@/components/status-badge";
import { TripStatus, MOBILITY_LABELS, MobilityType } from "@/types";
import Link from "next/link";

interface QueueTrip {
  id: string;
  tripNumber: string;
  patientName: string;
  pickupAddress: string;
  destinationAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  mobilityType: string;
  status: string;
  provider?: { id: string; name: string } | null;
}

interface Provider {
  id: string;
  name: string;
  vehicleTypes: string[];
}

export default function QueuePage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<QueueTrip[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignError, setAssignError] = useState("");

  const fetchQueue = useCallback(async () => {
    try {
      // Fetch pending trips
      const pendingRes = await fetch(("/api/trips?status=pending&limit=100"), { credentials: "include" });
      const rejectedRes = await fetch(("/api/trips?status=rejected&limit=100"), { credentials: "include" });
      const pending = pendingRes.ok ? (await pendingRes.json()).trips : [];
      const rejected = rejectedRes.ok ? (await rejectedRes.json()).trips : [];

      // Sort by appointment date (soonest first)
      const all = [...pending, ...rejected].sort(
        (a: QueueTrip, b: QueueTrip) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
      setTrips(all);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQueue();
    fetch(("/api/providers?active=true"), { credentials: "include" })
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => {});
  }, [fetchQueue]);

  const handleAssign = async (tripId: string, providerId: string) => {
    setAssigning(tripId);
    setAssignError("");
    const res = await fetch((`/api/trips/${tripId}/assign`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ providerId }),
    });
    if (res.ok) {
      await fetchQueue();
    } else {
      const data = await res.json().catch(() => ({}));
      setAssignError(data.error || "Failed to assign provider.");
    }
    setAssigning(null);
  };

  if (user?.role === "provider") {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-navy">Access Denied</h1>
        <p className="text-muted mt-2">This page is for broker staff only.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Assignment Queue</h1>
        <p className="text-muted mt-1">
          {trips.length} trip{trips.length !== 1 ? "s" : ""} waiting for provider assignment
        </p>
      </div>

      {assignError && (
        <div className="mb-6 p-4 bg-red-50 border border-danger/30 rounded-xl flex items-start justify-between">
          <p className="text-sm text-danger">{assignError}</p>
          <button onClick={() => setAssignError("")} className="text-muted hover:text-navy text-sm ml-3">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted">Loading queue...</div>
      ) : trips.length === 0 ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <p className="text-lg font-medium text-navy">Queue is clear</p>
          <p className="text-muted mt-1">All trips have been assigned to providers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const eligibleProviders = providers.filter((p) =>
              p.vehicleTypes.some((v) => v.toLowerCase() === trip.mobilityType.toLowerCase())
            );

            return (
              <div key={trip.id} className="bg-card rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link href={`/dashboard/trips/${trip.tripNumber}`} className="text-lg font-semibold text-teal hover:text-teal-dark">
                        {trip.tripNumber}
                      </Link>
                      <StatusBadge status={trip.status as TripStatus} />
                      <span className="text-xs bg-background px-2 py-0.5 rounded text-muted">
                        {MOBILITY_LABELS[trip.mobilityType as MobilityType] || trip.mobilityType}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-navy">{trip.patientName}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm text-muted">
                      <div>
                        <span className="text-xs uppercase tracking-wider">Pickup:</span>{" "}
                        {trip.pickupAddress}
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider">Dest:</span>{" "}
                        {trip.destinationAddress}
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider">Appt:</span>{" "}
                        {new Date(trip.appointmentDate).toLocaleDateString()} at {trip.appointmentTime}
                      </div>
                    </div>
                  </div>

                  {/* Quick assign */}
                  <div className="ml-4 flex gap-2 flex-shrink-0">
                    {eligibleProviders.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleAssign(trip.tripNumber, p.id)}
                        disabled={assigning === trip.tripNumber}
                        className="px-3 py-1.5 text-xs bg-navy hover:bg-navy-dark disabled:opacity-50 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                      >
                        {assigning === trip.tripNumber ? "..." : p.name}
                      </button>
                    ))}
                    {eligibleProviders.length === 0 && (
                      <span className="text-xs text-danger">No eligible providers</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
