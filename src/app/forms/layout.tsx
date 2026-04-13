import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Reimbursement Forms - Avanty Care",
  description: "Submit reimbursement forms for NEMT services",
};

export default function FormsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/forms">
            <Image
              src="/images/logo-dark.png"
              alt="Avanty Care"
              width={160}
              height={56}
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/forms" className="text-sm text-muted hover:text-navy transition-colors">
              All Forms
            </Link>
            <a href="https://avantycare.com" className="text-sm text-teal hover:text-teal-dark font-medium transition-colors">
              Back to Avanty Care
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">&copy; 2026 Avanty Care Corp. All rights reserved.</p>
          <p className="text-xs text-gray-400 mt-1">14992 SW 59th ST Miami, FL 33193 &middot; +1 888 430 9830 &middot; info@avantycare.com</p>
        </div>
      </footer>
    </div>
  );
}
