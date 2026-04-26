"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  REIMBURSEMENT_FORM_TYPE_LABELS,
  REIMBURSEMENT_STATUS_LABELS,
  REIMBURSEMENT_STATUS_COLORS,
  ReimbursementFormType,
  ReimbursementFormStatus,
} from "@/types";

interface Form {
  id: string;
  formNumber: string;
  formType: ReimbursementFormType;
  status: ReimbursementFormStatus;
  totalAmount: number;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  paidAt?: string;
  reviewNotes?: string;
  createdBy?: { id: string; name: string };
  reviewedBy?: { id: string; name: string };
  provider?: { id: string; name: string; code: string };
  trip?: { id: string; tripNumber: string };
  // Medicaid
  patientName?: string;
  patientDob?: string;
  medicaidId?: string;
  authorizationNumber?: string;
  healthPlanName?: string;
  healthPlanId?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  tripDate?: string;
  pickupTime?: string;
  dropoffTime?: string;
  mobilityType?: string;
  mileage?: number;
  mileageRate?: number;
  baseRate?: number;
  tolls?: number;
  waitTime?: number;
  waitTimeRate?: number;
  driverName?: string;
  driverId?: string;
  vehicleId?: string;
  vehicleType?: string;
  tripPurpose?: string;
  returnTrip?: boolean;
  attendantName?: string;
  // Invoice
  invoiceNumber?: string;
  invoiceDate?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  providerTaxId?: string;
  providerNpi?: string;
  remitToName?: string;
  remitToAddress?: string;
  paymentTerms?: string;
  // CMS
  insuranceType?: string;
  insuredIdNumber?: string;
  billingProviderName?: string;
  billingProviderNpi?: string;
  diagnosisCode1?: string;
  diagnosisCode2?: string;
  diagnosisCode3?: string;
  diagnosisCode4?: string;
  // Lines
  serviceLines?: { id: string; lineNumber: number; procedureCode: string; charges: number; dateOfServiceFrom: string; placeOfService: string; units: number }[];
  invoiceLines?: { id: string; lineNumber: number; tripNumber?: string; serviceDate: string; serviceDescription: string; amount: number }[];
  [key: string]: unknown;
}

export default function ReimbursementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const fetchForm = useCallback(async () => {
    const res = await fetch(`/api/reimbursements/${params.id}`, { credentials: "include" });
    if (res.ok) setForm(await res.json());
    setLoading(false);
  }, [params.id]);

  useEffect(() => { fetchForm(); }, [fetchForm]);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "denied" && !reviewNotes) {
      alert("Please enter review notes when denying a form.");
      return;
    }
    setActionLoading(true);
    const res = await fetch(`/api/reimbursements/${form!.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: newStatus, reviewNotes: reviewNotes || undefined }),
    });
    if (res.ok) {
      await fetchForm();
      setReviewNotes("");
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this draft form?")) return;
    const res = await fetch(`/api/reimbursements/${form!.id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) router.push("/dashboard/reimbursements");
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading...</div>;
  if (!form) return <div className="p-8 text-center text-muted">Form not found.</div>;

  const isBrokerAdmin = user?.role === "broker" || user?.role === "admin";
  const isCreator = user?.id === form.createdBy?.id;
  const status = form.status as ReimbursementFormStatus;

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/reimbursements" className="text-sm text-teal hover:text-teal-dark">&larr; Back to Reimbursements</Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-navy">{form.formNumber}</h1>
            <p className="text-muted">{REIMBURSEMENT_FORM_TYPE_LABELS[form.formType] || form.formType}</p>
          </div>
          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${REIMBURSEMENT_STATUS_COLORS[status] || ""}`}>
            {REIMBURSEMENT_STATUS_LABELS[status] || form.status}
          </span>
        </div>
      </div>

      {/* Status Actions */}
      {(isBrokerAdmin || (isCreator && status === "submitted")) && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {status === "draft" && isCreator && (
              <>
                <button onClick={() => handleStatusChange("submitted")} disabled={actionLoading} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">Submit</button>
                <button onClick={handleDelete} className="px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg border border-red-200">Delete Draft</button>
              </>
            )}
            {status === "submitted" && isCreator && (
              <button
                onClick={() => {
                  if (!confirm("Recall this form to draft? You'll be able to edit and resubmit it.")) return;
                  handleStatusChange("draft");
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Recall to Draft
              </button>
            )}
            {isBrokerAdmin && (status === "submitted" || status === "under_review") && (
              <>
                {status === "submitted" && (
                  <button onClick={() => handleStatusChange("under_review")} disabled={actionLoading} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">Mark Under Review</button>
                )}
                <button onClick={() => handleStatusChange("approved")} disabled={actionLoading} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">Approve</button>
                <button onClick={() => handleStatusChange("denied")} disabled={actionLoading} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">Deny</button>
              </>
            )}
            {isBrokerAdmin && status === "approved" && (
              <button onClick={() => handleStatusChange("paid")} disabled={actionLoading} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-medium rounded-lg disabled:opacity-50">Mark as Paid</button>
            )}
            {isBrokerAdmin && status !== "void" && status !== "paid" && (
              <button onClick={() => handleStatusChange("void")} disabled={actionLoading} className="px-4 py-2 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg border border-gray-200">Void</button>
            )}
          </div>
          {isBrokerAdmin && (status === "submitted" || status === "under_review") && (
            <div className="mt-3">
              <input
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Review notes (required for denial)"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      )}

      {/* Review Notes */}
      {form.reviewNotes && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-navy">Review Notes</p>
          <p className="text-sm text-muted mt-1">{form.reviewNotes}</p>
          {form.reviewedBy && <p className="text-xs text-muted mt-2">Reviewed by {form.reviewedBy.name} on {new Date(form.reviewedAt!).toLocaleDateString()}</p>}
        </div>
      )}

      {/* Form Details */}
      <div className="space-y-6">
        {/* Meta Info */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Form Details</h2>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DT label="Created By">{form.createdBy?.name || "—"}</DT>
            <DT label="Created">{new Date(form.createdAt).toLocaleDateString()}</DT>
            <DT label="Total Amount">${form.totalAmount?.toFixed(2) || "0.00"}</DT>
            <DT label="Linked Trip">{form.trip?.tripNumber || "—"}</DT>
            <DT label="Provider">{form.provider?.name || "—"}</DT>
            {form.submittedAt && <DT label="Submitted">{new Date(form.submittedAt).toLocaleDateString()}</DT>}
            {form.paidAt && <DT label="Paid">{new Date(form.paidAt).toLocaleDateString()}</DT>}
          </dl>
        </div>

        {/* Medicaid-specific */}
        {form.formType === "medicaid_trip" && (
          <>
            <DetailSection title="Patient Information" items={[
              ["Patient Name", form.patientName],
              ["Date of Birth", form.patientDob ? new Date(form.patientDob).toLocaleDateString() : undefined],
              ["Medicaid ID", form.medicaidId],
              ["Authorization #", form.authorizationNumber],
              ["Health Plan", form.healthPlanName],
              ["Health Plan ID", form.healthPlanId],
            ]} />
            <DetailSection title="Trip Details" items={[
              ["Trip Date", form.tripDate ? new Date(form.tripDate).toLocaleDateString() : undefined],
              ["Pickup Time", form.pickupTime],
              ["Dropoff Time", form.dropoffTime],
              ["Mobility Type", form.mobilityType],
              ["Pickup Address", form.pickupAddress],
              ["Destination", form.destinationAddress],
              ["Trip Purpose", form.tripPurpose],
              ["Return Trip", form.returnTrip ? "Yes" : "No"],
            ]} />
            <DetailSection title="Charges" items={[
              ["Mileage", form.mileage?.toString()],
              ["Rate/Mile", form.mileageRate ? `$${form.mileageRate}` : undefined],
              ["Base Rate", form.baseRate ? `$${form.baseRate}` : undefined],
              ["Tolls", form.tolls ? `$${form.tolls}` : undefined],
              ["Wait Time", form.waitTime ? `${form.waitTime} min` : undefined],
              ["Wait Rate", form.waitTimeRate ? `$${form.waitTimeRate}/hr` : undefined],
            ]} />
            <DetailSection title="Driver & Vehicle" items={[
              ["Driver Name", form.driverName],
              ["Driver ID", form.driverId],
              ["Vehicle ID", form.vehicleId],
              ["Vehicle Type", form.vehicleType],
              ["Attendant", form.attendantName],
            ]} />
          </>
        )}

        {/* Provider Invoice */}
        {form.formType === "provider_invoice" && (
          <>
            <DetailSection title="Invoice Information" items={[
              ["Invoice Number", form.invoiceNumber],
              ["Invoice Date", form.invoiceDate ? new Date(form.invoiceDate).toLocaleDateString() : undefined],
              ["Billing Period", form.billingPeriodStart && form.billingPeriodEnd ? `${new Date(form.billingPeriodStart).toLocaleDateString()} — ${new Date(form.billingPeriodEnd).toLocaleDateString()}` : undefined],
              ["Payment Terms", form.paymentTerms],
              ["Tax ID", form.providerTaxId],
              ["NPI", form.providerNpi],
              ["Remit To", form.remitToName],
              ["Remit Address", form.remitToAddress],
            ]} />
            {form.invoiceLines && form.invoiceLines.length > 0 && (
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Line Items</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-xs text-muted uppercase">#</th>
                      <th className="text-left p-2 text-xs text-muted uppercase">Trip</th>
                      <th className="text-left p-2 text-xs text-muted uppercase">Date</th>
                      <th className="text-left p-2 text-xs text-muted uppercase">Description</th>
                      <th className="text-right p-2 text-xs text-muted uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.invoiceLines.map((line) => (
                      <tr key={line.id} className="border-b border-border last:border-0">
                        <td className="p-2">{line.lineNumber}</td>
                        <td className="p-2">{line.tripNumber || "—"}</td>
                        <td className="p-2">{new Date(line.serviceDate).toLocaleDateString()}</td>
                        <td className="p-2">{line.serviceDescription}</td>
                        <td className="p-2 text-right font-medium">${line.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* CMS-1500 */}
        {form.formType === "cms_1500" && (
          <>
            <DetailSection title="Insurance & Patient" items={[
              ["Insurance Type", form.insuranceType],
              ["Insured ID", form.insuredIdNumber],
              ["Patient Name", form.patientName],
              ["Billing Provider", form.billingProviderName],
              ["Billing NPI", form.billingProviderNpi],
              ["Diagnosis Code 1", form.diagnosisCode1],
              ["Diagnosis Code 2", form.diagnosisCode2],
              ["Diagnosis Code 3", form.diagnosisCode3],
              ["Diagnosis Code 4", form.diagnosisCode4],
            ]} />
            {form.serviceLines && form.serviceLines.length > 0 && (
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">Service Lines (Box 24)</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-xs text-muted uppercase">#</th>
                      <th className="text-left p-2 text-xs text-muted uppercase">Date</th>
                      <th className="text-left p-2 text-xs text-muted uppercase">Place</th>
                      <th className="text-left p-2 text-xs text-muted uppercase">Procedure</th>
                      <th className="text-right p-2 text-xs text-muted uppercase">Units</th>
                      <th className="text-right p-2 text-xs text-muted uppercase">Charges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.serviceLines.map((line) => (
                      <tr key={line.id} className="border-b border-border last:border-0">
                        <td className="p-2">{line.lineNumber}</td>
                        <td className="p-2">{new Date(line.dateOfServiceFrom).toLocaleDateString()}</td>
                        <td className="p-2">{line.placeOfService}</td>
                        <td className="p-2">{line.procedureCode}</td>
                        <td className="p-2 text-right">{line.units}</td>
                        <td className="p-2 text-right font-medium">${line.charges.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DT({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-medium text-navy mt-0.5">{children}</dd>
    </div>
  );
}

function DetailSection({ title, items }: { title: string; items: [string, string | undefined | null][] }) {
  const filtered = items.filter(([, v]) => v);
  if (filtered.length === 0) return null;
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">{title}</h2>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(([label, value]) => (
          <DT key={label} label={label}>{value}</DT>
        ))}
      </dl>
    </div>
  );
}
