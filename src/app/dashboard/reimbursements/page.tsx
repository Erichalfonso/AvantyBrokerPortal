"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  ReimbursementFormType,
  ReimbursementFormStatus,
  REIMBURSEMENT_FORM_TYPE_LABELS,
  REIMBURSEMENT_STATUS_LABELS,
  REIMBURSEMENT_STATUS_COLORS,
} from "@/types";

interface ReimbursementForm {
  id: string;
  formNumber: string;
  formType: ReimbursementFormType;
  status: ReimbursementFormStatus;
  totalAmount: number;
  patientName?: string;
  invoiceNumber?: string;
  createdAt: string;
  submittedAt?: string;
  provider?: { id: string; name: string };
  createdBy?: { id: string; name: string };
  trip?: { id: string; tripNumber: string };
  isPublicSubmission?: boolean;
  submitterName?: string;
  submitterEmail?: string;
}

export default function ReimbursementsPage() {
  const { user } = useAuth();
  const [forms, setForms] = useState<ReimbursementForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchForms = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pagination.page), limit: "25" });
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("formType", typeFilter);

    const res = await fetch(`/api/reimbursements?${params}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setForms(data.forms);
      setPagination((prev) => ({ ...prev, totalPages: data.pagination.totalPages, total: data.pagination.total }));
    }
    setLoading(false);
  }, [pagination.page, statusFilter, typeFilter]);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  const isProvider = user?.role === "provider";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Reimbursement Forms</h1>
          <p className="text-muted mt-1">{pagination.total} form{pagination.total !== 1 ? "s" : ""} total</p>
        </div>
        <div className="flex gap-2">
          {!isProvider && (
            <>
              <Link href="/dashboard/reimbursements/medicaid-trip" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
                New Medicaid Claim
              </Link>
              <Link href="/dashboard/reimbursements/cms-1500" className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors">
                New CMS-1500
              </Link>
            </>
          )}
          {isProvider && (
            <Link href="/dashboard/reimbursements/provider-invoice" className="px-4 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-medium rounded-lg transition-colors">
              New Invoice
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-card"
        >
          <option value="">All Statuses</option>
          {Object.entries(REIMBURSEMENT_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-card"
        >
          <option value="">All Types</option>
          {Object.entries(REIMBURSEMENT_FORM_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading forms...</div>
        ) : forms.length === 0 ? (
          <div className="p-8 text-center text-muted">No reimbursement forms found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Form #</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Type</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Patient / Invoice</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Provider</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Amount</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/dashboard/reimbursements/${form.id}`} className="text-teal font-medium hover:text-teal-dark">
                        {form.formNumber}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-navy">
                      {REIMBURSEMENT_FORM_TYPE_LABELS[form.formType as ReimbursementFormType] || form.formType}
                    </td>
                    <td className="p-4 text-sm text-navy">
                      {form.patientName || form.invoiceNumber || "—"}
                      {form.isPublicSubmission && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700 rounded">Public</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-navy">{form.provider?.name || "—"}</td>
                    <td className="p-4 text-sm font-medium text-navy">
                      ${form.totalAmount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${REIMBURSEMENT_STATUS_COLORS[form.status as ReimbursementFormStatus] || "bg-gray-100 text-gray-800"}`}>
                        {REIMBURSEMENT_STATUS_LABELS[form.status as ReimbursementFormStatus] || form.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted">
                      {new Date(form.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted">Page {pagination.page} of {pagination.totalPages}</span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
