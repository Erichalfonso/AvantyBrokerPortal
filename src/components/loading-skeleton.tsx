"use client";

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="h-4 w-32 bg-background rounded animate-pulse" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-background rounded animate-pulse"
                style={{ width: `${60 + Math.random() * 80}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 animate-pulse">
      <div className="h-4 w-24 bg-background rounded mb-4" />
      <div className="space-y-3">
        <div className="h-3 w-full bg-background rounded" />
        <div className="h-3 w-3/4 bg-background rounded" />
        <div className="h-3 w-1/2 bg-background rounded" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-4 animate-pulse">
          <div className="w-10 h-10 bg-background rounded-lg mb-2" />
          <div className="h-5 w-8 bg-background rounded mb-1" />
          <div className="h-3 w-16 bg-background rounded" />
        </div>
      ))}
    </div>
  );
}
