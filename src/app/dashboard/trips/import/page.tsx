"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

interface ImportResult {
  total: number;
  created: number;
  errors: string[];
}

export default function ImportTripsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  if (user?.role === "provider") {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-navy">Access Denied</h1>
        <p className="text-muted mt-2">Providers cannot import trips.</p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/trips/import", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const data = await res.json();
        setError(data.error || "Import failed");
      }
    } catch {
      setError("Failed to upload file");
    }

    setUploading(false);
  };

  const downloadTemplate = () => {
    const headers = [
      "Patient Name",
      "Patient Phone",
      "Pickup Address",
      "Destination Address",
      "Appointment Date",
      "Appointment Time",
      "Mobility Type",
      "Special Instructions",
    ];
    const sampleRow = [
      "John Doe",
      "(555) 123-4567",
      "123 Main St, Miami, FL 33130",
      "Jackson Memorial Hospital, Miami, FL 33136",
      "2026-04-01",
      "09:00",
      "ambulatory",
      "Patient needs wheelchair at destination",
    ];

    const csv = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trip_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard/trips" className="text-sm text-teal hover:text-teal-dark font-medium">
          &larr; Back to Trips
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Import Trips</h1>
        <p className="text-muted mt-1">Upload an Excel (.xlsx) or CSV file to create trips in bulk</p>
      </div>

      {/* Template Download */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">Step 1: Download Template</h2>
        <p className="text-sm text-muted mb-4">
          Download the template file, fill in your trip data, and upload it below.
        </p>
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 border border-teal text-teal hover:bg-teal hover:text-white font-medium text-sm rounded-lg transition-colors"
        >
          Download CSV Template
        </button>
      </div>

      {/* File Upload */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">Step 2: Upload File</h2>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-muted mb-2">
                <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-navy">
                {file ? file.name : "Click to select a file"}
              </p>
              <p className="text-xs text-muted mt-1">
                Supports .xlsx, .xls, and .csv files
              </p>
            </label>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div>
                <p className="text-sm font-medium text-navy">{file.name}</p>
                <p className="text-xs text-muted">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2 bg-teal hover:bg-teal-dark disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {uploading ? "Importing..." : "Import Trips"}
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="text-danger text-sm mt-4">{error}</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">Import Results</h2>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-navy">{result.total}</p>
              <p className="text-xs text-muted">Total Rows</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-success">{result.created}</p>
              <p className="text-xs text-muted">Created</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-danger">{result.errors.length}</p>
              <p className="text-xs text-muted">Errors</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-navy mb-2">Errors:</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-danger bg-red-50 p-2 rounded">{err}</p>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/dashboard/trips"
            className="inline-block mt-4 text-sm text-teal hover:text-teal-dark font-medium"
          >
            View All Trips &rarr;
          </Link>
        </div>
      )}

      {/* Expected Format */}
      <div className="mt-6 bg-card rounded-xl border border-border shadow-sm p-6">
        <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">Expected Columns</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-xs text-muted uppercase">Column</th>
                <th className="text-left p-2 text-xs text-muted uppercase">Required</th>
                <th className="text-left p-2 text-xs text-muted uppercase">Example</th>
              </tr>
            </thead>
            <tbody className="text-navy">
              <tr className="border-b border-border"><td className="p-2 font-medium">Patient Name</td><td className="p-2">Yes</td><td className="p-2 text-muted">John Doe</td></tr>
              <tr className="border-b border-border"><td className="p-2 font-medium">Patient Phone</td><td className="p-2">No</td><td className="p-2 text-muted">(555) 123-4567</td></tr>
              <tr className="border-b border-border"><td className="p-2 font-medium">Pickup Address</td><td className="p-2">Yes</td><td className="p-2 text-muted">123 Main St, Miami, FL</td></tr>
              <tr className="border-b border-border"><td className="p-2 font-medium">Destination Address</td><td className="p-2">Yes</td><td className="p-2 text-muted">Hospital Name, Miami, FL</td></tr>
              <tr className="border-b border-border"><td className="p-2 font-medium">Appointment Date</td><td className="p-2">Yes</td><td className="p-2 text-muted">2026-04-01</td></tr>
              <tr className="border-b border-border"><td className="p-2 font-medium">Appointment Time</td><td className="p-2">No</td><td className="p-2 text-muted">09:00</td></tr>
              <tr className="border-b border-border"><td className="p-2 font-medium">Mobility Type</td><td className="p-2">No</td><td className="p-2 text-muted">ambulatory, wheelchair, stretcher</td></tr>
              <tr><td className="p-2 font-medium">Special Instructions</td><td className="p-2">No</td><td className="p-2 text-muted">Needs walker assistance</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
