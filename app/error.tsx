// app/error.tsx
"use client";

import { BookOpen, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-[9999]">
      <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
        <div className="relative p-4">
          <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full"></div>
          <BookOpen className="w-12 h-12 text-destructive relative z-10" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground tracking-[-0.022em]">
            {t('common.errorBoundaryTitle') || 'Something went wrong'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('common.errorBoundaryMessage') || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            onClick={reset}
            className="gap-2 rounded-full"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.retry')}
          </Button>
          <Button
            variant="outline"
            asChild
            className="gap-2 rounded-full"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              {t('common.back')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
