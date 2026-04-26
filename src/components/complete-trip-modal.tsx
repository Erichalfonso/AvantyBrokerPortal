"use client";

import { useState } from "react";

export interface CompleteTripDocumentation {
  driverName: string;
  driverId?: string;
  vehicleId?: string;
  actualMileage?: number;
}

interface CompleteTripModalProps {
  tripNumber: string;
  existingDriverName?: string | null;
  existingDriverId?: string | null;
  existingVehicleId?: string | null;
  onConfirm: (documentation: CompleteTripDocumentation) => Promise<void> | void;
  onCancel: () => void;
}

export function CompleteTripModal({
  tripNumber,
  existingDriverName,
  existingDriverId,
  existingVehicleId,
  onConfirm,
  onCancel,
}: CompleteTripModalProps) {
  const [driverName, setDriverName] = useState(existingDriverName || "");
  const [driverId, setDriverId] = useState(existingDriverId || "");
  const [vehicleId, setVehicleId] = useState(existingVehicleId || "");
  const [mileage, setMileage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setError("");
    if (!driverName.trim()) {
      setError("Driver name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({
        driverName: driverName.trim(),
        driverId: driverId.trim() || undefined,
        vehicleId: vehicleId.trim() || undefined,
        actualMileage: mileage ? parseFloat(mileage) : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete trip.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={submitting ? undefined : onCancel} />
      <div className="relative bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-navy mb-2">Complete Trip {tripNumber}</h3>
        <p className="text-sm text-muted mb-4">
          Confirm the trip documentation. Pickup and dropoff times are recorded automatically.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-navy uppercase tracking-wider mb-1">
              Driver Name *
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g. John Smith"
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-navy uppercase tracking-wider mb-1">
                Driver ID
              </label>
              <input
                type="text"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy uppercase tracking-wider mb-1">
                Vehicle ID
              </label>
              <input
                type="text"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-navy uppercase tracking-wider mb-1">
              Actual Mileage
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            />
          </div>
        </div>

        {error && <p className="text-danger text-sm mt-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm text-muted hover:text-navy font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? "Completing…" : "Complete Trip"}
          </button>
        </div>
      </div>
    </div>
  );
}
