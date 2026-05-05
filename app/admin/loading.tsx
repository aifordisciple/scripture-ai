// app/admin/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-lg border border-border p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="p-6">
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}