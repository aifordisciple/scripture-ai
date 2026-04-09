"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "inline"
  text?: string
  className?: string
}

export function LoadingState({
  variant = "spinner",
  text,
  className
}: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        {text && <span>{text}</span>}
      </div>
    )
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}>
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )
}

// Specialized skeletons for common loading states

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 p-4 rounded-lg border", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

export function ListSkeleton({
  count = 3,
  className
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function TableRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-3", className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  )
}
