// app/admin/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-6 py-4">
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
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="p-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800">
          <div className="p-4 border-b dark:border-slate-800">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="divide-y dark:divide-slate-800">
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
