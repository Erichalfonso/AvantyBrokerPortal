"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useTrips } from "@/context/trip-context";
import { mockProviders } from "@/lib/mock-data";
import { MOBILITY_LABELS, MobilityType } from "@/types";
import Link from "next/link";

interface Provider {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  serviceAreas: string[];
  vehicleTypes: string[];
  active: boolean;
}

export default function ProvidersPage() {
  const { user } = useAuth();
  const { trips } = useTrips();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = useCallback(() => {
    fetch("/api/providers", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setProviders(data);
        setLoading(false);
      })
      .catch(() => {
        setProviders(mockProviders);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const toggleActive = async (providerId: string, currentActive: boolean) => {
    const res = await fetch(`/api/providers/${providerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: !currentActive }),
    });
    if (res.ok) fetchProviders();
  };

  if (loading) {
    return <div className="text-center py-16 text-muted">Loading providers...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Transportation Providers</h1>
          <p className="text-muted mt-1">{providers.length} providers registered</p>
        </div>
        {user?.role === "admin" && (
          <Link
            href="/dashboard/providers/new"
            className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors"
          >
            + Add Provider
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {providers.map((provider) => {
          const providerTrips = trips.filter((t) => t.providerId === provider.id);
          const activeTrips = providerTrips.filter((t) =>
            ["assigned", "accepted", "driver_en_route", "passenger_picked_up"].includes(t.status)
          );
          const completedTrips = providerTrips.filter((t) => t.status === "completed");

          return (
            <div key={provider.id} className="bg-card rounded-xl border border-border shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-navy">{provider.name}</h2>
                  <p className="text-sm text-muted">{provider.contactName}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    provider.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {provider.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Phone</span>
                  <span className="text-navy">{provider.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Email</span>
                  <span className="text-navy">{provider.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Service Areas</span>
                  <span className="text-navy">{provider.serviceAreas.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Vehicle Types</span>
                  <span className="text-navy">
                    {provider.vehicleTypes.map((v) => MOBILITY_LABELS[v.toLowerCase() as MobilityType] || v).join(", ")}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal">{activeTrips.length}</p>
                  <p className="text-xs text-muted">Active Trips</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-navy">{completedTrips.length}</p>
                  <p className="text-xs text-muted">Completed</p>
                </div>
              </div>

              {user?.role === "admin" && (
                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => toggleActive(provider.id, provider.active)}
                    className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                      provider.active
                        ? "border border-danger text-danger hover:bg-danger hover:text-white"
                        : "border border-success text-success hover:bg-success hover:text-white"
                    }`}
                  >
                    {provider.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
