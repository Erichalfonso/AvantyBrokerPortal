"use client";

import { useState } from "react";
import Link from "next/link";

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

export default function PublicCMS1500Form() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);

  const [submitter, setSubmitter] = useState({ name: "", email: "", phone: "" });
  const [form, setForm] = useState({
    insuranceType: "Medicaid",
    insuredIdNumber: "",
    patientName: "",
    patientDob: "",
    patientSex: "",
    insuredName: "",
    patientAddress: "",
    patientCity: "",
    patientState: "",
    patientZip: "",
    patientPhone: "",
    patientRelToInsured: "Self",
    insuredAddress: "",
    insuredCity: "",
    insuredState: "",
    insuredZip: "",
    patientConditionRelTo: "",
    insuredPolicyGroup: "",
    insuredDob: "",
    insuredSex: "",
    insuredPlanName: "",
    patientSignatureOnFile: true,
    insuredSignatureOnFile: true,
    conditionDateOfOnset: "",
    referringProviderName: "",
    referringProviderNpi: "",
    diagnosisCode1: "",
    diagnosisCode2: "",
    diagnosisCode3: "",
    diagnosisCode4: "",
    priorAuthNumber: "",
    federalTaxId: "",
    federalTaxIdType: "EIN",
    patientAccountNumber: "",
    acceptAssignment: true,
    amountPaid: "",
    facilityName: "",
    facilityAddress: "",
    facilityNpi: "",
    billingProviderName: "",
    billingProviderAddress: "",
    billingProviderNpi: "",
    billingProviderTaxonomy: "",
  });

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

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
          formType: "cms_1500",
          submitterName: submitter.name,
          submitterEmail: submitter.email,
          submitterPhone: submitter.phone,
          totalAmount: totalCharge,
          ...form,
          conditionDateOfOnset: form.conditionDateOfOnset || undefined,
          amountPaid: form.amountPaid ? parseFloat(form.amountPaid) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit form");
      }

      const created = await res.json();

      // Add service lines
      for (const line of serviceLines) {
        await fetch(`/api/public/reimbursements/${created.id}/service-lines`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...line,
            modifiers: line.modifiers ? line.modifiers.split(",").map((m: string) => m.trim()) : [],
            charges: parseFloat(line.charges) || 0,
            units: parseFloat(line.units) || 1,
          }),
        });
      }

      setSuccess(`CMS-1500 claim submitted successfully! Your reference number is ${created.formNumber}. You will receive a confirmation at ${submitter.email}.`);
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
        <h2 className="text-2xl font-bold text-navy mb-2">Claim Submitted</h2>
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
        <h1 className="text-2xl font-bold text-navy mt-2">CMS-1500 / HCFA Claim Form</h1>
        <p className="text-muted mt-1">Standard healthcare claim form for NEMT reimbursement</p>
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

        {/* Box 1 */}
        <Section title="Box 1 — Insurance Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Insurance Type *</label>
              <select value={form.insuranceType} onChange={(e) => handleChange("insuranceType", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
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

        {/* Box 2-5 */}
        <Section title="Boxes 2-5 — Patient Information">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Patient Name (Box 2) *" value={form.patientName} onChange={(v) => handleChange("patientName", v)} />
            <Field label="Date of Birth (Box 3)" value={form.patientDob} onChange={(v) => handleChange("patientDob", v)} type="date" />
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Sex (Box 3)</label>
              <select value={form.patientSex} onChange={(e) => handleChange("patientSex", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
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

        {/* Box 4, 6-7, 11 */}
        <Section title="Boxes 4, 6-7, 11 — Insured Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Insured's Name (Box 4)" value={form.insuredName} onChange={(v) => handleChange("insuredName", v)} />
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Patient Relation to Insured (Box 6)</label>
              <select value={form.patientRelToInsured} onChange={(e) => handleChange("patientRelToInsured", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
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

        {/* Box 21 */}
        <Section title="Box 21 — Diagnosis Codes (ICD-10)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="A. Diagnosis Code 1 *" value={form.diagnosisCode1} onChange={(v) => handleChange("diagnosisCode1", v)} placeholder="e.g., Z02.89" />
            <Field label="B. Diagnosis Code 2" value={form.diagnosisCode2} onChange={(v) => handleChange("diagnosisCode2", v)} />
            <Field label="C. Diagnosis Code 3" value={form.diagnosisCode3} onChange={(v) => handleChange("diagnosisCode3", v)} />
            <Field label="D. Diagnosis Code 4" value={form.diagnosisCode4} onChange={(v) => handleChange("diagnosisCode4", v)} />
          </div>
          <p className="text-xs text-muted mt-2">Common NEMT codes: Z02.89 (Encounter for other admin exam), R69 (Illness unspecified), Z76.89 (Other specified encounter)</p>
        </Section>

        {/* Box 23 */}
        <Section title="Box 23 — Prior Authorization">
          <Field label="Prior Authorization Number" value={form.priorAuthNumber} onChange={(v) => handleChange("priorAuthNumber", v)} />
        </Section>

        {/* Box 24 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider">Box 24 — Service Lines *</h2>
            <button onClick={addServiceLine} disabled={serviceLines.length >= 6} className="px-3 py-1.5 text-sm bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors disabled:opacity-50">
              + Add Line ({serviceLines.length}/6)
            </button>
          </div>
          <p className="text-xs text-muted mb-4">Common NEMT procedure codes: T2003 (NEMT), A0426 (ALS ambulance), A0428 (BLS ambulance), A0130 (Wheelchair van)</p>

          {serviceLines.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No service lines. Add at least one to submit.</p>
          ) : (
            <div className="space-y-3">
              {serviceLines.map((line, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-navy">Line {idx + 1}</span>
                    <button onClick={() => removeServiceLine(idx)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">Date From (24A)</label>
                      <input type="date" value={line.dateOfServiceFrom} onChange={(e) => updateServiceLine(idx, "dateOfServiceFrom", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Date To (24A)</label>
                      <input type="date" value={line.dateOfServiceTo} onChange={(e) => updateServiceLine(idx, "dateOfServiceTo", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Place of Service (24B)</label>
                      <input type="text" value={line.placeOfService} onChange={(e) => updateServiceLine(idx, "placeOfService", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Procedure Code (24D)</label>
                      <input type="text" value={line.procedureCode} onChange={(e) => updateServiceLine(idx, "procedureCode", e.target.value)} placeholder="T2003" className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Modifiers (24D)</label>
                      <input type="text" value={line.modifiers} onChange={(e) => updateServiceLine(idx, "modifiers", e.target.value)} placeholder="Comma-separated" className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Dx Pointer (24E)</label>
                      <input type="text" value={line.diagnosisPointer} onChange={(e) => updateServiceLine(idx, "diagnosisPointer", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Charges (24F) $</label>
                      <input type="number" value={line.charges} onChange={(e) => updateServiceLine(idx, "charges", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Units (24G)</label>
                      <input type="number" value={line.units} onChange={(e) => updateServiceLine(idx, "units", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Box 25-33 */}
        <Section title="Boxes 25-33 — Billing Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Federal Tax ID (Box 25)" value={form.federalTaxId} onChange={(v) => handleChange("federalTaxId", v)} />
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Tax ID Type</label>
              <select value={form.federalTaxIdType} onChange={(e) => handleChange("federalTaxIdType", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="SSN">SSN</option>
                <option value="EIN">EIN</option>
              </select>
            </div>
            <Field label="Patient Account Number (Box 26)" value={form.patientAccountNumber} onChange={(v) => handleChange("patientAccountNumber", v)} />
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.acceptAssignment as boolean} onChange={(e) => handleChange("acceptAssignment", e.target.checked)} className="rounded border-gray-300" />
              <label className="text-sm text-navy">Accept Assignment (Box 27)</label>
            </div>
          </div>

          <div className="mt-4 p-4 bg-teal/5 border border-teal/20 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted">Total Charge (Box 28):</span> <span className="font-bold text-navy">${totalCharge.toFixed(2)}</span></div>
              <div>
                <span className="text-muted">Amount Paid (Box 29):</span>
                <input type="number" value={form.amountPaid} onChange={(e) => handleChange("amountPaid", e.target.value)} className="ml-2 px-2 py-1 border border-gray-200 rounded text-sm w-24 bg-white" />
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

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button onClick={handleSubmit} disabled={saving} className="px-8 py-3 bg-teal hover:bg-teal-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm">
            {saving ? "Submitting..." : "Submit CMS-1500 Claim"}
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
