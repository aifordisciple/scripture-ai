// components/bible/CrossRefTab.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { GitBranch, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
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

interface CrossRefTabProps {
  sourceVerse: {
    bookId: string;
    bookName: string;
    chapter: number;
    verse: number;
    content: string;
  };
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

export function CrossRefTab({ sourceVerse: initialSourceVerse }: CrossRefTabProps) {
  // Internal state for current source verse - allows navigation within the tab
  const [currentSource, setCurrentSource] = useState(initialSourceVerse);
  const [connections, setConnections] = useState<CrossReferenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ConnectionType | "ALL">("ALL");
  const [enableAI, setEnableAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const { apiConfig } = useBibleStore();
  const { t } = useTranslation();

  // Fetch cross-references
  const fetchCrossRefs = useCallback(async (source: typeof currentSource) => {
    if (!source) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cross-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: source.bookId,
          chapter: source.chapter,
          verse: source.verse,
          content: source.content,
          options: {
            limit: 20,
            minStrength: 0.35,
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
      console.error("[CrossRefTab] Error:", err);
      setError(t('bible.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [apiConfig]);

  // Fetch AI descriptions separately
  const fetchAIDescriptions = useCallback(async () => {
    if (!currentSource || connections.length === 0) return;

    setAiLoading(true);

    try {
      const response = await fetch("/api/cross-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: currentSource.bookId,
          chapter: currentSource.chapter,
          verse: currentSource.verse,
          content: currentSource.content,
          options: {
            limit: 20,
            minStrength: 0.35,
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
      console.error("[CrossRefTab] AI Error:", err);
    } finally {
      setAiLoading(false);
    }
  }, [currentSource, connections.length, apiConfig]);

  // Initial fetch
  useEffect(() => {
    fetchCrossRefs(currentSource);
  }, [currentSource]);

  // Fetch AI descriptions when enabled
  useEffect(() => {
    if (enableAI && !loading && connections.length > 0) {
      fetchAIDescriptions();
    }
  }, [enableAI]);

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

  // Handle navigation - navigate to an existing read tab
  const handleNavigate = (item: CrossReferenceItem) => {
    const store = useBibleStore.getState();

    // Find an existing read tab
    const existingReadTab = store.tabs.find(t => t.type === 'read');

    if (existingReadTab) {
      // Set the verse to scroll to (携带目标章节信息)
      store.setScrollToVerse({ bookId: item.bookId, chapter: item.chapter.toString(), verse: item.verse });

      // Switch to the read tab first
      store.setActiveTab(existingReadTab.id);

      // Then update its content (now it's the active tab)
      store.updateActiveTab({ book: item.bookId, chapter: item.chapter.toString() });

      // Update URL
      window.history.pushState({}, '', `/?book=${item.bookId}&chapter=${item.chapter}`);
    } else {
      // No read tab exists - shouldn't happen normally
      window.location.href = `/?book=${item.bookId}&chapter=${item.chapter}`;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-[-0.022em]">{t('bible.crossRefTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('bible.crossRefSubtitle')}</p>
        </div>
      </div>

      {/* Source Verse Card */}
      <motion.div
        key={`${currentSource.bookId}-${currentSource.chapter}-${currentSource.verse}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10"
      >
        <div className="text-sm font-semibold text-primary mb-2">
          {currentSource.bookName} {currentSource.chapter}:{currentSource.verse}
        </div>
        <div className="text-foreground leading-relaxed">
          {currentSource.content}
        </div>
      </motion.div>

      {/* AI Toggle */}
      <div className="flex items-center justify-between px-4 py-3 mb-4 rounded-xl bg-accent/50 dark:bg-accent/50 border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-foreground">{t('bible.aiConnectionDesc')}</span>
        </div>
        <div className="flex items-center gap-2">
          {aiLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          <button
            onClick={() => setEnableAI(!enableAI)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
              enableAI
                ? "bg-primary"
                : "bg-accent dark:bg-accent"
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                enableAI ? "translate-x-5" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      {!loading && connections.length > 0 && (
        <CrossRefFilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
      )}

      {/* Content */}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <CrossRefItemSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchCrossRefs}
              className="mt-3 text-sm text-primary hover:underline"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : filteredConnections.length === 0 ? (
          <CrossRefEmpty />
        ) : (
          <div className="space-y-2">
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
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            {t('bible.crossRefFooterTab')}
          </p>
        </div>
      )}
    </div>
  );
}