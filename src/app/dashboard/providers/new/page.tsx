"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProviderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    serviceAreas: "",
    vehicleTypes: [] as string[],
  });

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-navy">Access Denied</h1>
        <p className="text-muted mt-2">Only admins can create providers.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVehicleToggle = (type: string) => {
    setForm((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter((t) => t !== type)
        : [...prev.vehicleTypes, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: form.name,
        contactName: form.contactName,
        phone: form.phone,
        email: form.email,
        serviceAreas: form.serviceAreas.split(",").map((s) => s.trim()).filter(Boolean),
        vehicleTypes: form.vehicleTypes,
      }),
    });

    if (res.ok) {
      router.push("/dashboard/providers");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create provider.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard/providers" className="text-sm text-teal hover:text-teal-dark font-medium">
          &larr; Back to Providers
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Add New Provider</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Company Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Contact Name *</label>
            <input name="contactName" value={form.contactName} onChange={handleChange} required
              className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Phone *</label>
            <input name="phone" value={form.phone} onChange={handleChange} required placeholder="(555) 123-4567"
              className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required
              className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">Service Areas *</label>
          <input name="serviceAreas" value={form.serviceAreas} onChange={handleChange} required
            placeholder="Miami-Dade, Broward, Palm Beach"
            className="w-full px-4 py-2 rounded-lg border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent" />
          <p className="text-xs text-muted mt-1">Comma-separated list of service areas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-2">Vehicle Types *</label>
          <div className="flex gap-4">
            {[
              { value: "AMBULATORY", label: "Ambulatory" },
              { value: "WHEELCHAIR", label: "Wheelchair" },
              { value: "STRETCHER", label: "Stretcher" },
            ].map((type) => (
              <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.vehicleTypes.includes(type.value)}
                  onChange={() => handleVehicleToggle(type.value)}
                  className="rounded border-border text-teal focus:ring-teal"
                />
                <span className="text-sm text-navy">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={submitting || form.vehicleTypes.length === 0}
            className="px-6 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
            {submitting ? "Creating..." : "Create Provider"}
          </button>
          <Link href="/dashboard/providers"
            className="px-6 py-2 border border-border text-navy hover:bg-background rounded-lg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
