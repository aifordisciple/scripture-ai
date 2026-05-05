// app/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-accent/50 dark:bg-card flex flex-col">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-card border-b dark:border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      {/* Main content skeleton */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-3 w-96 mt-2" />
        </div>

        <div className="bg-white dark:bg-card rounded-2xl border dark:border-border p-6">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
