'use client'

import React, { useMemo } from 'react'
import { Clock, RotateCcw, Trash2, Bot, Pencil, Sparkles, ChevronDown, ChevronUp, GitBranch } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import type { SectionVersion, SectionVersionSource } from '@/store/types'

/** Source icon mapping */
function SourceIcon({ source }: { source: SectionVersionSource }) {
  switch (source) {
    case 'ai-generated': return <Bot size={11} className="text-blue-500" />
    case 'ai-expanded': return <Sparkles size={11} className="text-purple-500" />
    case 'ai-adjusted': return <Sparkles size={11} className="text-indigo-500" />
    case 'manual-edit': return <Pencil size={11} className="text-green-500" />
    case 'manual-restore': return <RotateCcw size={11} className="text-amber-500" />
    default: return <GitBranch size={11} className="text-muted-foreground" />
  }
}

/** Source label (i18n) */
function sourceLabel(source: SectionVersionSource, isZh: boolean): string {
  const map: Record<SectionVersionSource, { zh: string; en: string }> = {
    'ai-generated': { zh: 'AI生成', en: 'AI Generated' },
    'ai-expanded': { zh: 'AI扩展', en: 'AI Expanded' },
    'ai-adjusted': { zh: 'AI调整', en: 'AI Adjusted' },
    'manual-edit': { zh: '手动编辑', en: 'Manual Edit' },
    'manual-restore': { zh: '恢复版本', en: 'Restored' },
  }
  return isZh ? map[source].zh : map[source].en
}

/** Format relative time */
function formatTime(timestamp: number, isZh: boolean): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return isZh ? '刚刚' : 'Just now'
  if (minutes < 60) return isZh ? `${minutes}分钟前` : `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return isZh ? `${hours}小时前` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  return isZh ? `${days}天前` : `${days}d ago`
}

interface VersionHistoryPanelProps {
  /** The section ID to show versions for */
  sectionId: string | null
  /** Called when user restores a version */
  onRestore?: (version: SectionVersion) => void
}

/**
 * VersionHistoryPanel — 段落级版本历史面板
 *
 * Features:
 * - Version timeline with source icons and timestamps
 * - Content preview for each version
 * - Restore and delete actions
 * - Active version indicator
 * - Word count and source labels
 */
export function VersionHistoryPanel({ sectionId, onRestore }: VersionHistoryPanelProps) {
  const { locale } = useTranslation()
  const isZh = locale !== 'en'

  const {
    sectionVersions,
    activeVersionId,
    restoreSectionVersion,
    deleteSectionVersion,
    setActiveVersionId,
  } = useBibleStore()

  const versions = useMemo(
    () => sectionVersions.filter(v => v.sectionId === sectionId).sort((a, b) => b.createdAt - a.createdAt),
    [sectionVersions, sectionId]
  )

  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  if (!sectionId) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
        {isZh ? '请选择一个段落查看版本历史' : 'Select a section to view version history'}
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
        {isZh ? '该段落暂无版本记录' : 'No version history for this section'}
      </div>
    )
  }

  const handleRestore = (version: SectionVersion) => {
    restoreSectionVersion(version.id)
    onRestore?.(version)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-foreground">
          {isZh ? '版本历史' : 'Version History'}
          <span className="ml-1.5 text-muted-foreground">
            ({versions.length} {isZh ? '个版本' : 'versions'})
          </span>
        </span>
      </div>

      {/* Version timeline */}
      <div className="flex-1 overflow-y-auto">
        {versions.map((version, idx) => {
          const isExpanded = expandedId === version.id
          const isActive = activeVersionId === version.id
          const isLatest = idx === 0

          return (
            <div
              key={version.id}
              className={`
                group border-b border-border/50 transition-colors
                ${isActive ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-accent/20'}
              `}
            >
              {/* Version header */}
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : version.id)}
              >
                {/* Timeline dot */}
                <div className="relative shrink-0">
                  <div className={`w-2 h-2 rounded-full ${isLatest ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                  {idx < versions.length - 1 && (
                    <div className="absolute top-2 left-[3px] w-[2px] h-6 bg-border" />
                  )}
                </div>

                {/* Source icon */}
                <SourceIcon source={version.source} />

                {/* Version info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground truncate">
                      {version.label || sourceLabel(version.source, isZh)}
                    </span>
                    {isLatest && (
                      <span className="px-1 py-0 rounded text-[9px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                        {isZh ? '最新' : 'Latest'}
                      </span>
                    )}
                    {isActive && (
                      <span className="px-1 py-0 rounded text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                        {isZh ? '当前' : 'Active'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatTime(version.createdAt, isZh)} · {version.wordCount}{isZh ? '字' : ' words'}
                  </div>
                </div>

                {/* Expand toggle */}
                <div className="shrink-0">
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </div>

              {/* Expanded content preview */}
              {isExpanded && (
                <div className="px-3 pb-2 pl-9">
                  <div className="text-xs text-foreground/80 bg-muted/30 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {version.content.slice(0, 500)}
                    {version.content.length > 500 && (
                      <span className="text-muted-foreground"> ...</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRestore(version)
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                      title={isZh ? '恢复此版本' : 'Restore this version'}
                    >
                      <RotateCcw size={10} />
                      {isZh ? '恢复' : 'Restore'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveVersionId(version.id)
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                      title={isZh ? '预览此版本' : 'Preview this version'}
                    >
                      <Clock size={10} />
                      {isZh ? '预览' : 'Preview'}
                    </button>
                    {!isLatest && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSectionVersion(version.id)
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                        title={isZh ? '删除此版本' : 'Delete this version'}
                      >
                        <Trash2 size={10} />
                        {isZh ? '删除' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
