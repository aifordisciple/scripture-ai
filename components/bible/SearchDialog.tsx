// components/bible/SearchDialog.tsx
"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, TextSearch, Clock } from "lucide-react";
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
  const { addTab, addSearchHistory, searchHistory } = useBibleStore();
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSearch = () => {
    if (!query.trim()) return;

    addSearchHistory(query.trim(), mode);
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
      <DialogContent className="sm:max-w-lg bg-card dark:border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
            <Search className="w-5 h-5" />
            {t('search.dialogTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex p-1 bg-secondary/50 rounded-lg gap-1">
            <button
              onClick={() => setMode('exact')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all",
                mode === 'exact'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
              className="flex-1 w-full rounded-xl border border-border dark:bg-card dark:border-border dark:text-foreground/80 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
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

          {/* 最近搜索 */}
          {searchHistory.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('bible.recentSearchesLabel')}
              </p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setQuery(item.query); setMode(item.searchMode); }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
                      "bg-secondary/80 text-secondary-foreground",
                      "hover:bg-primary/10 hover:text-primary",
                      "transition-colors active:scale-95"
                    )}
                  >
                    {item.searchMode === 'ai' ? (
                      <Sparkles className="w-3 h-3" />
                    ) : (
                      <TextSearch className="w-3 h-3" />
                    )}
                    <span className="truncate max-w-[120px]">{item.query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}