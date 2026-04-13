"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Trip {
  id: string;
  tripNumber: string;
  patientName: string;
  patientPhone: string;
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
  actualPickupTime?: string;
  actualDropoffTime?: string;
}

interface ServiceLine {
  dateOfServiceFrom: string;
  dateOfServiceTo: string;
  placeOfService: string;
  procedureCode: string;
  modifiers: string;
  diagnosisPointer: string;
  charges: string;
  units: string;
  renderingProviderNpi: string;
}

export default function CMS1500Page() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);

  const [form, setForm] = useState({
    // Box 1
    insuranceType: "Medicaid",
    insuredIdNumber: "",
    // Box 2-3
    patientName: "",
    patientDob: "",
    patientSex: "",
    // Box 4
    insuredName: "",
    // Box 5
    patientAddress: "",
    patientCity: "",
    patientState: "",
    patientZip: "",
    patientPhone: "",
    // Box 6
    patientRelToInsured: "Self",
    // Box 7
    insuredAddress: "",
    insuredCity: "",
    insuredState: "",
    insuredZip: "",
    // Box 10
    patientConditionRelTo: "",
    // Box 11
    insuredPolicyGroup: "",
    insuredDob: "",
    insuredSex: "",
    insuredPlanName: "",
    // Box 12-13
    patientSignatureOnFile: true,
    insuredSignatureOnFile: true,
    // Box 14
    conditionDateOfOnset: "",
    // Box 17
    referringProviderName: "",
    referringProviderNpi: "",
    // Box 21
    diagnosisCode1: "",
    diagnosisCode2: "",
    diagnosisCode3: "",
    diagnosisCode4: "",
    // Box 23
    priorAuthNumber: "",
    // Box 25
    federalTaxId: "",
    federalTaxIdType: "EIN",
    // Box 26
    patientAccountNumber: "",
    // Box 27
    acceptAssignment: true,
    // Box 29
    amountPaid: "",
    // Box 32
    facilityName: "",
    facilityAddress: "",
    facilityNpi: "",
    // Box 33
    billingProviderName: "",
    billingProviderAddress: "",
    billingProviderNpi: "",
    billingProviderTaxonomy: "",
  });

  useEffect(() => {
    fetch("/api/trips?status=completed&limit=100", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.trips) setTrips(data.trips); })
      .catch(() => {});
  }, []);

  const handleTripSelect = (tripId: string) => {
    setSelectedTripId(tripId);
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    setForm((prev) => ({
      ...prev,
      patientName: trip.patientName || prev.patientName,
      patientPhone: trip.patientPhone || prev.patientPhone,
      insuredIdNumber: trip.medicaidId || prev.insuredIdNumber,
      priorAuthNumber: trip.authorizationNumber || prev.priorAuthNumber,
    }));

    // Auto-add a service line from trip
    const tripDate = trip.appointmentDate.split("T")[0];
    const procedureMap: Record<string, string> = {
      ambulatory: "T2003",
      wheelchair: "T2003",
      stretcher: "A0426",
    };
    setServiceLines([{
      dateOfServiceFrom: tripDate,
      dateOfServiceTo: tripDate,
      placeOfService: "15",
      procedureCode: procedureMap[trip.mobilityType] || "T2003",
      modifiers: "",
      diagnosisPointer: "A",
      charges: "",
      units: "1",
      renderingProviderNpi: "",
    }]);
  };

  const addServiceLine = () => {
    if (serviceLines.length >= 6) return;
    setServiceLines((prev) => [...prev, {
      dateOfServiceFrom: "",
      dateOfServiceTo: "",
      placeOfService: "15",
      procedureCode: "",
      modifiers: "",
      diagnosisPointer: "A",
      charges: "",
      units: "1",
      renderingProviderNpi: "",
    }]);
  };

  const updateServiceLine = (idx: number, field: string, value: string) => {
    setServiceLines((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const removeServiceLine = (idx: number) => {
    setServiceLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalCharge = serviceLines.reduce((sum, l) => sum + (parseFloat(l.charges) || 0), 0);
  const balanceDue = totalCharge - (parseFloat(form.amountPaid) || 0);

  const handleSave = async (submit: boolean) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          formType: "cms_1500",
          tripId: selectedTripId || undefined,
          totalAmount: totalCharge,
          ...form,
          conditionDateOfOnset: form.conditionDateOfOnset || undefined,
          amountPaid: form.amountPaid ? parseFloat(form.amountPaid) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create form");
      }

      const created = await res.json();

      // Add service lines
      for (const line of serviceLines) {
        await fetch(`/api/reimbursements/${created.id}/service-lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...line,
            modifiers: line.modifiers ? line.modifiers.split(",").map((m: string) => m.trim()) : [],
            charges: parseFloat(line.charges) || 0,
            units: parseFloat(line.units) || 1,
          }),
        });
      }

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
        <h1 className="text-2xl font-bold text-navy mt-2">CMS-1500 / HCFA Claim Form</h1>
        <p className="text-muted mt-1">Standard healthcare claim form for NEMT reimbursement</p>
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
        {/* Box 1 - Insurance Type */}
        <Section title="Box 1 — Insurance Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Insurance Type *</label>
              <select value={form.insuranceType} onChange={(e) => handleChange("insuranceType", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option>Medicare</option>
                <option>Medicaid</option>
                <option>TRICARE</option>
                <option>CHAMPVA</option>
                <option>Group Health Plan</option>
                <option>FECA</option>
                <option>Other</option>
              </select>
            </div>
            <Field label="Insured's ID Number (Box 1a) *" value={form.insuredIdNumber} onChange={(v) => handleChange("insuredIdNumber", v)} />
          </div>
        </Section>

        {/* Box 2-5 - Patient Info */}
        <Section title="Boxes 2-5 — Patient Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Patient Name (Box 2) *" value={form.patientName} onChange={(v) => handleChange("patientName", v)} />
            <Field label="Date of Birth (Box 3)" value={form.patientDob} onChange={(v) => handleChange("patientDob", v)} type="date" />
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Sex (Box 3)</label>
              <select value={form.patientSex} onChange={(e) => handleChange("patientSex", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="">Select...</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <Field label="Address (Box 5)" value={form.patientAddress} onChange={(v) => handleChange("patientAddress", v)} />
            <Field label="City" value={form.patientCity} onChange={(v) => handleChange("patientCity", v)} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="State" value={form.patientState} onChange={(v) => handleChange("patientState", v)} />
              <Field label="ZIP" value={form.patientZip} onChange={(v) => handleChange("patientZip", v)} />
            </div>
            <Field label="Phone" value={form.patientPhone} onChange={(v) => handleChange("patientPhone", v)} />
          </div>
        </Section>

        {/* Box 4, 6-7, 11 - Insured Info */}
        <Section title="Boxes 4, 6-7, 11 — Insured Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Insured's Name (Box 4)" value={form.insuredName} onChange={(v) => handleChange("insuredName", v)} />
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Patient Relation to Insured (Box 6)</label>
              <select value={form.patientRelToInsured} onChange={(e) => handleChange("patientRelToInsured", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option>Self</option>
                <option>Spouse</option>
                <option>Child</option>
                <option>Other</option>
              </select>
            </div>
            <Field label="Insured's Address (Box 7)" value={form.insuredAddress} onChange={(v) => handleChange("insuredAddress", v)} />
            <div className="grid grid-cols-3 gap-2">
              <Field label="City" value={form.insuredCity} onChange={(v) => handleChange("insuredCity", v)} />
              <Field label="State" value={form.insuredState} onChange={(v) => handleChange("insuredState", v)} />
              <Field label="ZIP" value={form.insuredZip} onChange={(v) => handleChange("insuredZip", v)} />
            </div>
            <Field label="Policy/Group Number (Box 11)" value={form.insuredPolicyGroup} onChange={(v) => handleChange("insuredPolicyGroup", v)} />
            <Field label="Insured's Plan Name (Box 11c)" value={form.insuredPlanName} onChange={(v) => handleChange("insuredPlanName", v)} />
          </div>
        </Section>

        {/* Box 17 - Referring Provider */}
        <Section title="Box 17 — Referring Provider">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Referring Provider Name" value={form.referringProviderName} onChange={(v) => handleChange("referringProviderName", v)} />
            <Field label="Referring Provider NPI (Box 17b)" value={form.referringProviderNpi} onChange={(v) => handleChange("referringProviderNpi", v)} />
          </div>
        </Section>

        {/* Box 21 - Diagnosis */}
        <Section title="Box 21 — Diagnosis Codes (ICD-10)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="A. Diagnosis Code 1 *" value={form.diagnosisCode1} onChange={(v) => handleChange("diagnosisCode1", v)} placeholder="e.g., Z02.89" />
            <Field label="B. Diagnosis Code 2" value={form.diagnosisCode2} onChange={(v) => handleChange("diagnosisCode2", v)} />
            <Field label="C. Diagnosis Code 3" value={form.diagnosisCode3} onChange={(v) => handleChange("diagnosisCode3", v)} />
            <Field label="D. Diagnosis Code 4" value={form.diagnosisCode4} onChange={(v) => handleChange("diagnosisCode4", v)} />
          </div>
          <p className="text-xs text-muted mt-2">Common NEMT codes: Z02.89 (Encounter for other admin exam), R69 (Illness unspecified), Z76.89 (Other specified encounter)</p>
        </Section>

        {/* Box 23 - Prior Auth */}
        <Section title="Box 23 — Prior Authorization">
          <Field label="Prior Authorization Number" value={form.priorAuthNumber} onChange={(v) => handleChange("priorAuthNumber", v)} />
        </Section>

        {/* Box 24 - Service Lines */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">Box 24 — Service Lines *</h2>
            <button onClick={addServiceLine} disabled={serviceLines.length >= 6} className="px-3 py-1.5 text-sm bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors disabled:opacity-50">
              + Add Line ({serviceLines.length}/6)
            </button>
          </div>
          <p className="text-xs text-muted mb-4">Common NEMT procedure codes: T2003 (NEMT), A0426 (ALS ambulance), A0428 (BLS ambulance), A0130 (Wheelchair van), S0215 (NEMT attendant)</p>

          {serviceLines.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No service lines. Add at least one to submit.</p>
          ) : (
            <div className="space-y-3">
              {serviceLines.map((line, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg bg-background/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-navy">Line {idx + 1}</span>
                    <button onClick={() => removeServiceLine(idx)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">Date From (24A)</label>
                      <input type="date" value={line.dateOfServiceFrom} onChange={(e) => updateServiceLine(idx, "dateOfServiceFrom", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Date To (24A)</label>
                      <input type="date" value={line.dateOfServiceTo} onChange={(e) => updateServiceLine(idx, "dateOfServiceTo", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Place of Service (24B)</label>
                      <input type="text" value={line.placeOfService} onChange={(e) => updateServiceLine(idx, "placeOfService", e.target.value)} placeholder="15" className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Procedure Code (24D)</label>
                      <input type="text" value={line.procedureCode} onChange={(e) => updateServiceLine(idx, "procedureCode", e.target.value)} placeholder="T2003" className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Modifiers (24D)</label>
                      <input type="text" value={line.modifiers} onChange={(e) => updateServiceLine(idx, "modifiers", e.target.value)} placeholder="Comma-separated" className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Dx Pointer (24E)</label>
                      <input type="text" value={line.diagnosisPointer} onChange={(e) => updateServiceLine(idx, "diagnosisPointer", e.target.value)} placeholder="A" className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Charges (24F) $</label>
                      <input type="number" value={line.charges} onChange={(e) => updateServiceLine(idx, "charges", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Units (24G)</label>
                      <input type="number" value={line.units} onChange={(e) => updateServiceLine(idx, "units", e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Box 25-33 - Billing */}
        <Section title="Boxes 25-33 — Billing Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Federal Tax ID (Box 25) *" value={form.federalTaxId} onChange={(v) => handleChange("federalTaxId", v)} />
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Tax ID Type (Box 25)</label>
              <select value={form.federalTaxIdType} onChange={(e) => handleChange("federalTaxIdType", e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="SSN">SSN</option>
                <option value="EIN">EIN</option>
              </select>
            </div>
            <Field label="Patient Account Number (Box 26)" value={form.patientAccountNumber} onChange={(v) => handleChange("patientAccountNumber", v)} />
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.acceptAssignment as boolean} onChange={(e) => handleChange("acceptAssignment", e.target.checked)} className="rounded border-border" />
              <label className="text-sm text-navy">Accept Assignment (Box 27)</label>
            </div>
          </div>

          <div className="mt-4 p-4 bg-teal/5 border border-teal/20 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted">Total Charge (Box 28):</span> <span className="font-bold text-navy">${totalCharge.toFixed(2)}</span></div>
              <div>
                <span className="text-muted">Amount Paid (Box 29):</span>
                <input type="number" value={form.amountPaid} onChange={(e) => handleChange("amountPaid", e.target.value)} className="ml-2 px-2 py-1 border border-border rounded text-sm w-24" />
              </div>
              <div><span className="text-muted">Balance Due (Box 30):</span> <span className="font-bold text-navy">${balanceDue.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="text-sm font-medium text-navy mb-2">Facility (Box 32)</h3>
              <div className="space-y-2">
                <Field label="Name" value={form.facilityName} onChange={(v) => handleChange("facilityName", v)} />
                <Field label="Address" value={form.facilityAddress} onChange={(v) => handleChange("facilityAddress", v)} />
                <Field label="NPI (Box 32a)" value={form.facilityNpi} onChange={(v) => handleChange("facilityNpi", v)} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-navy mb-2">Billing Provider (Box 33) *</h3>
              <div className="space-y-2">
                <Field label="Name *" value={form.billingProviderName} onChange={(v) => handleChange("billingProviderName", v)} />
                <Field label="Address" value={form.billingProviderAddress} onChange={(v) => handleChange("billingProviderAddress", v)} />
                <Field label="NPI (Box 33a) *" value={form.billingProviderNpi} onChange={(v) => handleChange("billingProviderNpi", v)} />
                <Field label="Taxonomy (Box 33b)" value={form.billingProviderTaxonomy} onChange={(v) => handleChange("billingProviderTaxonomy", v)} />
              </div>
            </div>
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
