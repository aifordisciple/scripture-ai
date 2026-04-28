'use client'

import { useState, useMemo } from 'react'
import { MessageSquare, ChevronDown, Plus, X, Search, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatSession } from '@/store/types'
import { useTranslation } from '@/lib/i18n'

export interface SessionSelectorProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  showSessionList: boolean
  onToggleSessionList: () => void
  onSelectSession: (session: ChatSession) => void
  onNewSession: () => void
  onDeleteSession: (session: ChatSession) => void
  onRenameSession: (session: ChatSession) => void
}

export function SessionSelector({
  sessions,
  currentSessionId,
  showSessionList,
  onToggleSessionList,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
}: SessionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { t } = useTranslation()

  // 过滤会话列表
  const filteredSessions = useMemo(() => {
    if (!searchQuery) return sessions
    const query = searchQuery.toLowerCase()
    return sessions.filter(
      session =>
        session.title?.toLowerCase().includes(query) ||
        new Date(session.updatedAt).toLocaleDateString().includes(query)
    )
  }, [sessions, searchQuery])

  const currentSession = sessions.find(s => s.id === currentSessionId)

  return (
    <div className="relative" data-session-selector>
      <button
        onClick={onToggleSessionList}
        className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold select-none hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
        aria-label={t('bible.switchSession')}
      >
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm max-w-[120px] truncate">
          {currentSession?.title || t('bible.newChat')}
        </span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* 会话列表下拉 */}
      {showSessionList && (
        <div className="fixed inset-0 md:inset-auto md:top-20 md:left-4 md:w-80 bg-white dark:bg-slate-800 md:rounded-xl shadow-xl border-0 md:border dark:border-slate-700 z-[200] md:max-h-[70vh] overflow-hidden flex flex-col">
          {/* 顶部：新建按钮 + 搜索框 */}
          <div className="p-3 border-b dark:border-slate-700 space-y-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onNewSession}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {t('bible.newSession')}
              </button>
              <button
                onClick={() => onToggleSessionList()}
                className="md:hidden p-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 搜索框 */}
            {sessions.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('bible.searchSession')}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 会话列表 */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {filteredSessions.length === 0 ? (
              <div className="px-3 py-8 text-center text-slate-400 text-sm">
                {searchQuery ? t('bible.noMatchSession') : t('bible.noHistorySession')}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className={cn(
                      'flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all',
                      currentSessionId === session.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-slate-800 dark:text-slate-200">
                        {session.title || t('bible.unnamedSession')}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(session.updatedAt).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRenameSession(session)
                        }}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all active:scale-95"
                        title={t('bible.renameBtn')}
                      >
                        <Edit className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSession(session)
                        }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all active:scale-95"
                        title={t('bible.deleteSession')}
                      >
                        <Trash2 className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部统计 */}
          {sessions.length > 0 && (
            <div className="p-2 border-t dark:border-slate-700 text-center text-xs text-slate-400">
              {t('bible.sessionCount', { count: sessions.length })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

SessionSelector.displayName = 'SessionSelector'
