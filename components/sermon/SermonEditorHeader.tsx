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

  // Apple status tokens — pearl-capsule style
  const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    DRAFT: {
      label: t('sermon.draft'),
      bg: 'bg-[#fafafc] dark:bg-white/[0.06]',
      text: 'text-[#333] dark:text-[#ccc]',
      dot: 'bg-[#7a7a7a]',
    },
    IN_PROGRESS: {
      label: t('sermon.inProgress'),
      bg: 'bg-[#0066cc]/10 dark:bg-[#0066cc]/20',
      text: 'text-[#0066cc] dark:text-[#2997ff]',
      dot: 'bg-[#0066cc]',
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
    <div className="h-[52px] px-5 flex items-center gap-3 bg-[#f5f5f7]/80 dark:bg-[#272729]/80 backdrop-blur-xl backdrop-saturate-[180%] border-b border-black/[0.04] dark:border-white/[0.06]"
      style={{ fontFamily: "'SF Pro Display', 'SF Pro Text', system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Title — Apple tagline (21px/600) scaled for toolbar density */}
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
          className="flex-1 text-sm font-semibold bg-white dark:bg-white/[0.06] border border-[#e0e0e0] dark:border-white/[0.08] rounded-lg px-3 py-1 focus:outline-none focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20 transition-shadow"
          style={{ letterSpacing: '-0.224px' }}
        />
      ) : (
        <button
          onClick={() => {
            setTitleDraft(currentSermon.title)
            setEditingTitle(true)
          }}
          className="flex-1 text-left text-[15px] font-semibold text-[#1d1d1f] dark:text-white truncate hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-lg px-2 py-1 -ml-2 transition-colors active:scale-[0.98]"
          style={{ letterSpacing: '-0.224px' }}
        >
          {currentSermon.title || t('sermon.untitled')}
        </button>
      )}

      {/* Saving indicator */}
      {isSermonSaving && (
        <span className="text-[10px] text-[#7a7a7a] dark:text-[#999] animate-pulse">{t('sermon.saving')}</span>
      )}

      {/* Style badge — Apple pearl-capsule */}
      <span className="text-[11px] px-2.5 py-1 rounded-[11px] bg-[#fafafc] dark:bg-white/[0.06] text-[#7a7a7a] dark:text-[#999] border border-[#e0e0e0] dark:border-white/[0.08]"
        style={{ letterSpacing: '-0.12px' }}
      >
        {t(`sermon.${currentSermon.style.toLowerCase()}`)}
      </span>

      {/* Status dropdown — Apple pearl-capsule */}
      <div className="relative" ref={statusMenuRef}>
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className={cn(
            'flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-[11px] border transition-all duration-150 active:scale-95',
            currentStatus.bg, currentStatus.text,
            'border-[#e0e0e0] dark:border-white/[0.08] hover:border-[#0066cc]/30'
          )}
          style={{ letterSpacing: '-0.12px' }}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', currentStatus.dot)} />
          {currentStatus.label}
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        {showStatusMenu && (
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-[#f5f5f7]/90 dark:bg-[#272729]/90 backdrop-blur-xl backdrop-saturate-[180%] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-black/[0.04] dark:border-white/[0.06] py-1.5 min-w-[140px]">
            {Object.entries(statusConfig).map(([key, { label, bg, text, dot }]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                style={{ letterSpacing: '-0.12px' }}
              >
                <span className={cn('w-2 h-2 rounded-full', dot)} />
                <span className="text-[#1d1d1f] dark:text-[#ccc]">{label}</span>
                {currentSermon.status === key && <Check className="w-3 h-3 text-[#0066cc] dark:text-[#2997ff] ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}