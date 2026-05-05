'use client'

import { useState, useMemo, useEffect } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
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

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [contextMenu])

  // 构建文件夹树
  const folderTree = useMemo(() => {
    const roots = sermonFolders.filter(f => !f.parentId)
    const children = sermonFolders.filter(f => f.parentId)
    return roots.map(root => ({
      ...root,
      children: children.filter(c => c.parentId === root.id),
    }))
  }, [sermonFolders])

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    sermons.forEach(s => s.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [sermons])

  // 筛选讲章
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
      // Revert on failure
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
      // Refresh sermons (moved to root)
      const sermonsRes = await fetch('/api/sermon')
      const data = await sermonsRes.json()
      setSermons(data.data || [])
    } catch {
      // Revert on failure
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
      // User can retry - no state to revert since folder wasn't created
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

  const isSelected = (id: string) => currentSermon?.id === id

  return (
    <div className="h-full flex flex-col bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl">
      {/* 搜索栏 */}
      <div className="px-3 py-2 border-b border-black/5 dark:border-white/10">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={sermonSearchQuery}
            onChange={(e) => setSermonSearchQuery(e.target.value)}
            placeholder={t('sermon.searchPlaceholder')}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500/30"
          />
        </div>
      </div>

      {/* 文件夹区域 */}
      <div className="px-3 py-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center justify-between px-2.5 mb-1">
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('sermon.panelList')}</span>
          <button
            onClick={handleCreateFolder}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title={t('sermon.newFolder')}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 全部讲章 */}
        <button
          onClick={() => setSermonSelectedFolderId(null)}
          className={cn(
            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
            !sermonSelectedFolderId
              ? 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
          )}
        >
          <FolderOpen className="w-4 h-4" />
          {t('sermon.allSermons')}
          <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">{sermons.length}</span>
        </button>

        {/* 文件夹树 */}
        {folderTree.map(folder => (
          <div key={folder.id}>
            <button
              onClick={() => {
                toggleFolder(folder.id)
                setSermonSelectedFolderId(folder.id)
              }}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                sermonSelectedFolderId === folder.id
                  ? 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
              )}
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu({ type: 'folder', id: folder.id, x: e.clientX, y: e.clientY })
              }}
            >
              {expandedFolders.has(folder.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Folder className="w-4 h-4" />
              {folder.name}
            </button>
            {expandedFolders.has(folder.id) && folder.children.map(child => (
              <button
                key={child.id}
                onClick={() => setSermonSelectedFolderId(child.id)}
                className={cn(
                  'w-full flex items-center gap-2 pl-8 pr-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                  sermonSelectedFolderId === child.id
                    ? 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                )}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ type: 'folder', id: child.id, x: e.clientX, y: e.clientY })
                }}
              >
                <Folder className="w-4 h-4" />
                {child.name}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 标签区域 */}
      {allTags.length > 0 && (
        <div className="px-3 py-2 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-1 mb-1.5 px-2.5">
            <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tags</span>
          </div>
          <div className="flex flex-wrap gap-1 px-2.5">
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
                  'text-[10px] px-2 py-0.5 rounded-full transition-colors',
                  sermonSelectedTags.includes(tag)
                    ? 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 讲章列表 — macOS flat list style */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filteredSermons.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">{t('sermon.noSermons')}</div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {filteredSermons.map(sermon => {
              const selected = isSelected(sermon.id)
              return (
                <div
                  key={sermon.id}
                  onClick={() => setCurrentSermon(sermon)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setContextMenu({ type: 'sermon', id: sermon.id, x: e.clientX, y: e.clientY })
                  }}
                  className={cn(
                    'group cursor-pointer px-3 py-2.5 transition-colors rounded-lg mx-0.5',
                    selected
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  )}
                >
                  {/* 标题行 */}
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      'text-sm font-medium truncate flex-1',
                      selected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                    )}>
                      {sermon.title || t('sermon.untitled')}
                    </h3>
                    <span className={cn(
                      'text-[10px] shrink-0',
                      selected ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
                    )}>
                      {sermon.sermonDate ? new Date(sermon.sermonDate).toLocaleDateString() : new Date(sermon.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* 副标题行 */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {sermon.verseRefs ? (
                      <span className={cn(
                        'text-[10px] font-medium',
                        selected ? 'text-white/80' : 'text-indigo-600 dark:text-indigo-400'
                      )}>
                        {sermon.verseRefs}
                      </span>
                    ) : (
                      <span className={cn(
                        'text-[10px] font-medium',
                        selected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                      )}>
                        {sermon.status === 'DRAFT' ? t('sermon.draft') : sermon.status === 'IN_PROGRESS' ? t('sermon.inProgress') : t('sermon.completed')}
                      </span>
                    )}
                    <span className={cn(
                      'text-[10px]',
                      selected ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'
                    )}>
                      {styleLabel(sermon.style)}{sermon.wordCount > 0 ? ` · ${sermon.wordCount}${t('sermon.editorWords')}` : ''}
                    </span>
                    <div className="flex-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSermon(sermon.id)
                      }}
                      className={cn(
                        'p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100',
                        selected
                          ? 'text-white/60 hover:text-white hover:bg-white/10'
                          : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                      )}
                      title={t('sermon.delete')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 新建按钮 */}
      <div className="px-3 py-2 border-t border-black/5 dark:border-white/10">
        <button
          onClick={() => setShowNewDialog(true)}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('sermon.newSermon')}
        </button>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-lg shadow-lg border border-black/5 dark:border-white/10 py-1 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button
            onClick={() => {
              if (contextMenu.type === 'sermon') handleDeleteSermon(contextMenu.id)
              else handleDeleteFolder(contextMenu.id)
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Trash2 className="w-3 h-3" />
            {t('sermon.delete')}
          </button>
        </div>
      )}

      {/* 新建讲章对话框 */}
      <NewSermonDialog open={showNewDialog} onClose={() => setShowNewDialog(false)} />
    </div>
  )
}

// FolderPlus icon (lucide doesn't have it, use Plus with folder)
function FolderPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10v6" /><path d="M9 13h6" />
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  )
}
