"use client";

import { useState } from "react";
import Link from "next/link";

export default function PublicMedicaidTripForm() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [submitter, setSubmitter] = useState({ name: "", email: "", phone: "" });
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
    attendantName: "",
  });

  const totalAmount = (() => {
    const base = parseFloat(form.baseRate) || 0;
    const mileageCharge = (parseFloat(form.mileage) || 0) * (parseFloat(form.mileageRate) || 0);
    const tollCharge = parseFloat(form.tolls) || 0;
    const waitCharge = ((parseInt(form.waitTime) || 0) / 60) * (parseFloat(form.waitTimeRate) || 0);
    return base + mileageCharge + tollCharge + waitCharge;
  })();

  const handleSubmit = async () => {
    if (!submitter.name || !submitter.email) {
      setError("Please enter your name and email address.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/public/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "medicaid_trip",
          submitterName: submitter.name,
          submitterEmail: submitter.email,
          submitterPhone: submitter.phone,
          totalAmount,
          ...form,
          tripDate: form.tripDate || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit form");
      }
      const data = await res.json();
      setSuccess(`Form submitted successfully! Your reference number is ${data.formNumber}. You will receive a confirmation at ${submitter.email}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">Submission Received</h2>
        <p className="text-muted mb-6">{success}</p>
        <Link href="/forms" className="px-6 py-2.5 bg-teal hover:bg-teal-dark text-white font-medium rounded-lg transition-colors inline-block">
          Submit Another Form
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/forms" className="text-sm text-teal hover:text-teal-dark">&larr; Back to Forms</Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Medicaid Trip Reimbursement</h1>
        <p className="text-muted mt-1">Submit a trip reimbursement claim to Medicaid / health plan</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="space-y-6">
        {/* Submitter Info */}
        <Section title="Your Contact Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Your Name *" value={submitter.name} onChange={(v) => setSubmitter({ ...submitter, name: v })} />
            <Field label="Your Email *" value={submitter.email} onChange={(v) => setSubmitter({ ...submitter, email: v })} type="email" />
            <Field label="Your Phone" value={submitter.phone} onChange={(v) => setSubmitter({ ...submitter, phone: v })} type="tel" />
          </div>
        </Section>

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
              <select value={form.mobilityType} onChange={(e) => handleChange("mobilityType", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
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
              <input type="checkbox" checked={form.returnTrip} onChange={(e) => handleChange("returnTrip", e.target.checked)} className="rounded border-gray-300" />
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

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button onClick={handleSubmit} disabled={saving} className="px-8 py-3 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm">
            {saving ? "Submitting..." : "Submit Reimbursement Claim"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal bg-white"
      />
    </div>
  );
}
