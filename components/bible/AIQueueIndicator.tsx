"use client";

import { useBibleStore } from "@/store/useBibleStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ListOrdered, X, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { useState } from "react";

export function AIQueueIndicator() {
  const {
    currentAiRequest,
    aiQueue,
    cancelAIRequest,
    setAiOpen,
    isAiOpen
  } = useBibleStore();

  const [isExpanded, setIsExpanded] = useState(false);

  // 无队列内容时不显示
  if (!currentAiRequest && aiQueue.length === 0) {
    return null;
  }

  // 当前处理中的请求
  const isProcessing = currentAiRequest?.status === 'processing';
  const queueCount = aiQueue.length;

  // 获取经文引用简短显示
  const getShortRef = (ref: { bookName: string; chapter: number; verse: number }) => {
    if (ref.verse > 0) {
      return `${ref.bookName} ${ref.chapter}:${ref.verse}`;
    }
    return `${ref.bookName} ${ref.chapter}章`;
  };

  // 截取提示词
  const truncatePrompt = (prompt: string, maxLen: number = 20) => {
    if (prompt.length <= maxLen) return prompt;
    return prompt.slice(0, maxLen) + '...';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      <AnimatePresence mode="wait">
        {/* 收起状态：小气泡 */}
        {!isExpanded && (
          <motion.button
            key="collapsed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg",
              "bg-gradient-to-r from-blue-500 to-purple-500 text-white",
              "hover:shadow-xl hover:scale-105 transition-all duration-300"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ListOrdered className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isProcessing ? 'AI 解读中' : 'AI 队列'}
            </span>
            {queueCount > 0 && (
              <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                +{queueCount}
              </span>
            )}
          </motion.button>
        )}

        {/* 展开状态：详细列表 */}
        {isExpanded && (
          <motion.div
            key="expanded"
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className={cn(
              "w-72 rounded-2xl shadow-2xl overflow-hidden",
              "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            )}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <ListOrdered className="w-4 h-4 text-blue-500" />
                AI 解读队列
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 当前处理中 */}
            {currentAiRequest && (
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    正在处理
                  </span>
                  <button
                    onClick={() => {
                      cancelAIRequest(currentAiRequest.id);
                      if (!isAiOpen) setAiOpen(true);
                    }}
                    className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium"
                  >
                    取消
                  </button>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {getShortRef(currentAiRequest.ref)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {truncatePrompt(currentAiRequest.prompt, 30)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 等待队列 */}
            {aiQueue.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-800/50">
                  等待中 ({aiQueue.length})
                </div>
                {aiQueue.map((item, index) => (
                  <div
                    key={item.id}
                    className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-xs text-slate-400 font-mono w-4 shrink-0">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-700 dark:text-slate-200 truncate">
                          {getShortRef(item.ref)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {truncatePrompt(item.prompt, 25)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelAIRequest(item.id)}
                      className="ml-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                      title="从队列移除"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 错误状态 */}
            {currentAiRequest?.status === 'error' && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>处理失败: {currentAiRequest.error || '未知错误'}</span>
                </div>
              </div>
            )}

            {/* 底部：打开侧边栏 */}
            <button
              onClick={() => {
                setAiOpen(true);
                setIsExpanded(false);
              }}
              className="w-full px-4 py-2.5 text-center text-xs font-medium text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-t border-slate-200 dark:border-slate-700"
            >
              打开 AI 侧边栏
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}