"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import { mockTrips } from "@/lib/mock-data";

interface TripData {
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
  createdById?: string;
  createdAt: string;
  updatedAt: string;
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TripContextType {
  trips: TripData[];
  loading: boolean;
  pagination: Pagination;
  fetchTrips: (params?: Record<string, string>) => Promise<void>;
  addTrip: (data: Record<string, string>) => Promise<TripData | null>;
  updateTripStatus: (tripId: string, status: string, note?: string) => Promise<boolean>;
  assignProvider: (tripId: string, providerId: string) => Promise<boolean>;
  getTrip: (tripId: string) => Promise<TripData | null>;
  useMock: boolean;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

// Convert mock trips to the API shape
function convertMockTrips(raw: typeof mockTrips, userRole?: string, userProviderId?: string): TripData[] {
  let filtered = raw;
  if (userRole === "provider" && userProviderId) {
    filtered = raw.filter((t) => t.providerId === userProviderId);
  }
  return filtered.map((t) => ({
    id: t.id,
    tripNumber: t.id,
    patientName: t.patientName,
    patientPhone: t.patientPhone,
    pickupAddress: t.pickupAddress,
    destinationAddress: t.destinationAddress,
    appointmentDate: t.appointmentDate,
    appointmentTime: t.appointmentTime,
    mobilityType: t.mobilityType,
    specialInstructions: t.specialInstructions,
    status: t.status,
    providerId: t.providerId || null,
    provider: t.providerName ? { id: t.providerId || "", name: t.providerName } : null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    statusHistory: t.statusHistory.map((s, i) => ({
      id: `sh-${i}`,
      status: s.status,
      note: s.note || null,
      changedBy: { id: s.changedBy, name: s.changedBy },
      createdAt: s.timestamp,
    })),
    notes: [],
  }));
}

export function TripProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [useMock, setUseMock] = useState(false);
  const [mockState, setMockState] = useState([...mockTrips]);

  const fetchTrips = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params || {}).toString();
      const res = await fetch((`/api/trips${query ? `?${query}` : ""}`), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips);
        if (data.pagination) setPagination(data.pagination);
        setUseMock(false);
        setLoading(false);
        return;
      }
    } catch {
      // API not available
    }
    // Fallback to mock
    setUseMock(true);
    let filtered = [...mockState];
    if (params?.status) {
      filtered = filtered.filter((t) => t.status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.patientName.toLowerCase().includes(s) ||
          t.id.toLowerCase().includes(s) ||
          t.pickupAddress.toLowerCase().includes(s)
      );
    }
    setTrips(convertMockTrips(filtered, user?.role, user?.providerId || undefined));
    setLoading(false);
  }, [user, mockState]);

  const addTrip = async (data: Record<string, string>): Promise<TripData | null> => {
    if (!useMock) {
      try {
        const res = await fetch(("/api/trips"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const trip = await res.json();
          await fetchTrips();
          return trip;
        }
        const errorBody = await res.json().catch(() => ({}));
        console.error("[trips.addTrip] API failed:", res.status, errorBody);
        throw new Error(errorBody?.error || `Failed to create trip (HTTP ${res.status})`);
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error("Network error creating trip");
      }
    }
    const nextId = `T-${1000 + mockState.length + 1}`;
    const now = new Date().toISOString();
    const newTrip = {
      id: nextId,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      pickupAddress: data.pickupAddress,
      destinationAddress: data.destinationAddress,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      mobilityType: data.mobilityType as "ambulatory" | "wheelchair" | "stretcher",
      specialInstructions: data.specialInstructions || "",
      status: "pending" as const,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id || "",
      statusHistory: [{ status: "pending" as const, timestamp: now, changedBy: user?.id || "" }],
    };
    setMockState((prev) => [newTrip, ...prev]);
    const converted = convertMockTrips([newTrip])[0];
    setTrips((prev) => [converted, ...prev]);
    return converted;
  };

  const updateTripStatus = async (tripId: string, status: string, note?: string): Promise<boolean> => {
    if (!useMock) {
      try {
        const res = await fetch((`/api/trips/${tripId}/status`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note }),
        });
        if (res.ok) { await fetchTrips(); return true; }
      } catch { /* fall through */ }
    }
    // Mock update
    setMockState((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              status: status as typeof t.status,
              updatedAt: new Date().toISOString(),
              statusHistory: [
                ...t.statusHistory,
                { status: status as typeof t.status, timestamp: new Date().toISOString(), changedBy: user?.id || "", note },
              ],
            }
          : t
      )
    );
    return true;
  };

  const assignProvider = async (tripId: string, providerId: string): Promise<boolean> => {
    if (!useMock) {
      try {
        const res = await fetch((`/api/trips/${tripId}/assign`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerId }),
        });
        if (res.ok) { await fetchTrips(); return true; }
      } catch { /* fall through */ }
    }
    // Mock assign
    const providerNames: Record<string, string> = { p1: "SafeRide Transport", p2: "CareWheels LLC", p3: "MedMove Services" };
    setMockState((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              providerId,
              providerName: providerNames[providerId] || providerId,
              status: "assigned" as const,
              updatedAt: new Date().toISOString(),
              statusHistory: [
                ...t.statusHistory,
                { status: "assigned" as const, timestamp: new Date().toISOString(), changedBy: user?.id || "", note: `Assigned to ${providerNames[providerId] || providerId}` },
              ],
            }
          : t
      )
    );
    return true;
  };

  const getTrip = async (tripId: string): Promise<TripData | null> => {
    if (!useMock) {
      try {
        const res = await fetch((`/api/trips/${tripId}`));
        if (res.ok) return res.json();
      } catch { /* fall through */ }
    }
    const found = mockState.find((t) => t.id === tripId);
    if (!found) return null;
    return convertMockTrips([found])[0];
  };

  // Auto-fetch when user changes
  useEffect(() => {
    if (user) fetchTrips();
  }, [user, fetchTrips]);

  // Re-convert mock trips when mockState changes
  useEffect(() => {
    if (useMock && user) {
      setTrips(convertMockTrips(mockState, user.role, user.providerId || undefined));
    }
  }, [mockState, useMock, user]);

  return (
    <TripContext.Provider value={{ trips, loading, pagination, fetchTrips, addTrip, updateTripStatus, assignProvider, getTrip, useMock }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrips() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrips must be used within TripProvider");
  return ctx;
}
