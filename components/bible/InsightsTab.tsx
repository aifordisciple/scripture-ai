// components/bible/InsightsTab.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBibleStore } from "@/store/useBibleStore";
import { BIBLE_BOOKS } from "@/lib/constants";
import { Loader2, Bookmark, ChevronRight, Trash2, Edit3, Search, X, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from "@/lib/i18n";
import { getClientLocale } from "@/lib/locale";
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { stripThinkTags } from '@/lib/ai';

interface PopulatedInsight {
  id: string;
  messageId: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse?: number;
  title?: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export function InsightsTab() {
  const router = useRouter();
  const { data: session } = useSession();
  const { savedInsights, setSavedInsights, deleteSavedInsight, updateSavedInsight, tabs, addTab, setActiveTab } = useBibleStore();
  const { t } = useTranslation();
  const { addToast } = useToast();

  // ConfirmDialog state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");

  // 从API加载收藏数据
  useEffect(() => {
    async function loadInsights() {
      if (!session?.user) return;
      setIsLoading(true);
      try {
        const res = await fetch('/api/insights');
        if (res.ok) {
          const data = await res.json();
          setSavedInsights(data);
        }
      } catch (err) {
        console.error("Failed to load insights", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInsights();
  }, [session, setSavedInsights]);

  // 搜索过滤
  const filteredInsights = useMemo(() => {
    if (!searchQuery) return savedInsights;
    const query = searchQuery.toLowerCase();
    return savedInsights.filter(i =>
      (i.title?.toLowerCase().includes(query)) ||
      (i.content?.toLowerCase().includes(query)) ||
      (i.tags?.some(t => t.toLowerCase().includes(query)))
    );
  }, [savedInsights, searchQuery]);

  // 按书卷分组
  const groupedInsights = useMemo(() => {
    const groups: Record<string, PopulatedInsight[]> = {};
    filteredInsights.forEach(i => {
      const bookName = BIBLE_BOOKS.find(b => b.id === i.bookId)?.name || i.bookId;
      if (!groups[bookName]) groups[bookName] = [];
      groups[bookName].push({
        ...i,
        bookName,
      });
    });
    // 按更新时间排序
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
    });
    return groups;
  }, [filteredInsights]);

  // 点击跳转到经文
  const handleJump = (bookId: string, chapter: number) => {
    const readTab = tabs.find(t => t.type === 'read');
    if (readTab) {
      useBibleStore.setState((state) => ({
        tabs: state.tabs.map(t => t.id === readTab.id ? { ...t, book: bookId, chapter: chapter.toString() } : t)
      }));
      setActiveTab(readTab.id);
    } else {
      addTab({ type: 'read', book: bookId, chapter: chapter.toString() });
    }
    router.push(`/?book=${bookId}&chapter=${chapter}`);
  };

  // 删除收藏
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const executeDeleteInsight = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    deleteSavedInsight(id);
    await fetch(`/api/insights?id=${id}`, { method: 'DELETE' });
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
  };

  // 开始编辑
  const handleEdit = (e: React.MouseEvent, insight: PopulatedInsight) => {
    e.stopPropagation();
    setEditingId(insight.id);
    setEditTitle(insight.title || "");
    setEditContent(insight.content || "");
    setEditTags(insight.tags?.join(", ") || "");
  };

  // 保存编辑
  const handleEditSave = async (id: string) => {
    const tags = editTags.split(",").map(t => t.trim()).filter(Boolean);
    updateSavedInsight(id, { title: editTitle, content: editContent, tags });
    await fetch('/api/insights', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title: editTitle, content: editContent, tags })
    });
    setEditingId(null);
  };

  // 取消编辑
  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
  };

  // 获取摘要（前100字）
  const getSummary = (content: string) => {
    const cleanContent = stripThinkTags(content);
  };


  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-4">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-border">
        <div className="p-2.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-lg">
          <Bookmark className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('bible.myCollection')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('bible.collectionCount', { count: savedInsights.length })}
          </p>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('bible.searchCollection')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 rounded-full h-11 bg-secondary dark:bg-card border-border dark:border-border focus:ring-primary/20 focus:border-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 内容区 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p className="text-sm">{t('bible.loadingCollection')}</p>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="text-center py-20 opacity-40 select-none">
          <Bookmark className="w-16 h-16 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-lg">{searchQuery ? t('bible.noMatchCollection') : t('bible.noCollection')}</p>
          <p className="text-sm mt-2">{t('bible.addCollectionHint')}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedInsights).map(([bookName, items]) => (
            <div key={bookName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold font-serif text-foreground mb-4 flex items-center gap-2 tracking-[-0.022em]">
                <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
                {bookName}
                <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex flex-col p-4 rounded-2xl cursor-pointer border transition-all duration-300",
                      "bg-card border-border dark:border-border",
                      expandedId === item.id && "ring-2 ring-primary/30"
                    )}
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    {/* 顶部：标题和操作按钮 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {item.bookName} {item.chapter}{item.verse ? `:${item.verse}` : ''}
                        </span>
                        {editingId === item.id ? null : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleJump(item.bookId, item.chapter); }}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title={t('bible.jumpToVerse')}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity">
                        {editingId === item.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-primary hover:text-apple-focus hover:bg-primary/10 dark:hover:bg-primary/10 rounded-full active:scale-95"
                              onClick={(e) => { e.stopPropagation(); handleEditSave(item.id); }}
                              title={t('bible.saveBtn')}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
                              onClick={(e) => { e.stopPropagation(); handleEditCancel(); }}
                              title={t('bible.cancelBtn')}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full active:scale-95"
                              onClick={(e) => handleEdit(e, item)}
                              title={t('bible.editBtn')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full active:scale-95"
                              onClick={(e) => handleDelete(e, item.id)}
                              title={t('bible.deleteBtn')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <ChevronRight className={cn(
                              "w-4 h-4 text-muted-foreground transition-transform",
                              expandedId === item.id && "rotate-90"
                            )} />
                          </>
                        )}
                      </div>
                    </div>

                    {/* 内容区 */}
                    {editingId === item.id ? (
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <Input
                          placeholder={t('bible.titleOptional')}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="text-sm"
                        />
                        <textarea
                          placeholder={t('bible.contentLabel')}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full min-h-[120px] p-3 text-sm border-border dark:border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <Input
                          placeholder={t('bible.tagsPlaceholder')}
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    ) : (
                      <>
                        {item.title && (
                          <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                        )}
                        {expandedId === item.id ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{stripThinkTags(item.content || '')}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-[15px] leading-relaxed text-foreground/80 line-clamp-2">
                            {getSummary(item.content || '')}
                          </p>
                        )}
                        {/* 标签 */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] rounded-full bg-secondary dark:bg-card text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* 时间 */}
                    {editingId !== item.id && (
                      <p className="text-[10px] text-muted-foreground/60 mt-2">
                        {new Date(item.updatedAt || item.createdAt).toLocaleString(getClientLocale())}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('common.confirm')}
        description={t('bible.confirmDeleteInsight')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="destructive"
        onConfirm={executeDeleteInsight}
      />
    </div>
  );
}