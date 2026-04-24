// components/bible/SearchDialog.tsx
"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, TextSearch } from "lucide-react";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<'exact' | 'ai'>('exact');
  const { addTab } = useBibleStore();
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
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Search className="w-5 h-5" />
            经文搜索
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* 模式选择 */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
            <button
              onClick={() => setMode('exact')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all",
                mode === 'exact'
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              )}
            >
              <TextSearch className="w-4 h-4" />
              精确
            </button>
            <button
              onClick={() => setMode('ai')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all",
                mode === 'ai'
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              )}
            >
              <Sparkles className="w-4 h-4" />
              AI 推荐
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              placeholder={
                mode === 'exact' ? "输入词句，如：起初神创造..." :
                "输入处境/意图，如：关于信心与软弱\n最近感到迷茫，需要方向和力量"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="flex-1 w-full rounded-md border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              autoFocus
            />
            <Button onClick={handleSearch} className={cn("w-full", mode === 'ai' && "bg-blue-600 hover:bg-blue-700")}>
              搜索
            </Button>
          </div>

          <div className="text-xs text-slate-400 min-h-[16px]">
            {mode === 'exact' && "提示：查找包含特定关键词的经文。速度最快。"}
            {mode === 'ai' && "提示：AI 将深度理解您的处境并推荐相关经文。支持多行输入。"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
