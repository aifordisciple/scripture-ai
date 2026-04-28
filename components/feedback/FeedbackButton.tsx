"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface FeedbackButtonProps {
  className?: string;
  variant?: "floating" | "inline";
}

export function FeedbackButton({ className, variant = "floating" }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  if (variant === "inline") {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className={cn("gap-2", className)}
        >
          <MessageSquare className="w-4 h-4" />
          {t('feedback.feedbackButton')}
        </Button>
        <FeedbackDialog open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-20 left-4 md:bottom-6 md:left-6 z-30",
          "w-12 h-12 rounded-full shadow-lg",
          "bg-white dark:bg-slate-800 border-border",
          "hover:bg-primary hover:text-white hover:border-primary",
          "transition-all duration-200",
          className
        )}
        title={t('feedback.feedbackButton')}
      >
        <MessageSquare className="w-5 h-5" />
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}