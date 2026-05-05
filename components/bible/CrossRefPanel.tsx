// components/bible/CrossRefPanel.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { X, GitBranch, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  CrossRefItem,
  CrossRefItemSkeleton,
  CrossRefEmpty,
  CrossReferenceItem,
} from "./CrossRefItem";
import {
  CrossRefFilterTabs,
  ConnectionType,
} from "./CrossRefBadge";
import { useBibleStore } from "@/store/useBibleStore";

interface CrossRefPanelProps {
  visible: boolean;
  position: { top: number; left: number };
  sourceVerse: {
    bookId: string;
    bookName: string;
    chapter: number;
    verse: number;
    content: string;
  } | null;
  onClose: () => void;
  onNavigate: (bookId: string, chapter: number, verse?: number) => void;
}

interface APIResponse {
  source: {
    bookId: string;
    bookName: string;
    chapter: number;
    verse: number;
    content: string;
  };
  connections: CrossReferenceItem[];
  cached?: boolean;
}

export function CrossRefPanel({
  visible,
  position,
  sourceVerse,
  onClose,
  onNavigate,
}: CrossRefPanelProps) {
  const [connections, setConnections] = useState<CrossReferenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ConnectionType | "ALL">("ALL");
  const [enableAI, setEnableAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const { apiConfig } = useBibleStore();
  const { t } = useTranslation();

  // Fetch cross-references when source verse changes
  const fetchCrossRefs = useCallback(async () => {
    if (!sourceVerse) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cross-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: sourceVerse.bookId,
          chapter: sourceVerse.chapter,
          verse: sourceVerse.verse,
          content: sourceVerse.content,
          options: {
            limit: 15,
            minStrength: 0.4,
            enableAI: false,
          },
          apiConfig,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cross-references");
      }

      const data: APIResponse = await response.json();
      setConnections(data.connections);
    } catch (err) {
      console.error("[CrossRefPanel] Error:", err);
      setError(t('bible.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [sourceVerse, apiConfig]);

  // Fetch AI descriptions separately
  const fetchAIDescriptions = useCallback(async () => {
    if (!sourceVerse || connections.length === 0) return;

    setAiLoading(true);

    try {
      const response = await fetch("/api/cross-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: sourceVerse.bookId,
          chapter: sourceVerse.chapter,
          verse: sourceVerse.verse,
          content: sourceVerse.content,
          options: {
            limit: 15,
            minStrength: 0.4,
            enableAI: true,
          },
          apiConfig,
        }),
      });

      if (response.ok) {
        const data: APIResponse = await response.json();
        setConnections(data.connections);
      }
    } catch (err) {
      console.error("[CrossRefPanel] AI Error:", err);
    } finally {
      setAiLoading(false);
    }
  }, [sourceVerse, connections.length, apiConfig]);

  // Initial fetch
  useEffect(() => {
    if (visible && sourceVerse) {
      fetchCrossRefs();
    }
  }, [visible, sourceVerse, fetchCrossRefs]);

  // Fetch AI descriptions when enabled
  useEffect(() => {
    if (enableAI && !loading && connections.length > 0) {
      fetchAIDescriptions();
    }
  }, [enableAI]);

  // Reset state when panel closes
  useEffect(() => {
    if (!visible) {
      setConnections([]);
      setActiveFilter("ALL");
      setError(null);
      setEnableAI(false);
    }
  }, [visible]);

  // Filter connections
  const filteredConnections =
    activeFilter === "ALL"
      ? connections
      : connections.filter((c) => c.type === activeFilter);

  // Count by type
  const counts = {
    ALL: connections.length,
    QUOTATION: connections.filter((c) => c.type === "QUOTATION").length,
    PARALLEL: connections.filter((c) => c.type === "PARALLEL").length,
    THEMATIC: connections.filter((c) => c.type === "THEMATIC").length,
    PROPHECY: connections.filter((c) => c.type === "PROPHECY").length,
  };

  // Handle navigation
  const handleNavigate = (item: CrossReferenceItem) => {
    onNavigate(item.bookId, item.chapter, item.verse);
    onClose();
  };

  if (!visible) return null;

  // Calculate position - responsive for mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const panelWidth = isMobile ? Math.min(380, window.innerWidth - 20) : 380;
  const panelHeight = 450;

  // On mobile, center the panel horizontally
  // On desktop, position above the trigger point
  let adjustedTop: number;
  let adjustedLeft: number;

  if (isMobile) {
    // Mobile: center horizontally, show from top
    adjustedTop = Math.max(10, Math.min(position.top - panelHeight - 20, window.innerHeight - panelHeight - 20));
    adjustedLeft = 10; // 10px margin from left
  } else {
    // Desktop: center on trigger point
    adjustedTop = Math.max(position.top - panelHeight - 20, 10);
    adjustedLeft = Math.min(Math.max(position.left - panelWidth / 2, 10), window.innerWidth - panelWidth - 10);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 max-w-[calc(100vw-20px)] bg-card rounded-2xl shadow-2xl shadow-black/15 border border-border dark:border-border overflow-hidden flex flex-col"
        style={{
          top: adjustedTop,
          left: adjustedLeft,
          width: panelWidth,
          maxHeight: '70vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-border bg-accent/50 dark:bg-accent/50">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">{t('bible.crossRefTitle')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-accent dark:hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Source Verse */}
        {sourceVerse && (
          <div className="px-4 py-3 border-b border-border dark:border-border bg-primary/5">
            <div className="text-sm font-semibold text-primary mb-1">
              {sourceVerse.bookName} {sourceVerse.chapter}:{sourceVerse.verse}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground line-clamp-2">
              {sourceVerse.content}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {!loading && connections.length > 0 && (
          <CrossRefFilterTabs
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />
        )}

        {/* AI Toggle */}
        {!loading && connections.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-border dark:border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground dark:text-muted-foreground">{t('bible.aiConnectionDesc')}</span>
            </div>
            <div className="flex items-center gap-2">
              {aiLoading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              )}
              <button
                onClick={() => setEnableAI(!enableAI)}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
                  enableAI
                    ? "bg-primary"
                    : "bg-accent dark:bg-accent"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    enableAI ? "translate-x-4" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <CrossRefItemSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={fetchCrossRefs}
                className="mt-2 text-xs text-primary hover:underline"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : filteredConnections.length === 0 ? (
            <CrossRefEmpty />
          ) : (
            <div className="space-y-1">
              {filteredConnections.map((item, index) => (
                <CrossRefItem
                  key={`${item.bookId}-${item.chapter}-${item.verse}-${index}`}
                  item={item}
                  onClick={() => handleNavigate(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && connections.length > 0 && (
          <div className="px-4 py-2 border-t border-border dark:border-border bg-accent/50 dark:bg-accent/50">
            <p className="text-xs text-muted-foreground text-center">
              {t('bible.crossRefFooter')}
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}