"use client";

import { TripStatus, TRIP_STATUS_LABELS, TRIP_STATUS_COLORS } from "@/types";

export function StatusBadge({ status }: { status: TripStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TRIP_STATUS_COLORS[status]}`}>
      {TRIP_STATUS_LABELS[status]}
    </span>
  );
}
