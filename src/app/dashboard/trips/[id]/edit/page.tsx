"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

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
}

export default function EditTripPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    patientName: "",
    patientPhone: "",
    pickupAddress: "",
    destinationAddress: "",
    appointmentDate: "",
    appointmentTime: "",
    mobilityType: "ambulatory",
    specialInstructions: "",
  });

  useEffect(() => {
    fetch((`/api/trips/${params.id}`), { credentials: "include" })
      .then((r) => r.json())
      .then((trip: TripData) => {
        setForm({
          patientName: trip.patientName,
          patientPhone: trip.patientPhone,
          pickupAddress: trip.pickupAddress,
          destinationAddress: trip.destinationAddress,
          appointmentDate: trip.appointmentDate.split("T")[0],
          appointmentTime: trip.appointmentTime,
          mobilityType: trip.mobilityType.toLowerCase(),
          specialInstructions: trip.specialInstructions || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (user?.role === "provider") {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-navy">Access Denied</h1>
        <p className="text-muted mt-2">Providers cannot edit trips.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch((`/api/trips/${params.id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push(`/dashboard/trips/${params.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update trip.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-muted">Loading trip...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href={`/dashboard/trips/${params.id}`} className="text-sm text-teal hover:text-teal-dark font-medium">
          &larr; Back to Trip
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Edit Trip</h1>
        <p className="text-muted mt-1">Modify trip details below</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Patient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Patient Name *</label>
              <input
                name="patientName"
                value={form.patientName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Patient Phone *</label>
              <input
                name="patientPhone"
                value={form.patientPhone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Trip Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Pickup Address *</label>
              <input name="pickupAddress" value={form.pickupAddress} onChange={handleChange} required
                className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Destination Address *</label>
              <input name="destinationAddress" value={form.destinationAddress} onChange={handleChange} required
                className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Appointment Date *</label>
                <input name="appointmentDate" type="date" value={form.appointmentDate} onChange={handleChange} required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Appointment Time *</label>
                <input name="appointmentTime" type="time" value={form.appointmentTime} onChange={handleChange} required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Mobility Type *</label>
                <select name="mobilityType" value={form.mobilityType} onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent">
                  <option value="ambulatory">Ambulatory</option>
                  <option value="wheelchair">Wheelchair</option>
                  <option value="stretcher">Stretcher</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Special Instructions</label>
              <textarea name="specialInstructions" value={form.specialInstructions} onChange={handleChange} rows={3}
                className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent resize-none" />
            </div>
          </div>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={submitting}
            className="px-6 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <Link href={`/dashboard/trips/${params.id}`}
            className="px-6 py-2 border border-border text-navy hover:bg-background rounded-lg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
