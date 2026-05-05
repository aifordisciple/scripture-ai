// app/dashboard/error.tsx
"use client";

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error('[Dashboard Error]', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-lg font-semibold text-foreground">
          {t('common.errorBoundaryTitle') || 'Something went wrong'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('common.errorBoundaryMessage') || 'Failed to load dashboard data. Please try again.'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="default" onClick={reset} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {t('common.retry')}
        </Button>
        <Button
          variant="outline"
          onClick={() => typeof window !== 'undefined' && window.history.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Button>
      </div>
    </div>
  );
}
