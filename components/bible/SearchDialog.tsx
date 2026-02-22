// components/bible/SearchDialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles, TextSearch, Radar } from "lucide-react";
import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<'exact' | 'fuzzy' | 'ai'>('exact');
  const { addTab } = useBibleStore();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Search className="w-5 h-5" />
            经文搜索
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-2">
          {/* 模式选择 (已增加模糊匹配选项) */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
            <button
              onClick={() => setMode('exact')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
                mode === 'exact' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              )}
            >
              <TextSearch className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              精确
            </button>
            <button
              onClick={() => setMode('fuzzy')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
                mode === 'fuzzy' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              )}
            >
              <Radar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              模糊
            </button>
            <button
              onClick={() => setMode('ai')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all",
                mode === 'ai' 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              AI 推荐
            </button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={
                mode === 'exact' ? "输入词句，如：起初神创造..." : 
                mode === 'fuzzy' ? "输入大致意思，如：心里有个洞填不满" :
                "输入处境/意图，如：关于信心与软弱"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 dark:bg-slate-800 dark:border-slate-700"
              autoFocus
            />
            <Button onClick={handleSearch} className={mode === 'ai' ? "bg-blue-600 hover:bg-blue-700" : ""}>
              搜索
            </Button>
          </div>
          
          <div className="text-xs text-slate-400 min-h-[16px]">
            {mode === 'exact' && "提示：查找包含特定关键词的经文。速度最快。"}
            {mode === 'fuzzy' && "提示：基于向量模型，根据白话文或大致意思进行语义匹配。"}
            {mode === 'ai' && "提示：AI 将深度理解您的处境并推荐相关经文。"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}