import Link from "next/link";

export default function FormsLandingPage() {
  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-navy">Reimbursement Forms</h1>
        <p className="text-muted mt-2 max-w-xl mx-auto">
          Submit reimbursement claims and invoices for non-emergency medical transportation services.
          Select the form type below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Medicaid Trip Reimbursement */}
        <Link
          href="/forms/medicaid-trip"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-teal hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-navy group-hover:text-teal transition-colors">
            Medicaid Trip Reimbursement
          </h2>
          <p className="text-sm text-muted mt-2">
            Submit trip reimbursement claims to Medicaid and health plans. Includes patient info, trip details, mileage, and charges.
          </p>
          <span className="inline-block mt-4 text-sm text-teal font-medium group-hover:translate-x-1 transition-transform">
            Start Form &rarr;
          </span>
        </Link>

        {/* Provider Invoice */}
        <Link
          href="/forms/provider-invoice"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-teal hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-navy group-hover:text-teal transition-colors">
            Provider Invoice
          </h2>
          <p className="text-sm text-muted mt-2">
            Submit billing invoices for completed transportation trips. Includes line items, rates, and provider details.
          </p>
          <span className="inline-block mt-4 text-sm text-teal font-medium group-hover:translate-x-1 transition-transform">
            Start Form &rarr;
          </span>
        </Link>

        {/* CMS-1500 */}
        <Link
          href="/forms/cms-1500"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-teal hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-navy group-hover:text-teal transition-colors">
            CMS-1500 Claim Form
          </h2>
          <p className="text-sm text-muted mt-2">
            Standard healthcare claim form (HCFA) for NEMT reimbursement submissions with full Box 1-33 support.
          </p>
          <span className="inline-block mt-4 text-sm text-teal font-medium group-hover:translate-x-1 transition-transform">
            Start Form &rarr;
          </span>
        </Link>
      </div>

      {/* Help text */}
      <div className="mt-10 text-center">
        <p className="text-sm text-muted">
          Need help? Contact us at{" "}
          <a href="mailto:info@avantycare.com" className="text-teal hover:text-teal-dark font-medium">info@avantycare.com</a>
          {" "}or call{" "}
          <a href="tel:+18884309830" className="text-teal hover:text-teal-dark font-medium">+1 888 430 9830</a>
        </p>
      </div>
    </div>
  );
}
