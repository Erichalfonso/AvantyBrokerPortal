"use client";

import { useState } from "react";
import Link from "next/link";

interface InvoiceLine {
  tripNumber: string;
  serviceDate: string;
  serviceDescription: string;
  pickupAddress: string;
  destinationAddress: string;
  mileage: string;
  rate: string;
  amount: string;
}

export default function PublicProviderInvoiceForm() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [submitter, setSubmitter] = useState({ name: "", email: "", phone: "" });
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

  const handleSubmit = async () => {
    if (!submitter.name || !submitter.email) {
      setError("Please enter your name and email address.");
      return;
    }
    if (!form.invoiceNumber) {
      setError("Invoice number is required.");
      return;
    }
    if (lines.length === 0) {
      setError("Please add at least one line item.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/public/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "provider_invoice",
          submitterName: submitter.name,
          submitterEmail: submitter.email,
          submitterPhone: submitter.phone,
          totalAmount,
          ...form,
          invoiceDate: form.invoiceDate || undefined,
          billingPeriodStart: form.billingPeriodStart || undefined,
          billingPeriodEnd: form.billingPeriodEnd || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit form");
      }

      const created = await res.json();

      // Add line items
      for (const line of lines) {
        await fetch(`/api/public/reimbursements/${created.id}/invoice-lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...line,
            serviceDate: line.serviceDate || new Date().toISOString(),
          }),
        });
      }

      setSuccess(`Invoice submitted successfully! Your reference number is ${created.formNumber}. You will receive a confirmation at ${submitter.email}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">Invoice Submitted</h2>
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
        <h1 className="text-2xl font-bold text-navy mt-2">Provider Invoice</h1>
        <p className="text-muted mt-1">Submit a billing invoice for completed transportation trips</p>
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

        {/* Invoice Details */}
        <Section title="Invoice Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Invoice Number *" value={form.invoiceNumber} onChange={(v) => setForm({ ...form, invoiceNumber: v })} />
            <Field label="Invoice Date *" value={form.invoiceDate} onChange={(v) => setForm({ ...form, invoiceDate: v })} type="date" />
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Payment Terms</label>
              <select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>Net 60</option>
                <option>Due on Receipt</option>
              </select>
            </div>
            <Field label="Billing Period Start" value={form.billingPeriodStart} onChange={(v) => setForm({ ...form, billingPeriodStart: v })} type="date" />
            <Field label="Billing Period End" value={form.billingPeriodEnd} onChange={(v) => setForm({ ...form, billingPeriodEnd: v })} type="date" />
          </div>
        </Section>

        {/* Provider Info */}
        <Section title="Provider Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tax ID / EIN" value={form.providerTaxId} onChange={(v) => setForm({ ...form, providerTaxId: v })} />
            <Field label="NPI Number" value={form.providerNpi} onChange={(v) => setForm({ ...form, providerNpi: v })} />
            <Field label="Remit To Name" value={form.remitToName} onChange={(v) => setForm({ ...form, remitToName: v })} />
            <Field label="Remit To Address" value={form.remitToAddress} onChange={(v) => setForm({ ...form, remitToAddress: v })} />
          </div>
        </Section>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">Line Items *</h2>
            <button onClick={addBlankLine} className="px-3 py-1.5 text-sm bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors">
              + Add Line
            </button>
          </div>

          {lines.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No line items yet. Click &quot;+ Add Line&quot; to add one.</p>
          ) : (
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-navy">Line {idx + 1}</span>
                    <button onClick={() => removeLine(idx)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">Trip Number</label>
                      <input type="text" value={line.tripNumber} onChange={(e) => updateLine(idx, "tripNumber", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Service Date</label>
                      <input type="date" value={line.serviceDate} onChange={(e) => updateLine(idx, "serviceDate", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Description</label>
                      <input type="text" value={line.serviceDescription} onChange={(e) => updateLine(idx, "serviceDescription", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Amount ($)</label>
                      <input type="number" value={line.amount} onChange={(e) => updateLine(idx, "amount", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
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

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button onClick={handleSubmit} disabled={saving} className="px-8 py-3 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm">
            {saving ? "Submitting..." : "Submit Invoice"}
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
