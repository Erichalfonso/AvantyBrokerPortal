"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Trip {
  id: string;
  tripNumber: string;
  patientName: string;
  pickupAddress: string;
  destinationAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  mobilityType: string;
  medicaidId?: string;
  authorizationNumber?: string;
  driverName?: string;
  driverId?: string;
  vehicleId?: string;
  actualMileage?: number;
  memberSignatureUrl?: string;
}

export default function MedicaidTripReimbursementPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");

  const [form, setForm] = useState({
    patientName: "",
    patientDob: "",
    medicaidId: "",
    authorizationNumber: "",
    healthPlanName: "",
    healthPlanId: "",
    pickupAddress: "",
    destinationAddress: "",
    tripDate: "",
    pickupTime: "",
    dropoffTime: "",
    mobilityType: "",
    tripPurpose: "",
    returnTrip: false,
    mileage: "",
    mileageRate: "",
    baseRate: "",
    tolls: "",
    waitTime: "",
    waitTimeRate: "",
    driverName: "",
    driverId: "",
    vehicleId: "",
    vehicleType: "",
    memberSignatureUrl: "",
    driverSignatureUrl: "",
    attendantName: "",
  });

  // Fetch completed trips for auto-populate
  useEffect(() => {
    fetch("/api/trips?status=completed&limit=100", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.trips) setTrips(data.trips); })
      .catch(() => {});
  }, []);

  const handleTripSelect = (tripId: string) => {
    setSelectedTripId(tripId);
    const trip = trips.find((t) => t.id === tripId);
    if (trip) {
      setForm((prev) => ({
        ...prev,
        patientName: trip.patientName || prev.patientName,
        medicaidId: trip.medicaidId || prev.medicaidId,
        authorizationNumber: trip.authorizationNumber || prev.authorizationNumber,
        pickupAddress: trip.pickupAddress || prev.pickupAddress,
        destinationAddress: trip.destinationAddress || prev.destinationAddress,
        tripDate: trip.appointmentDate ? trip.appointmentDate.split("T")[0] : prev.tripDate,
        pickupTime: trip.appointmentTime || prev.pickupTime,
        mobilityType: trip.mobilityType || prev.mobilityType,
        driverName: trip.driverName || prev.driverName,
        driverId: trip.driverId || prev.driverId,
        vehicleId: trip.vehicleId || prev.vehicleId,
        mileage: trip.actualMileage ? String(trip.actualMileage) : prev.mileage,
        memberSignatureUrl: trip.memberSignatureUrl || prev.memberSignatureUrl,
      }));
    }
  };

  const totalAmount = (() => {
    const base = parseFloat(form.baseRate) || 0;
    const mileageCharge = (parseFloat(form.mileage) || 0) * (parseFloat(form.mileageRate) || 0);
    const tollCharge = parseFloat(form.tolls) || 0;
    const waitCharge = ((parseInt(form.waitTime) || 0) / 60) * (parseFloat(form.waitTimeRate) || 0);
    return base + mileageCharge + tollCharge + waitCharge;
  })();

  const handleSave = async (submit: boolean) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          formType: "medicaid_trip",
          tripId: selectedTripId || undefined,
          totalAmount,
          ...form,
          tripDate: form.tripDate || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create form");
      }

      const created = await res.json();

      if (submit) {
        const submitRes = await fetch(`/api/reimbursements/${created.id}/submit`, {
          method: "POST",
          credentials: "include",
        });
        if (!submitRes.ok) {
          const data = await submitRes.json();
          throw new Error(data.errors?.join(", ") || data.error || "Validation failed");
        }
      }

      router.push("/dashboard/reimbursements");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/reimbursements" className="text-sm text-teal hover:text-teal-dark">&larr; Back to Reimbursements</Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Medicaid Trip Reimbursement</h1>
        <p className="text-muted mt-1">Submit a trip reimbursement claim to Medicaid / health plan</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Auto-populate from Trip */}
      {trips.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <label className="block text-sm font-medium text-navy mb-2">Auto-fill from completed trip</label>
          <select
            value={selectedTripId}
            onChange={(e) => handleTripSelect(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
          >
            <option value="">Select a trip to auto-populate fields...</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.tripNumber} — {t.patientName} ({new Date(t.appointmentDate).toLocaleDateString()})</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-6">
        {/* Patient Information */}
        <Section title="Patient Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Patient Name *" value={form.patientName} onChange={(v) => handleChange("patientName", v)} />
            <Field label="Date of Birth" value={form.patientDob} onChange={(v) => handleChange("patientDob", v)} type="date" />
            <Field label="Medicaid ID *" value={form.medicaidId} onChange={(v) => handleChange("medicaidId", v)} />
            <Field label="Authorization Number" value={form.authorizationNumber} onChange={(v) => handleChange("authorizationNumber", v)} />
          </div>
        </Section>

        {/* Health Plan */}
        <Section title="Health Plan">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Health Plan Name" value={form.healthPlanName} onChange={(v) => handleChange("healthPlanName", v)} />
            <Field label="Health Plan ID" value={form.healthPlanId} onChange={(v) => handleChange("healthPlanId", v)} />
          </div>
        </Section>

        {/* Trip Details */}
        <Section title="Trip Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Trip Date *" value={form.tripDate} onChange={(v) => handleChange("tripDate", v)} type="date" />
            <Field label="Pickup Time" value={form.pickupTime} onChange={(v) => handleChange("pickupTime", v)} type="time" />
            <Field label="Dropoff Time" value={form.dropoffTime} onChange={(v) => handleChange("dropoffTime", v)} type="time" />
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Mobility Type</label>
              <select value={form.mobilityType} onChange={(e) => handleChange("mobilityType", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="">Select...</option>
                <option value="ambulatory">Ambulatory</option>
                <option value="wheelchair">Wheelchair</option>
                <option value="stretcher">Stretcher</option>
              </select>
            </div>
            <Field label="Pickup Address *" value={form.pickupAddress} onChange={(v) => handleChange("pickupAddress", v)} className="md:col-span-2" />
            <Field label="Destination Address *" value={form.destinationAddress} onChange={(v) => handleChange("destinationAddress", v)} className="md:col-span-2" />
            <Field label="Trip Purpose" value={form.tripPurpose} onChange={(v) => handleChange("tripPurpose", v)} placeholder="e.g., Medical appointment, Dialysis" />
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.returnTrip} onChange={(e) => handleChange("returnTrip", e.target.checked)} className="rounded border-border" />
              <label className="text-sm text-navy">Return Trip</label>
            </div>
          </div>
        </Section>

        {/* Mileage & Charges */}
        <Section title="Mileage & Charges">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Mileage" value={form.mileage} onChange={(v) => handleChange("mileage", v)} type="number" />
            <Field label="Rate per Mile ($)" value={form.mileageRate} onChange={(v) => handleChange("mileageRate", v)} type="number" />
            <Field label="Base Rate ($)" value={form.baseRate} onChange={(v) => handleChange("baseRate", v)} type="number" />
            <Field label="Tolls ($)" value={form.tolls} onChange={(v) => handleChange("tolls", v)} type="number" />
            <Field label="Wait Time (min)" value={form.waitTime} onChange={(v) => handleChange("waitTime", v)} type="number" />
            <Field label="Wait Time Rate ($/hr)" value={form.waitTimeRate} onChange={(v) => handleChange("waitTimeRate", v)} type="number" />
          </div>
          <div className="mt-4 p-4 bg-teal/5 border border-teal/20 rounded-lg">
            <span className="text-sm text-muted">Calculated Total:</span>
            <span className="text-xl font-bold text-navy ml-2">${totalAmount.toFixed(2)}</span>
          </div>
        </Section>

        {/* Driver / Vehicle */}
        <Section title="Driver & Vehicle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Driver Name" value={form.driverName} onChange={(v) => handleChange("driverName", v)} />
            <Field label="Driver ID" value={form.driverId} onChange={(v) => handleChange("driverId", v)} />
            <Field label="Vehicle ID" value={form.vehicleId} onChange={(v) => handleChange("vehicleId", v)} />
            <Field label="Vehicle Type" value={form.vehicleType} onChange={(v) => handleChange("vehicleType", v)} />
            <Field label="Attendant Name" value={form.attendantName} onChange={(v) => handleChange("attendantName", v)} />
          </div>
        </Section>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button onClick={() => handleSave(false)} disabled={saving} className="px-6 py-2.5 border border-border text-navy font-medium rounded-lg hover:bg-background transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="px-6 py-2.5 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50">
            {saving ? "Submitting..." : "Save & Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, className = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-navy mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
      />
    </div>
  );
}
