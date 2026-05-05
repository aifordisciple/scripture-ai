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
      <DialogContent className="sm:max-w-lg bg-white dark:bg-[#272729] dark:border-[#3a3a3c]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1d1d1f] dark:text-white">
            <Search className="w-5 h-5" />
            {t('search.dialogTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex p-1 bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-xl gap-1">
            <button
              onClick={() => setMode('exact')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl transition-all",
                mode === 'exact'
                  ? "bg-white dark:bg-[#2a2a2c] text-[#1d1d1f] dark:text-white"
                  : "text-[#7a7a7a] hover:text-[#1d1d1f] dark:hover:text-white"
              )}
            >
              <TextSearch className="w-4 h-4" />
              {t('search.exactLabel')}
            </button>
            <button
              onClick={() => setMode('ai')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl transition-all",
                mode === 'ai'
                  ? "bg-[#0066cc] dark:bg-[#2997ff] text-white"
                  : "text-[#7a7a7a] hover:text-[#1d1d1f] dark:hover:text-white"
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
              className="flex-1 w-full rounded-full border border-[#e0e0e0] dark:bg-[#1d1d1f] dark:border-[#3a3a3c] dark:text-white/80 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] placeholder:text-[#7a7a7a]"
              autoFocus
            />
            <Button onClick={handleSearch} className={cn("w-full rounded-full active:scale-95", mode === 'ai' && "bg-[#0066cc] hover:bg-[#0071e3]")}>
              {t('search.searchButton')}
            </Button>
          </div>

          <div className="text-xs text-[#7a7a7a] min-h-[16px]">
            {mode === 'exact' && t('search.exactHint')}
            {mode === 'ai' && t('search.aiHint')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}