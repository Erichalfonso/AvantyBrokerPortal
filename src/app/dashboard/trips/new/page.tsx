"use client";

import { useState } from "react";
import { useTrips } from "@/context/trip-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTripPage() {
  const { addTrip } = useTrips();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const trip = await addTrip(form);
    if (trip) {
      router.push(`/dashboard/trips/${trip.tripNumber}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard/trips" className="text-sm text-teal hover:text-teal-dark font-medium">
          &larr; Back to Trips
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Create New Trip</h1>
        <p className="text-muted mt-1">Enter trip details below</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
        {/* Patient Info */}
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
                placeholder="(555) 123-4567"
                className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div>
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Trip Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Pickup Address *</label>
              <input
                name="pickupAddress"
                value={form.pickupAddress}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Destination Address *</label>
              <input
                name="destinationAddress"
                value={form.destinationAddress}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Appointment Date *</label>
                <input
                  name="appointmentDate"
                  type="date"
                  value={form.appointmentDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Appointment Time *</label>
                <input
                  name="appointmentTime"
                  type="time"
                  value={form.appointmentTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Mobility Type *</label>
                <select
                  name="mobilityType"
                  value={form.mobilityType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                >
                  <option value="ambulatory">Ambulatory</option>
                  <option value="wheelchair">Wheelchair</option>
                  <option value="stretcher">Stretcher</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Special Instructions</label>
              <textarea
                name="specialInstructions"
                value={form.specialInstructions}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {submitting ? "Creating..." : "Create Trip"}
          </button>
          <Link
            href="/dashboard/trips"
            className="px-6 py-2 border border-border text-navy hover:bg-background rounded-lg transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
