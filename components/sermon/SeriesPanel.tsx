'use client'

import React, { useMemo, useState } from 'react'
import { FolderOpen, Plus, Trash2, ChevronRight, X } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import type { SermonSeries } from '@/store/types'

/**
 * SeriesPanel — 讲章系列管理面板
 *
 * Features:
 * - List of sermon series with sermon count
 * - Create new series
 * - Add/remove sermons from series
 * - Delete series
 */
export function SeriesPanel() {
  const { locale } = useTranslation()
  const isZh = locale !== 'en'

  const {
    sermonSeries,
    sermons,
    addSermonSeries,
    deleteSermonSeries,
  } = useBibleStore()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const handleCreate = () => {
    if (!newName.trim()) return
    addSermonSeries({
      name: newName.trim(),
      description: newDesc.trim(),
      sermonIds: [],
    })
    setNewName('')
    setNewDesc('')
    setShowCreate(false)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <FolderOpen size={12} className="text-amber-500" />
          <span className="text-xs font-medium text-foreground">
            {isZh ? '讲章系列' : 'Sermon Series'}
          </span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1 rounded text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          title={isZh ? '新建系列' : 'New series'}
        >
          {showCreate ? <X size={12} /> : <Plus size={12} />}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="px-3 py-2 border-b border-border bg-amber-50/30 dark:bg-amber-900/5 space-y-1.5">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={isZh ? '系列名称' : 'Series name'}
            className="w-full px-2 py-1 rounded text-xs bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder={isZh ? '系列描述（可选）' : 'Description (optional)'}
            className="w-full px-2 py-1 rounded text-xs bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="w-full px-2 py-1 rounded text-[11px] bg-amber-500 text-white disabled:opacity-40 hover:bg-amber-600 transition-colors"
          >
            {isZh ? '创建系列' : 'Create Series'}
          </button>
        </div>
      )}

      {/* Series list */}
      <div className="flex-1 overflow-y-auto">
        {sermonSeries.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {isZh ? '暂无讲章系列' : 'No sermon series yet'}
          </div>
        ) : (
          sermonSeries.map(series => (
            <div
              key={series.id}
              className="group flex items-center gap-2 px-3 py-2 border-b border-border/50 hover:bg-accent/20 transition-colors cursor-pointer"
            >
              <FolderOpen size={14} className="text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{series.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {series.sermonIds.length} {isZh ? '篇讲章' : 'sermons'}
                  {series.description && ` · ${series.description}`}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSermonSeries(series.id)
                }}
                className="p-1 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={11} />
              </button>
              <ChevronRight size={12} className="text-muted-foreground/40 shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
