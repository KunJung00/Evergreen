import { LoadingSkeleton } from '@/components/shared/loading-skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-48" />
        <LoadingSkeleton className="h-5 w-64" />
      </div>
      <LoadingSkeleton className="h-9 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}
