'use client'

import { useState, useMemo } from 'react'
import { MessageSquare, ChevronDown, Plus, X, Search, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatSession } from '@/store/types'
import { useTranslation } from '@/lib/i18n'
import { formatDateClient } from '@/lib/locale'

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
        className="flex items-center gap-1.5 text-primary dark:text-primary font-semibold select-none hover:bg-primary/5 px-2 py-1 rounded-lg transition-colors"
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
        <div className="fixed inset-0 md:inset-auto md:top-20 md:left-4 md:w-80 glass-panel md:rounded-lg border border-border dark:border-border z-[200] md:max-h-[70vh] overflow-hidden flex flex-col">
          {/* 顶部：新建按钮 + 搜索框 */}
          <div className="p-3 border-b border-border dark:border-border space-y-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onNewSession}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-apple-focus rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('bible.newSession')}
              </button>
              <button
                onClick={() => onToggleSessionList()}
                className="md:hidden p-2.5 text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 搜索框 */}
            {sessions.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('bible.searchSession')}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-secondary dark:bg-apple-tile3 border border-border dark:border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              <div className="px-3 py-8 text-center text-muted-foreground text-sm">
                {searchQuery ? t('bible.noMatchSession') : t('bible.noHistorySession')}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className={cn(
                      'flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all',
                      currentSessionId === session.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border border-transparent'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate text-foreground dark:text-foreground/80">
                        {session.title || t('bible.unnamedSession')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDateClient(new Date(session.updatedAt), {
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
                        className="p-2 hover:bg-primary/10 rounded-lg transition-all active:scale-95"
                        title={t('bible.renameBtn')}
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSession(session)
                        }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all active:scale-95"
                        title={t('bible.deleteSession')}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部统计 */}
          {sessions.length > 0 && (
            <div className="p-2 border-t border-border dark:border-border text-center text-xs text-muted-foreground">
              {t('bible.sessionCount', { count: sessions.length })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

SessionSelector.displayName = 'SessionSelector'
