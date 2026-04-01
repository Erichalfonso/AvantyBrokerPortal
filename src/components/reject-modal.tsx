"use client";

import { useState } from "react";

interface RejectModalProps {
  tripNumber: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectModal({ tripNumber, onConfirm, onCancel }: RejectModalProps) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-navy mb-2">Reject Trip {tripNumber}?</h3>
        <p className="text-sm text-muted mb-4">
          Please provide a reason for rejecting this trip. The broker will be notified.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (e.g., no available drivers, outside service area...)"
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent resize-none"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-muted hover:text-navy font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason || "No reason provided")}
            className="px-4 py-2 bg-danger hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Reject Trip
          </button>
        </div>
      </div>
    </div>
  );
}
