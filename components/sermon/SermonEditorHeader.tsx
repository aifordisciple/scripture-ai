'use client'

import { useState, useRef, useEffect } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

export function SermonEditorHeader() {
  const { t } = useTranslation()
  const { currentSermon, setCurrentSermon, sermons, setSermons, isSermonSaving } = useBibleStore()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  // Use ref to avoid stale closure on sermons
  const sermonsRef = useRef(sermons)
  sermonsRef.current = sermons

  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus()
  }, [editingTitle])

  useEffect(() => {
    if (!showStatusMenu) return
    const handleClick = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showStatusMenu])

  if (!currentSermon) return null

  const handleTitleSave = async () => {
    setEditingTitle(false)
    if (titleDraft.trim() && titleDraft !== currentSermon.title) {
      const prevTitle = currentSermon.title
      const updated = { ...currentSermon, title: titleDraft.trim() }
      setCurrentSermon(updated)
      try {
        await fetch('/api/sermon', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentSermon.id, title: titleDraft.trim() }),
        })
        setSermons(sermonsRef.current.map(s => s.id === currentSermon.id ? updated : s))
      } catch {
        // Revert on failure
        setCurrentSermon({ ...currentSermon, title: prevTitle })
      }
    }
  }

  const handleStatusChange = async (status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED') => {
    setShowStatusMenu(false)
    const prevStatus = currentSermon.status
    const updated = { ...currentSermon, status }
    setCurrentSermon(updated)
    try {
      await fetch('/api/sermon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentSermon.id, status }),
      })
      setSermons(sermonsRef.current.map(s => s.id === currentSermon.id ? updated : s))
    } catch {
      // Revert on failure
      setCurrentSermon({ ...currentSermon, status: prevStatus })
    }
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    DRAFT: { label: t('sermon.draft'), color: 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300' },
    IN_PROGRESS: { label: t('sermon.inProgress'), color: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' },
    COMPLETED: { label: t('sermon.completed'), color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  }

  const currentStatus = statusConfig[currentSermon.status] || statusConfig.DRAFT

  return (
    <div className="border-b border-black/5 dark:border-white/10 px-4 py-1.5 flex items-center gap-3 bg-transparent">
      {/* Title */}
      {editingTitle ? (
        <input
          ref={titleRef}
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTitleSave()
            if (e.key === 'Escape') { setEditingTitle(false) }
          }}
          className="flex-1 text-sm font-medium bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/30"
        />
      ) : (
        <button
          onClick={() => {
            setTitleDraft(currentSermon.title)
            setEditingTitle(true)
          }}
          className="flex-1 text-left text-sm font-medium text-slate-900 dark:text-slate-100 truncate hover:bg-black/5 dark:hover:bg-white/5 rounded-md px-2 py-0.5 -ml-2 transition-colors"
        >
          {currentSermon.title || t('sermon.untitled')}
        </button>
      )}

      {/* Saving indicator */}
      {isSermonSaving && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500 animate-pulse">{t('sermon.saving')}</span>
      )}

      {/* Style badge */}
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400">
        {t(`sermon.${currentSermon.style.toLowerCase()}`)}
      </span>

      {/* Status dropdown */}
      <div className="relative" ref={statusMenuRef}>
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className={cn('flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors', currentStatus.color)}
        >
          {currentStatus.label}
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        {showStatusMenu && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-lg shadow-lg border border-black/5 dark:border-white/10 py-1 min-w-[120px]">
            {Object.entries(statusConfig).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className={cn('w-2 h-2 rounded-full', color.split(' ')[0])} />
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
                {currentSermon.status === key && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400 ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
