import { StatsSkeleton, TableSkeleton } from "@/components/loading-skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-7 w-64 bg-background rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-background rounded animate-pulse" />
      </div>
      <div className="mb-8">
        <StatsSkeleton />
      </div>
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
