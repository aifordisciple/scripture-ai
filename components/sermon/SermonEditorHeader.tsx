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
      const updated = { ...currentSermon, title: titleDraft.trim() }
      setCurrentSermon(updated)
      try {
        await fetch('/api/sermon', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentSermon.id, title: titleDraft.trim() }),
        })
        setSermons(sermons.map(s => s.id === currentSermon.id ? updated : s))
      } catch {
        // 静默处理
      }
    }
  }

  const handleStatusChange = async (status: string) => {
    setShowStatusMenu(false)
    const updated = { ...currentSermon, status }
    setCurrentSermon(updated)
    try {
      await fetch('/api/sermon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentSermon.id, status }),
      })
      setSermons(sermons.map(s => s.id === currentSermon.id ? updated : s))
    } catch {
      // 静默处理
    }
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    DRAFT: { label: t('sermon.draft'), color: 'bg-muted text-muted-foreground' },
    IN_PROGRESS: { label: t('sermon.inProgress'), color: 'bg-primary/10 text-primary' },
    COMPLETED: { label: t('sermon.completed'), color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  }

  const currentStatus = statusConfig[currentSermon.status] || statusConfig.DRAFT

  return (
    <div className="border-b border-border px-4 py-2 flex items-center gap-3 bg-secondary">
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
          className="flex-1 text-sm font-medium bg-card border border-border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      ) : (
        <button
          onClick={() => {
            setTitleDraft(currentSermon.title)
            setEditingTitle(true)
          }}
          className="flex-1 text-left text-sm font-medium text-foreground/90 truncate hover:text-foreground transition-colors"
        >
          {currentSermon.title || t('sermon.untitled')}
        </button>
      )}

      {/* Saving indicator */}
      {isSermonSaving && (
        <span className="text-[10px] text-muted-foreground animate-pulse">{t('sermon.saving')}</span>
      )}

      {/* Style badge */}
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        {t(`sermon.${currentSermon.style.toLowerCase()}`)}
      </span>

      {/* Status dropdown */}
      <div className="relative" ref={statusMenuRef}>
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className={cn('flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full', currentStatus.color)}
        >
          {currentStatus.label}
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        {showStatusMenu && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-card rounded-lg shadow-lg border border-border py-1 min-w-[120px]">
            {Object.entries(statusConfig).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] hover:bg-secondary transition-colors"
              >
                <span className={cn('w-2 h-2 rounded-full', color.split(' ')[0])} />
                <span className="text-foreground/90">{label}</span>
                {currentSermon.status === key && <Check className="w-3 h-3 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}