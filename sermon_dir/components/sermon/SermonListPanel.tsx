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
  MoreHorizontal,
  Trash2,
  Edit3,
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
    try {
      await fetch(`/api/sermon?id=${id}`, { method: 'DELETE' })
      setSermons(sermons.filter(s => s.id !== id))
      if (currentSermon?.id === id) setCurrentSermon(null)
    } catch {
      // 静默处理
    }
    setContextMenu(null)
  }

  const handleDeleteFolder = async (id: string) => {
    if (!confirm(t('sermon.deleteFolderConfirm'))) return
    try {
      await fetch(`/api/sermon/folder?id=${id}`, { method: 'DELETE' })
      setSermonFolders(sermonFolders.filter(f => f.id !== id))
      // 刷新讲章列表（讲章移至根目录）
      const res = await fetch('/api/sermon')
      const data = await res.json()
      setSermons(data.data || [])
    } catch {
      // 静默处理
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
      const data = await res.json()
      setSermonFolders([...sermonFolders, data.data])
    } catch {
      // 静默处理
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

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-muted text-muted-foreground',
      IN_PROGRESS: 'bg-primary/10 text-primary',
      COMPLETED: 'bg-green-500/10 text-green-600 dark:text-green-400',
    }
    return map[status] || map.DRAFT
  }

  return (
    <div className="h-full flex flex-col bg-secondary">
      {/* 搜索栏 */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={sermonSearchQuery}
            onChange={(e) => setSermonSearchQuery(e.target.value)}
            placeholder={t('sermon.searchPlaceholder')}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
          />
        </div>
      </div>

      {/* 文件夹区域 */}
      <div className="px-2 py-2 border-b border-border">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t('sermon.panelList')}</span>
          <button
            onClick={handleCreateFolder}
            className="text-muted-foreground hover:text-foreground"
            title={t('sermon.newFolder')}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 全部讲章 */}
        <button
          onClick={() => setSermonSelectedFolderId(null)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
            !sermonSelectedFolderId ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/80'
          )}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          {t('sermon.allSermons')}
          <span className="ml-auto text-[10px] text-muted-foreground">{sermons.length}</span>
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
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                sermonSelectedFolderId === folder.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/80'
              )}
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu({ type: 'folder', id: folder.id, x: e.clientX, y: e.clientY })
              }}
            >
              {expandedFolders.has(folder.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Folder className="w-3.5 h-3.5" />
              {folder.name}
            </button>
            {expandedFolders.has(folder.id) && folder.children.map(child => (
              <button
                key={child.id}
                onClick={() => setSermonSelectedFolderId(child.id)}
                className={cn(
                  'w-full flex items-center gap-2 pl-7 pr-2 py-1.5 rounded-md text-xs transition-colors',
                  sermonSelectedFolderId === child.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/80'
                )}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ type: 'folder', id: child.id, x: e.clientX, y: e.clientY })
                }}
              >
                <Folder className="w-3 h-3.5" />
                {child.name}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 标签区域 */}
      {allTags.length > 0 && (
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center gap-1 mb-1.5">
            <Tag className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tags</span>
          </div>
          <div className="flex flex-wrap gap-1">
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
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground hover:bg-secondary'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 讲章列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredSermons.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">{t('sermon.noSermons')}</div>
        ) : (
          filteredSermons.map(sermon => (
            <div
              key={sermon.id}
              onClick={() => setCurrentSermon(sermon)}
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu({ type: 'sermon', id: sermon.id, x: e.clientX, y: e.clientY })
              }}
              className={cn(
                'group cursor-pointer rounded-2xl p-6 transition-all duration-300',
                'bg-white dark:bg-slate-900 shadow-sm',
                'border border-slate-200/60 dark:border-slate-800',
                'hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:-translate-y-0.5',
                currentSermon?.id === sermon.id
                  ? 'ring-2 ring-indigo-500/40 border-indigo-200 dark:border-indigo-800'
                  : ''
              )}
            >
              {/* 顶部：元数据层 */}
              <div className="flex justify-between items-center">
                {sermon.verseRefs ? (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/20">
                    {sermon.verseRefs}
                  </span>
                ) : (
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-md font-semibold', statusColor(sermon.status))}>
                    {sermon.status === 'DRAFT' ? t('sermon.draft') : sermon.status === 'IN_PROGRESS' ? t('sermon.inProgress') : t('sermon.completed')}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium">
                  {sermon.sermonDate ? new Date(sermon.sermonDate).toLocaleDateString() : new Date(sermon.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* 中部：核心内容层 */}
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight mt-3 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                {sermon.title || t('sermon.untitled')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {styleLabel(sermon.style)}{sermon.wordCount > 0 ? ` · ${sermon.wordCount}${t('sermon.editorWords')}` : ''}
              </p>

              {/* 底部：操作层 */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-indigo-600 flex items-center gap-1.5 group/btn">
                  {t('sermon.viewDetail')}
                  <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSermon(sermon.id)
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors -mr-2"
                  title={t('sermon.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新建按钮 */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setShowNewDialog(true)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('sermon.newSermon')}
        </button>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-card rounded-lg shadow-lg border border-border py-1 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button
            onClick={() => {
              if (contextMenu.type === 'sermon') handleDeleteSermon(contextMenu.id)
              else handleDeleteFolder(contextMenu.id)
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
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