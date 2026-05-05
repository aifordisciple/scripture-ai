// app/settings/prompts/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useBibleStore } from '@/store/useBibleStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, Edit, Star, StarOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTranslation } from '@/lib/i18n';
import type { CustomPrompt } from '@/store/types';

// 表单弹窗组件
function PromptFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (label: string, prompt: string) => void;
  initialData?: { label: string; prompt: string };
  isEditing: boolean;
}) {
  const [label, setLabel] = useState(initialData?.label || '');
  const [prompt, setPrompt] = useState(initialData?.prompt || '');

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label);
      setPrompt(initialData.prompt);
    } else {
      setLabel('');
      setPrompt('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (label.trim() && prompt.trim()) {
      onSubmit(label.trim(), prompt.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-accent rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="p-4 border-b dark:border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground">
            {isEditing ? '编辑自定义问题' : '添加自定义问题'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground dark:hover:text-foreground"
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground dark:text-foreground mb-1">
              标签名称（支持emoji）
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例如: ❤️ 爱心解读"
              className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-white dark:bg-accent text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground dark:text-foreground mb-1">
              问题内容
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入问题内容，例如: 请从爱的角度解读这段经文，关注神对人的爱..."
              className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-white dark:bg-accent text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{prompt.length}/500</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={!label.trim() || !prompt.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? '保存' : '添加'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// 主页面组件
export default function PromptsSettingsPage() {
  const { status } = useSession();
  const { customPrompts, setCustomPrompts } = useBibleStore();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // 加载用户的自定义提示词
  useEffect(() => {
    const loadPrompts = async () => {
      // Only load when authenticated
      if (status !== 'authenticated') {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/prompts');
        if (res.ok) {
          const prompts = await res.json();
          setCustomPrompts(prompts);
        }
      } catch (error) {
        console.error('Failed to load prompts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPrompts();
  }, [setCustomPrompts, status]);

  // 添加新提示词
  const handleAdd = useCallback(async (label: string, prompt: string) => {
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, prompt }),
      });
      if (res.ok) {
        const newPrompt = await res.json();
        setCustomPrompts([newPrompt, ...customPrompts]);
      }
    } catch (error) {
      console.error('Failed to add prompt:', error);
    }
  }, [customPrompts, setCustomPrompts]);

  // 更新提示词
  const handleUpdate = useCallback(async (label: string, prompt: string) => {
    if (!editingPrompt) return;
    try {
      const res = await fetch('/api/prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPrompt.id, label, prompt }),
      });
      if (res.ok) {
        const updatedPrompt = await res.json();
        setCustomPrompts(customPrompts.map(p =>
          p.id === editingPrompt.id ? updatedPrompt : p
        ));
        setEditingPrompt(null);
      }
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  }, [editingPrompt, customPrompts, setCustomPrompts]);

  // 删除提示词
  const handleDelete = useCallback(async (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
    try {
      const res = await fetch(`/api/prompts?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCustomPrompts(customPrompts.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  }, [customPrompts, setCustomPrompts]);

  // 设置/取消默认
  const handleToggleDefault = useCallback(async (id: string, isDefault: boolean) => {
    try {
      const res = await fetch('/api/prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: !isDefault }),
      });
      if (res.ok) {
        if (!isDefault) {
          // 设置为默认，取消其他默认
          setCustomPrompts(customPrompts.map(p => ({
            ...p,
            isDefault: p.id === id
          })));
        } else {
          setCustomPrompts(customPrompts.map(p => ({
            ...p,
            isDefault: p.id === id ? false : p.isDefault
          })));
        }
      }
    } catch (error) {
      console.error('Failed to toggle default:', error);
    }
  }, [customPrompts, setCustomPrompts]);

  return (
    <>
    <div className="min-h-screen bg-accent/50 dark:bg-card">
      {/* Unauthenticated state */}
      {status === 'unauthenticated' && (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-2 tracking-[-0.022em]">
              请先登录
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground mb-4">
              登录后即可管理自定义问题
            </p>
            <Button onClick={() => window.location.href = '/'}>
              返回首页
            </Button>
          </div>
        </div>
      )}

      {/* Authenticated content */}
      {status === 'authenticated' && (
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white dark:bg-accent border-b dark:border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground dark:text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground dark:text-foreground">
              自定义问题
            </h1>
          </div>
          <Button
            onClick={() => {
              setEditingPrompt(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            添加问题
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : customPrompts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-accent dark:bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <h2 className="text-lg font-semibold text-muted-foreground dark:text-foreground mb-2">
              还没有自定义问题
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              创建自定义快捷问题，一键发送常用提问
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加第一个问题
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {customPrompts.map((prompt) => (
                <motion.div
                  key={prompt.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-accent rounded-xl border dark:border-border p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground dark:text-foreground truncate">
                          {prompt.label}
                        </h3>
                        {prompt.isDefault && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                            默认
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground line-clamp-2">
                        {prompt.prompt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleDefault(prompt.id, prompt.isDefault)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          prompt.isDefault
                            ? "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                            : "text-muted-foreground hover:bg-accent dark:hover:bg-accent"
                        )}
                        title={prompt.isDefault ? "取消默认" : "设为默认"}
                      >
                        {prompt.isDefault ? (
                          <Star className="w-4 h-4 fill-current" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPrompt(prompt);
                          setShowForm(true);
                        }}
                        className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            使用提示
          </h3>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <li>• 在AI侧边栏选择「自定义」模式即可使用自定义问题</li>
            <li>• 设为默认的问题会在自定义模式中优先显示</li>
            <li>• 标签名称支持emoji，让快捷按钮更有辨识度</li>
          </ul>
        </div>
      </main>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <PromptFormModal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingPrompt(null);
            }}
            onSubmit={editingPrompt ? handleUpdate : handleAdd}
            initialData={editingPrompt ? { label: editingPrompt.label, prompt: editingPrompt.prompt } : undefined}
            isEditing={!!editingPrompt}
          />
        )}
      </AnimatePresence>
        </>
      )}
    </div>
    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title={t('settings.confirmDeletePrompt')}
      description={t('settings.deletePromptWarning')}
      onConfirm={() => {
        if (pendingDeleteId) {
          deletePrompt(pendingDeleteId);
          setPendingDeleteId(null);
        }
      }}
    />
    </>
  );
}