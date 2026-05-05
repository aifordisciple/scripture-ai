// components/bible/SearchDialog.tsx
"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, TextSearch } from "lucide-react";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<'exact' | 'ai'>('exact');
  const { addTab } = useBibleStore();
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSearch = () => {
    if (!query.trim()) return;

    addTab({
      type: 'search',
      query: query,
      searchMode: mode
    });

    onOpenChange(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-card dark:border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
            <Search className="w-5 h-5" />
            {t('search.dialogTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex p-1 bg-secondary dark:bg-card rounded-lg gap-1">
            <button
              onClick={() => setMode('exact')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all",
                mode === 'exact'
                  ? "bg-white dark:bg-card text-foreground dark:text-foreground"
                  : "text-muted-foreground hover:text-foreground dark:hover:text-white"
              )}
            >
              <TextSearch className="w-4 h-4" />
              {t('search.exactLabel')}
            </button>
            <button
              onClick={() => setMode('ai')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all",
                mode === 'ai'
                  ? "bg-primary dark:bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground dark:hover:text-white"
              )}
            >
              <Sparkles className="w-4 h-4" />
              {t('search.aiLabel')}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              placeholder={
                mode === 'exact' ? t('search.exactPlaceholder') :
                t('search.aiPlaceholder')
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="flex-1 w-full rounded-full border border-border dark:bg-card dark:border-border dark:text-foreground/80 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
              autoFocus
            />
            <Button onClick={handleSearch} className={cn("w-full rounded-full active:scale-95", mode === 'ai' && "bg-primary hover:bg-apple-focus")}>
              {t('search.searchButton')}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground min-h-[16px]">
            {mode === 'exact' && t('search.exactHint')}
            {mode === 'ai' && t('search.aiHint')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}