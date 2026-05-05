'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useBreakpoint, useTouchDevice } from '@/hooks/use-media-query'
import { useLongPress } from '@/hooks/use-long-press'
import {
  Search,
  Plus,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  Trash2,
  Tag,
} from 'lucide-react'
import { NewSermonDialog } from './NewSermonDialog'

export function SermonListPanel() {
  const { t } = useTranslation()
  const { isMd } = useBreakpoint()
  const isTouch = useTouchDevice()
  const {
    sermons,
    sermonFolders,
    setSermonFolders,
    currentSermon,
    setCurrentSermon,
    sermonSearchQuery,
    setSermonSearchQuery,
    sermonSelectedFolderId,
    setSermonSelectedFolderId,
    sermonSelectedTags,
    setSermonSelectedTags,
    setSermons,
  } = useBibleStore()

  const [showNewDialog, setShowNewDialog] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ type: 'sermon' | 'folder'; id: string; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!contextMenu) return
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [contextMenu])

  const folderTree = useMemo(() => {
    const roots = sermonFolders.filter(f => !f.parentId)
    const children = sermonFolders.filter(f => f.parentId)
    return roots.map(root => ({
      ...root,
      children: children.filter(c => c.parentId === root.id),
    }))
  }, [sermonFolders])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    sermons.forEach(s => s.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [sermons])

  const filteredSermons = useMemo(() => {
    let result = sermons
    if (sermonSearchQuery) {
      const q = sermonSearchQuery.toLowerCase()
      result = result.filter(s => s.title.toLowerCase().includes(q))
    }
    if (sermonSelectedFolderId) {
      result = result.filter(s => s.folderId === sermonSelectedFolderId)
    }
    if (sermonSelectedTags.length > 0) {
      result = result.filter(s => sermonSelectedTags.every(tag => s.tags.includes(tag)))
    }
    return result
  }, [sermons, sermonSearchQuery, sermonSelectedFolderId, sermonSelectedTags])

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteSermon = async (id: string) => {
    if (!confirm(t('sermon.deleteConfirm'))) return
    const prevSermons = sermons
    const prevCurrent = currentSermon
    try {
      const res = await fetch(`/api/sermon?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setSermons(sermons.filter(s => s.id !== id))
      if (currentSermon?.id === id) setCurrentSermon(null)
    } catch {
      setSermons(prevSermons)
      if (prevCurrent?.id === id) setCurrentSermon(prevCurrent)
    }
    setContextMenu(null)
  }

  const handleDeleteFolder = async (id: string) => {
    if (!confirm(t('sermon.deleteFolderConfirm'))) return
    const prevFolders = sermonFolders
    try {
      const res = await fetch(`/api/sermon/folder?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete folder failed')
      setSermonFolders(sermonFolders.filter(f => f.id !== id))
      const sermonsRes = await fetch('/api/sermon')
      const data = await sermonsRes.json()
      setSermons(data.data || [])
    } catch {
      setSermonFolders(prevFolders)
    }
    setContextMenu(null)
  }

  const handleCreateFolder = async () => {
    const name = prompt(t('sermon.newFolder'))
    if (!name) return
    try {
      const res = await fetch('/api/sermon/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Create folder failed')
      const data = await res.json()
      setSermonFolders([...sermonFolders, data.data])
    } catch {
      // User can retry
    }
  }

  const styleLabel = (style: string) => {
    const map: Record<string, string> = {
      EXPOSITORY: t('sermon.expository'),
      TOPICAL: t('sermon.topical'),
      NARRATIVE: t('sermon.narrative'),
      FREE: t('sermon.free'),
    }
    return map[style] || style
  }

  const showContextMenu = useCallback((type: 'sermon' | 'folder', id: string, x: number, y: number) => {
    setContextMenu({
      type,
      id,
      x: Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 400) - 160),
      y: Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 80),
    })
  }, [])

  // Touch target sizing
  const folderItemPad = isMd ? 'px-2.5 py-1.5' : 'px-3 py-2.5'
  const tagItemPad = isMd ? 'px-3 py-1' : 'px-3.5 py-1.5'

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1d1d1f]">
      {/* Search */}
      <div className={cn('px-4', isMd ? 'pt-4 pb-3' : 'pt-3 pb-2')}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
          <input
            type="text"
            value={sermonSearchQuery}
            onChange={(e) => setSermonSearchQuery(e.target.value)}
            placeholder={t('sermon.searchPlaceholder')}
            className={cn(
              'w-full pl-9 pr-4 text-sm rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-[#f5f5f7] dark:bg-white/[0.06] placeholder:text-[#7a7a7a] focus:outline-none focus:border-[#0066cc]/40 focus:ring-2 focus:ring-[#0066cc]/20 transition-shadow',
              isMd ? 'py-2' : 'py-2.5'
            )}
          />
        </div>
      </div>

      {/* Folder section */}
      <div className="px-3 pb-2 border-b border-[#f0f0f0] dark:border-white/[0.06]">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-[10px] font-semibold text-[#7a7a7a] dark:text-[#999] uppercase tracking-wider"
            style={{ letterSpacing: '-0.08px' }}
          >
            {t('sermon.panelList')}
          </span>
          <button
            onClick={handleCreateFolder}
            className="text-[#7a7a7a] dark:text-[#999] hover:text-[#1d1d1f] dark:hover:text-white transition-colors p-1"
            title={t('sermon.newFolder')}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setSermonSelectedFolderId(null)}
          className={cn(
            'w-full flex items-center gap-2 rounded-lg text-xs transition-all duration-150',
            folderItemPad,
            !sermonSelectedFolderId
              ? 'bg-[#0066cc]/10 text-[#0066cc] font-semibold'
              : 'text-[#7a7a7a] dark:text-[#999] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
          )}
        >
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
          {t('sermon.allSermons')}
          <span className="ml-auto text-[10px] text-[#7a7a7a] dark:text-[#999]">{sermons.length}</span>
        </button>

        {folderTree.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            isSelected={sermonSelectedFolderId === folder.id}
            isExpanded={expandedFolders.has(folder.id)}
            isMd={isMd}
            onToggle={() => { toggleFolder(folder.id); setSermonSelectedFolderId(folder.id) }}
            onShowContextMenu={(x, y) => showContextMenu('folder', folder.id, x, y)}
          >
            {expandedFolders.has(folder.id) && folder.children.map(child => (
              <FolderChildItem
                key={child.id}
                folder={child}
                isSelected={sermonSelectedFolderId === child.id}
                isMd={isMd}
                onSelect={() => setSermonSelectedFolderId(child.id)}
                onShowContextMenu={(x, y) => showContextMenu('folder', child.id, x, y)}
              />
            ))}
          </FolderItem>
        ))}
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="px-4 py-2 border-b border-[#f0f0f0] dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-2">
            <Tag className="w-3 h-3 text-[#7a7a7a]" />
            <span className="text-[10px] font-semibold text-[#7a7a7a] uppercase tracking-wider"
              style={{ letterSpacing: '-0.08px' }}
            >
              Tags
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setSermonSelectedTags(
                    sermonSelectedTags.includes(tag)
                      ? sermonSelectedTags.filter(t => t !== tag)
                      : [...sermonSelectedTags, tag]
                  )
                }}
                className={cn(
                  'text-xs rounded-full border transition-all duration-150',
                  tagItemPad,
                  sermonSelectedTags.includes(tag)
                    ? 'border-[#0066cc] bg-[#0066cc]/10 text-[#0066cc] font-medium'
                    : 'border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.06] text-[#7a7a7a] dark:text-[#999] hover:border-[#0066cc]/40'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sermon list */}
      <div className={cn('flex-1 overflow-y-auto', isMd ? 'px-3 py-2 space-y-2' : 'px-2 py-1.5 space-y-1.5')}>
        {filteredSermons.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#7a7a7a]">{t('sermon.noSermons')}</div>
        ) : (
          filteredSermons.map(sermon => (
            <SermonCard
              key={sermon.id}
              sermon={sermon}
              selected={currentSermon?.id === sermon.id}
              isMd={isMd}
              isTouch={isTouch}
              onSelect={() => setCurrentSermon(sermon)}
              onDelete={() => handleDeleteSermon(sermon.id)}
              onShowContextMenu={(x, y) => showContextMenu('sermon', sermon.id, x, y)}
            />
          ))
        )}
      </div>

      {/* New sermon CTA */}
      <div className="px-4 py-3 border-t border-[#f0f0f0] dark:border-white/[0.06]">
        <button
          onClick={() => setShowNewDialog(true)}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-sm font-normal transition-colors active:scale-95',
            isMd ? 'py-2.5' : 'py-3'
          )}
        >
          <Plus className="w-4 h-4" />
          {t('sermon.newSermon')}
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#f5f5f7]/90 dark:bg-[#272729]/90 backdrop-blur-xl backdrop-saturate-[180%] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-black/[0.04] dark:border-white/[0.06] py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button
            onClick={() => {
              if (contextMenu.type === 'sermon') handleDeleteSermon(contextMenu.id)
              else handleDeleteFolder(contextMenu.id)
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            {t('sermon.delete')}
          </button>
        </div>
      )}

      <NewSermonDialog open={showNewDialog} onClose={() => setShowNewDialog(false)} />
    </div>
  )
}

/* ── Sub-components (avoid hooks-in-loops) ── */

function FolderItem({ folder, isSelected, isExpanded, isMd, onToggle, onShowContextMenu, children }: {
  folder: { id: string; name: string }
  isSelected: boolean
  isExpanded: boolean
  isMd: boolean
  onToggle: () => void
  onShowContextMenu: (x: number, y: number) => void
  children: React.ReactNode
}) {
  const longPress = useLongPress((e) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY
    onShowContextMenu(clientX, clientY)
  })

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 rounded-lg text-xs transition-all duration-150',
          isMd ? 'px-2.5 py-1.5' : 'px-3 py-2.5',
          isSelected
            ? 'bg-[#0066cc]/10 text-[#0066cc] font-semibold'
            : 'text-[#7a7a7a] dark:text-[#999] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
        )}
        onContextMenu={(e) => { e.preventDefault(); onShowContextMenu(e.clientX, e.clientY) }}
        {...longPress}
      >
        {isExpanded ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
        <Folder className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{folder.name}</span>
      </button>
      {children}
    </div>
  )
}

function FolderChildItem({ folder, isSelected, isMd, onSelect, onShowContextMenu }: {
  folder: { id: string; name: string }
  isSelected: boolean
  isMd: boolean
  onSelect: () => void
  onShowContextMenu: (x: number, y: number) => void
}) {
  const longPress = useLongPress((e) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY
    onShowContextMenu(clientX, clientY)
  })

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-2 rounded-lg text-xs transition-all duration-150',
        isMd ? 'pl-8 pr-2.5 py-1.5' : 'pl-8 pr-3 py-2.5',
        isSelected
          ? 'bg-[#0066cc]/10 text-[#0066cc] font-semibold'
          : 'text-[#7a7a7a] dark:text-[#999] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
      )}
      onContextMenu={(e) => { e.preventDefault(); onShowContextMenu(e.clientX, e.clientY) }}
      {...longPress}
    >
      <Folder className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{folder.name}</span>
    </button>
  )
}

function SermonCard({ sermon, selected, isMd, isTouch, onSelect, onDelete, onShowContextMenu }: {
  sermon: { id: string; title: string; verseRefs?: string; status: string; style: string; wordCount: number; sermonDate?: string; createdAt: string }
  selected: boolean
  isMd: boolean
  isTouch: boolean
  onSelect: () => void
  onDelete: () => void
  onShowContextMenu: (x: number, y: number) => void
}) {
  const { t } = useTranslation()
  const longPress = useLongPress((e) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY
    onShowContextMenu(clientX, clientY)
  })

  const styleLabel = (style: string) => {
    const map: Record<string, string> = {
      EXPOSITORY: t('sermon.expository'),
      TOPICAL: t('sermon.topical'),
      NARRATIVE: t('sermon.narrative'),
      FREE: t('sermon.free'),
    }
    return map[style] || style
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group cursor-pointer transition-all duration-200',
        isMd ? 'rounded-[18px] p-4' : 'rounded-xl p-3',
        selected
          ? 'bg-[#0066cc] text-white shadow-[0_2px_8px_rgba(0,102,204,0.2)]'
          : 'bg-white dark:bg-[#2a2a2c] border border-[#e0e0e0] dark:border-white/[0.06] hover:border-[#0066cc]/30 hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
      )}
      onContextMenu={(e) => { e.preventDefault(); onShowContextMenu(e.clientX, e.clientY) }}
      {...longPress}
    >
      <h3 className={cn(
        'font-semibold truncate leading-tight',
        isMd ? 'text-sm' : 'text-[13px]',
        selected ? 'text-white' : 'text-[#1d1d1f] dark:text-white'
      )}
        style={{ letterSpacing: '-0.224px' }}
      >
        {sermon.title || t('sermon.untitled')}
      </h3>

      <div className="flex items-center gap-2 mt-1.5">
        {sermon.verseRefs ? (
          <span className={cn(
            'text-xs font-medium',
            selected ? 'text-white/80' : 'text-[#0066cc] dark:text-[#2997ff]'
          )}>
            {sermon.verseRefs}
          </span>
        ) : (
          <span className={cn(
            'text-xs',
            selected ? 'text-white/70' : 'text-[#7a7a7a] dark:text-[#999]'
          )}>
            {sermon.status === 'DRAFT' ? t('sermon.draft') : sermon.status === 'IN_PROGRESS' ? t('sermon.inProgress') : t('sermon.completed')}
          </span>
        )}
        <span className={cn(
          'text-[10px]',
          selected ? 'text-white/50' : 'text-[#7a7a7a] dark:text-[#999]'
        )}>
          {styleLabel(sermon.style)}{sermon.wordCount > 0 ? ` · ${sermon.wordCount}${t('sermon.editorWords')}` : ''}
        </span>
        <div className="flex-1" />
        <span className={cn(
          'text-[10px]',
          selected ? 'text-white/60' : 'text-[#7a7a7a] dark:text-[#999]'
        )}>
          {sermon.sermonDate ? new Date(sermon.sermonDate).toLocaleDateString() : new Date(sermon.createdAt).toLocaleDateString()}
        </span>
        {/* Delete button — always visible on touch, hover-only on mouse */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className={cn(
            'rounded-lg transition-all duration-150 active:scale-95',
            isTouch
              ? cn('p-2.5', selected ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-[#7a7a7a] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30')
              : cn('p-1', selected ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-[#7a7a7a] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100')
          )}
          title={t('sermon.delete')}
        >
          <Trash2 className={isTouch ? 'w-4 h-4' : 'w-3 h-3'} />
        </button>
      </div>
    </div>
  )
}

function FolderPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10v6" /><path d="M9 13h6" />
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  )
}