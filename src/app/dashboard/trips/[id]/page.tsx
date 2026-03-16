"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useTrips } from "@/context/trip-context";
import { StatusBadge } from "@/components/status-badge";
import { MOBILITY_LABELS, TripStatus, TRIP_STATUS_LABELS, MobilityType } from "@/types";
import { mockProviders } from "@/lib/mock-data";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

interface Provider {
  id: string;
  name: string;
  serviceAreas: string[];
  vehicleTypes: string[];
  active: boolean;
}

interface TripDetail {
  id: string;
  tripNumber: string;
  patientName: string;
  patientPhone: string;
  pickupAddress: string;
  destinationAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  mobilityType: string;
  specialInstructions: string;
  status: string;
  providerId?: string | null;
  provider?: { id: string; name: string } | null;
  createdAt: string;
  statusHistory: {
    id: string;
    status: string;
    note?: string | null;
    changedBy: { id: string; name: string };
    createdAt: string;
  }[];
  notes?: {
    id: string;
    content: string;
    author: { id: string; name: string };
    createdAt: string;
  }[];
}

export default function TripDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { updateTripStatus, assignProvider } = useTrips();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const { getTrip: getTripFromCtx } = useTrips();

  const fetchTrip = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${params.id}`);
      if (res.ok) {
        setTrip(await res.json());
        setLoading(false);
        return;
      }
    } catch { /* fall through to mock */ }
    // Fallback to mock via context
    const mockTrip = await getTripFromCtx(params.id as string);
    if (mockTrip) setTrip(mockTrip as TripDetail);
    setLoading(false);
  }, [params.id, getTripFromCtx]);

  useEffect(() => {
    fetchTrip();
    fetch("/api/providers?active=true")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setProviders)
      .catch(() => {
        setProviders(mockProviders.filter((p) => p.active));
      });
  }, [fetchTrip]);

  if (loading) {
    return <div className="text-center py-16 text-muted">Loading trip...</div>;
  }

  if (!trip) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-navy">Trip Not Found</h1>
        <Link href="/dashboard/trips" className="text-teal hover:text-teal-dark mt-4 inline-block">
          Back to Trips
        </Link>
      </div>
    );
  }

  const canEdit = user?.role !== "provider" && !["completed", "cancelled"].includes(trip.status);
  const canAssign = user?.role !== "provider" && ["pending", "rejected"].includes(trip.status);
  const canAccept = user?.role === "provider" && trip.status === "assigned";
  const canReject = user?.role === "provider" && trip.status === "assigned";
  const canUpdateStatus = user?.role === "provider" && ["accepted", "driver_en_route", "passenger_picked_up"].includes(trip.status);
  const canCancel = !["completed", "cancelled"].includes(trip.status);

  const nextStatus: Record<string, TripStatus> = {
    accepted: "driver_en_route",
    driver_en_route: "passenger_picked_up",
    passenger_picked_up: "completed",
  };

  const handleStatusChange = async (status: TripStatus, note?: string) => {
    const success = await updateTripStatus(trip.tripNumber, status, note);
    if (success) await fetchTrip();
  };

  const handleAssign = async () => {
    if (!selectedProvider) return;
    const success = await assignProvider(trip.tripNumber, selectedProvider);
    if (success) {
      setSelectedProvider("");
      await fetchTrip();
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/trips/${trip.tripNumber}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteText }),
    });
    if (res.ok) {
      setNoteText("");
      await fetchTrip();
    }
    setAddingNote(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/trips" className="text-sm text-teal hover:text-teal-dark font-medium">
          &larr; Back to Trips
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-navy">{trip.tripNumber}</h1>
            <StatusBadge status={trip.status as TripStatus} />
          </div>
          <p className="text-muted mt-1">Created {new Date(trip.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link
              href={`/dashboard/trips/${trip.tripNumber}/edit`}
              className="px-4 py-2 bg-navy hover:bg-navy-dark text-white font-medium rounded-lg transition-colors"
            >
              Edit Trip
            </Link>
          )}
          {canAccept && (
            <button
              onClick={() => handleStatusChange("accepted")}
              className="px-4 py-2 bg-success hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
            >
              Accept Trip
            </button>
          )}
          {canReject && (
            <button
              onClick={() => handleStatusChange("rejected")}
              className="px-4 py-2 bg-danger hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
              Reject
            </button>
          )}
          {canUpdateStatus && (
            <button
              onClick={() => handleStatusChange(nextStatus[trip.status])}
              className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors"
            >
              Mark as {TRIP_STATUS_LABELS[nextStatus[trip.status]]}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => handleStatusChange("cancelled", "Cancelled by user")}
              className="px-4 py-2 border border-danger text-danger hover:bg-danger hover:text-white font-medium rounded-lg transition-colors"
            >
              Cancel Trip
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trip Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Patient Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Name" value={trip.patientName} />
              <InfoRow label="Phone" value={trip.patientPhone} />
            </div>
          </div>

          {/* Trip Details */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Trip Details</h2>
            <div className="space-y-4">
              <InfoRow label="Pickup Address" value={trip.pickupAddress} />
              <InfoRow label="Destination" value={trip.destinationAddress} />
              <div className="grid grid-cols-3 gap-4">
                <InfoRow label="Date" value={new Date(trip.appointmentDate).toLocaleDateString()} />
                <InfoRow label="Time" value={trip.appointmentTime} />
                <InfoRow label="Mobility Type" value={MOBILITY_LABELS[trip.mobilityType as MobilityType] || trip.mobilityType} />
              </div>
              {trip.specialInstructions && (
                <InfoRow label="Special Instructions" value={trip.specialInstructions} />
              )}
            </div>
          </div>

          {/* Provider Assignment */}
          {canAssign && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Assign Provider</h2>
              <div className="flex gap-4">
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                >
                  <option value="">Select a provider...</option>
                  {providers
                    .filter((p) => p.vehicleTypes.some(
                      (v) => v.toLowerCase() === trip.mobilityType.toLowerCase()
                    ))
                    .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.serviceAreas.join(", ")} — {p.vehicleTypes.map((v) => MOBILITY_LABELS[v.toLowerCase() as MobilityType] || v).join(", ")}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!selectedProvider}
                  className="px-6 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Notes</h2>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-navy placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
              <button
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
                className="px-4 py-2 bg-navy hover:bg-navy-dark disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {addingNote ? "..." : "Add"}
              </button>
            </div>
            <div className="space-y-3">
              {trip.notes && trip.notes.length > 0 ? (
                trip.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-background rounded-lg">
                    <p className="text-sm text-navy">{note.content}</p>
                    <p className="text-xs text-muted mt-1">
                      {note.author.name} — {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No notes yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Info */}
          {trip.provider && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Assigned Provider</h2>
              <p className="text-navy font-medium">{trip.provider.name}</p>
            </div>
          )}

          {/* Status History */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Status History</h2>
            <div className="space-y-4">
              {trip.statusHistory.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 bg-teal rounded-full mt-1.5" />
                    {i < trip.statusHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-navy">
                      {TRIP_STATUS_LABELS[entry.status as TripStatus] || entry.status}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-muted mt-0.5">{entry.note}</p>
                    )}
                    <p className="text-xs text-muted mt-0.5">
                      {entry.changedBy.name} — {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
      <p className="text-sm text-navy mt-0.5">{value}</p>
    </div>
  );
}
