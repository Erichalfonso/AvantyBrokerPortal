"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Trip {
  id: string;
  tripNumber: string;
  patientName: string;
  appointmentDate: string;
  pickupAddress: string;
  destinationAddress: string;
  actualMileage?: number;
  mobilityType: string;
}

interface InvoiceLine {
  tripId?: string;
  tripNumber: string;
  serviceDate: string;
  serviceDescription: string;
  pickupAddress: string;
  destinationAddress: string;
  mileage: string;
  rate: string;
  amount: string;
}

export default function ProviderInvoicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);

  const [form, setForm] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    billingPeriodStart: "",
    billingPeriodEnd: "",
    providerTaxId: "",
    providerNpi: "",
    remitToName: "",
    remitToAddress: "",
    paymentTerms: "Net 30",
  });

  const [lines, setLines] = useState<InvoiceLine[]>([]);

  useEffect(() => {
    fetch("/api/trips?status=completed&limit=100", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.trips) setTrips(data.trips); })
      .catch(() => {});
  }, []);

  const addLineFromTrip = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;
    setLines((prev) => [...prev, {
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      serviceDate: trip.appointmentDate.split("T")[0],
      serviceDescription: `${trip.mobilityType} transport`,
      pickupAddress: trip.pickupAddress,
      destinationAddress: trip.destinationAddress,
      mileage: trip.actualMileage ? String(trip.actualMileage) : "",
      rate: "",
      amount: "",
    }]);
  };

  const addBlankLine = () => {
    setLines((prev) => [...prev, {
      tripNumber: "",
      serviceDate: "",
      serviceDescription: "",
      pickupAddress: "",
      destinationAddress: "",
      mileage: "",
      rate: "",
      amount: "",
    }]);
  };

  const updateLine = (idx: number, field: string, value: string) => {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalAmount = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

  const handleSave = async (submit: boolean) => {
    setSaving(true);
    setError("");
    try {
      // Create form
      const res = await fetch("/api/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          formType: "provider_invoice",
          totalAmount,
          ...form,
          invoiceDate: form.invoiceDate || undefined,
          billingPeriodStart: form.billingPeriodStart || undefined,
          billingPeriodEnd: form.billingPeriodEnd || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invoice");
      }

      const created = await res.json();

      // Add line items
      for (const line of lines) {
        await fetch(`/api/reimbursements/${created.id}/invoice-lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...line,
            serviceDate: line.serviceDate || new Date().toISOString(),
          }),
        });
      }

      // Update total
      await fetch(`/api/reimbursements/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ totalAmount }),
      });

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

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/reimbursements" className="text-sm text-teal hover:text-teal-dark">&larr; Back to Reimbursements</Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Provider Invoice</h1>
        <p className="text-muted mt-1">Submit a billing invoice for completed trips</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <div className="space-y-6">
        {/* Invoice Details */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Invoice Number *</label>
              <input type="text" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Invoice Date *</label>
              <input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Payment Terms</label>
              <select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>Net 60</option>
                <option>Due on Receipt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Billing Period Start</label>
              <input type="date" value={form.billingPeriodStart} onChange={(e) => setForm({ ...form, billingPeriodStart: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Billing Period End</label>
              <input type="date" value={form.billingPeriodEnd} onChange={(e) => setForm({ ...form, billingPeriodEnd: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
          </div>
        </div>

        {/* Provider Info */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Provider Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Tax ID / EIN</label>
              <input type="text" value={form.providerTaxId} onChange={(e) => setForm({ ...form, providerTaxId: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">NPI Number</label>
              <input type="text" value={form.providerNpi} onChange={(e) => setForm({ ...form, providerNpi: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Remit To Name</label>
              <input type="text" value={form.remitToName} onChange={(e) => setForm({ ...form, remitToName: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Remit To Address</label>
              <input type="text" value={form.remitToAddress} onChange={(e) => setForm({ ...form, remitToAddress: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">Line Items</h2>
            <div className="flex gap-2">
              {trips.length > 0 && (
                <select
                  onChange={(e) => { if (e.target.value) addLineFromTrip(e.target.value); e.target.value = ""; }}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white"
                >
                  <option value="">Add from trip...</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>{t.tripNumber} — {t.patientName}</option>
                  ))}
                </select>
              )}
              <button onClick={addBlankLine} className="px-3 py-1.5 text-sm bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors">
                + Add Line
              </button>
            </div>
          </div>

          {lines.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No line items yet. Add from a trip or create a blank line.</p>
          ) : (
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg bg-background/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-navy">Line {idx + 1} {line.tripNumber && `(${line.tripNumber})`}</span>
                    <button onClick={() => removeLine(idx)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">Service Date</label>
                      <input type="date" value={line.serviceDate} onChange={(e) => updateLine(idx, "serviceDate", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Description</label>
                      <input type="text" value={line.serviceDescription} onChange={(e) => updateLine(idx, "serviceDescription", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Rate ($)</label>
                      <input type="number" value={line.rate} onChange={(e) => updateLine(idx, "rate", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Amount ($)</label>
                      <input type="number" value={line.amount} onChange={(e) => updateLine(idx, "amount", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-4 bg-teal/5 border border-teal/20 rounded-lg flex justify-between items-center">
            <span className="text-sm text-muted">Invoice Total:</span>
            <span className="text-xl font-bold text-navy">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

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
