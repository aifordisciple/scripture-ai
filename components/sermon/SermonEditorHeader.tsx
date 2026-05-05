'use client'

import { useState, useRef, useEffect } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useBreakpoint } from '@/hooks/use-media-query'
import { ChevronDown, ChevronLeft, Check } from 'lucide-react'

export function SermonEditorHeader() {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()
  const { currentSermon, setCurrentSermon, sermons, setSermons, isSermonSaving, setSermonMobileView } = useBibleStore()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

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
      setCurrentSermon({ ...currentSermon, status: prevStatus })
    }
  }

  const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    DRAFT: {
      label: t('sermon.draft'),
      bg: 'bg-secondary dark:bg-card/[0.06]',
      text: 'text-apple-inkMuted80 dark:text-muted-foreground',
      dot: 'bg-muted-foreground',
    },
    IN_PROGRESS: {
      label: t('sermon.inProgress'),
      bg: 'bg-primary/10 dark:bg-primary/20',
      text: 'text-primary dark:text-primary',
      dot: 'bg-primary',
    },
    COMPLETED: {
      label: t('sermon.completed'),
      bg: 'bg-green-500/10 dark:bg-green-500/20',
      text: 'text-green-600 dark:text-green-400',
      dot: 'bg-green-500',
    },
  }

  const currentStatus = statusConfig[currentSermon.status] || statusConfig.DRAFT

  return (
    <div className={cn(
      'flex items-center border-b border-black/[0.04] dark:border-white/[0.06]',
      'bg-secondary/80 dark:bg-card/80 backdrop-blur-xl',
      isMd ? 'h-[52px] px-5 gap-3' : 'h-[48px] px-3 gap-2'
    )}
      style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Mobile back button */}
      {!isMd && (
        <button
          onClick={() => setSermonMobileView('list')}
          className="w-11 h-11 flex items-center justify-center rounded-lg -ml-1 text-foreground dark:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition-all flex-shrink-0"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

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
          className="flex-1 text-sm font-semibold bg-white dark:bg-white/[0.06] border border-border dark:border-white/[0.08] rounded-lg px-3 py-1 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-shadow min-w-0"
          style={{ letterSpacing: '-0.224px' }}
        />
      ) : (
        <button
          onClick={() => {
            setTitleDraft(currentSermon.title)
            setEditingTitle(true)
          }}
          className={cn(
            'flex-1 text-left font-semibold text-foreground dark:text-foreground truncate hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-lg transition-colors active:scale-[0.98] min-w-0',
            isMd ? 'text-[15px] px-2 py-1 -ml-2' : 'text-sm px-1 py-1'
          )}
          style={{ letterSpacing: '-0.224px' }}
        >
          {currentSermon.title || t('sermon.untitled')}
        </button>
      )}

      {/* Saving indicator */}
      {isSermonSaving && (
        <span className="text-[10px] text-muted-foreground dark:text-muted-foreground animate-pulse flex-shrink-0">{t('sermon.saving')}</span>
      )}

      {/* Style badge — hidden on mobile to save space */}
      {isMd && (
        <span className="text-[11px] px-2.5 py-1 rounded-[11px] bg-secondary dark:bg-card/[0.06] text-muted-foreground dark:text-muted-foreground border border-border dark:border-white/[0.08] flex-shrink-0"
          style={{ letterSpacing: '-0.12px' }}
        >
          {t(`sermon.${currentSermon.style.toLowerCase()}`)}
        </span>
      )}

      {/* Status dropdown */}
      <div className="relative flex-shrink-0" ref={statusMenuRef}>
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className={cn(
            'flex items-center gap-1.5 text-[11px] rounded-[11px] border transition-all duration-150 active:scale-95',
            isMd ? 'px-2.5 py-1' : 'px-2 py-1.5 min-h-[44px]',
            currentStatus.bg, currentStatus.text,
            'border-border dark:border-white/[0.08] hover:border-primary/30'
          )}
          style={{ letterSpacing: '-0.12px' }}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', currentStatus.dot)} />
          {currentStatus.label}
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        {showStatusMenu && (
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-secondary/90 dark:bg-card/90 backdrop-blur-xl rounded-lg border border-black/[0.04] dark:border-white/[0.06] py-1.5 min-w-[140px]">
            {Object.entries(statusConfig).map(([key, { label, bg, text, dot }]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                style={{ letterSpacing: '-0.12px' }}
              >
                <span className={cn('w-2 h-2 rounded-full', dot)} />
                <span className="text-foreground dark:text-muted-foreground">{label}</span>
                {currentSermon.status === key && <Check className="w-3 h-3 text-primary dark:text-primary ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}