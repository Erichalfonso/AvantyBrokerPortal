import { TableSkeleton } from "@/components/loading-skeleton";

export default function TripsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-32 bg-background rounded animate-pulse mb-2" />
          <div className="h-4 w-24 bg-background rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-6">
        <div className="h-10 bg-background rounded animate-pulse" />
      </div>
      <TableSkeleton rows={8} cols={8} />
    </div>
  );
}
