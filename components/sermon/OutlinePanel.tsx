'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Lock, Unlock, RefreshCw, ChevronRight, GripVertical, AlertTriangle, CheckCircle2, Loader2, Pencil, History } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import type { OutlineSection, OutlineSectionStatus, OutlineChangeStrategy } from '@/store/types'
import { VersionHistoryPanel } from './VersionHistoryPanel'

/** Status icon mapping */
function StatusIcon({ status }: { status: OutlineSectionStatus }) {
  switch (status) {
    case 'locked': return <Lock size={12} className="text-amber-500" />
    case 'generating': return <Loader2 size={12} className="text-blue-500 animate-spin" />
    case 'generated': return <CheckCircle2 size={12} className="text-green-500" />
    case 'reviewed': return <CheckCircle2 size={12} className="text-emerald-500" />
    default: return <Pencil size={12} className="text-muted-foreground" />
  }
}

/** Status label (i18n) */
function statusLabel(status: OutlineSectionStatus, isZh: boolean): string {
  const map: Record<OutlineSectionStatus, string> = {
    locked: isZh ? '已锁定' : 'Locked',
    editable: isZh ? '可编辑' : 'Editable',
    generating: isZh ? '生成中' : 'Generating',
    generated: isZh ? '已生成' : 'Generated',
    reviewed: isZh ? '已审阅' : 'Reviewed',
  }
  return map[status]
}

/** Strategy label (i18n) */
function strategyLabel(strategy: OutlineChangeStrategy, isZh: boolean): string {
  const map: Record<OutlineChangeStrategy, { zh: string; en: string }> = {
    'regenerate-affected': { zh: '重新生成受影响段落', en: 'Regenerate affected' },
    'adjust-existing': { zh: '调整现有段落', en: 'Adjust existing' },
    'mark-outdated': { zh: '标记为过时', en: 'Mark outdated' },
  }
  return isZh ? map[strategy].zh : map[strategy].en
}

interface OutlinePanelProps {
  /** Called when user wants to generate/regenerate a specific section */
  onGenerateSection?: (sectionId: string) => void
  /** Called when user wants to navigate to a section in the editor */
  onNavigateToSection?: (sectionId: string) => void
}

/**
 * OutlinePanel — 大纲锁定与段落独立操作面板
 *
 * Features:
 * - Visual outline with lock/unlock per section
 * - Section status indicators (locked, generating, generated, reviewed)
 * - Strategy selection when outline changes affect locked sections
 * - Quick actions: generate, navigate, lock/unlock
 */
export function OutlinePanel({ onGenerateSection, onNavigateToSection }: OutlinePanelProps) {
  const { locale } = useTranslation()
  const isZh = locale !== 'en'
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)

  const {
    outlineSections,
    outlineChangeStrategy,
    toggleSectionLock,
    lockAllSections,
    unlockAllSections,
    updateSectionStatus,
    setOutlineChangeStrategy,
  } = useBibleStore()

  const lockedCount = useMemo(() => outlineSections.filter(s => s.locked).length, [outlineSections])
  const totalCount = outlineSections.length

  const handleToggleLock = useCallback((sectionId: string) => {
    const section = outlineSections.find(s => s.id === sectionId)
    if (!section) return
    // If unlocking a locked section, show strategy selector if there are other locked sections
    toggleSectionLock(sectionId)
  }, [outlineSections, toggleSectionLock])

  const handleGenerate = useCallback((sectionId: string) => {
    updateSectionStatus(sectionId, 'generating')
    onGenerateSection?.(sectionId)
  }, [updateSectionStatus, onGenerateSection])

  if (outlineSections.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
        {isZh ? '暂无大纲，请先生成讲章大纲' : 'No outline yet. Generate a sermon outline first.'}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header with lock controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-foreground">
          {isZh ? '讲章大纲' : 'Sermon Outline'}
          <span className="ml-1.5 text-muted-foreground">
            ({lockedCount}/{totalCount} {isZh ? '已锁定' : 'locked'})
          </span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={lockAllSections}
            className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            title={isZh ? '锁定全部' : 'Lock all'}
          >
            <Lock size={11} />
          </button>
          <button
            onClick={unlockAllSections}
            className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            title={isZh ? '解锁全部' : 'Unlock all'}
          >
            <Unlock size={11} />
          </button>
        </div>
      </div>

      {/* Strategy selector (shown when there are locked sections) */}
      {lockedCount > 0 && (
        <div className="px-3 py-2 border-b border-border bg-amber-50/50 dark:bg-amber-900/10">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle size={10} className="text-amber-500" />
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
              {isZh ? '大纲变更策略' : 'Outline change strategy'}
            </span>
          </div>
          <div className="flex gap-1">
            {(['regenerate-affected', 'adjust-existing', 'mark-outdated'] as OutlineChangeStrategy[]).map(s => (
              <button
                key={s}
                onClick={() => setOutlineChangeStrategy(s)}
                className={`
                  px-1.5 py-0.5 rounded text-[10px] transition-colors
                  ${outlineChangeStrategy === s
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium'
                    : 'text-muted-foreground hover:bg-accent/50'
                  }
                `}
              >
                {strategyLabel(s, isZh)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section list */}
      <div className="flex-1 overflow-y-auto">
        {outlineSections.map((section, idx) => (
          <div
            key={section.id}
            className={`
              group flex items-start gap-2 px-3 py-2 border-b border-border/50
              hover:bg-accent/30 transition-colors cursor-pointer
              ${section.locked ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}
            `}
            onClick={() => onNavigateToSection?.(section.id)}
          >
            {/* Drag handle */}
            <GripVertical size={12} className="mt-1 text-muted-foreground/40 cursor-grab shrink-0" />

            {/* Section number */}
            <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0 w-4 text-right">
              {idx + 1}
            </span>

            {/* Section content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <StatusIcon status={section.status} />
                <span className="text-xs font-medium text-foreground truncate">
                  {section.title}
                </span>
              </div>
              {/* Key points */}
              {section.keyPoints.length > 0 && (
                <div className="mt-0.5 pl-4">
                  {section.keyPoints.slice(0, 2).map((point, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground truncate leading-tight">
                      • {point}
                    </div>
                  ))}
                  {section.keyPoints.length > 2 && (
                    <span className="text-[10px] text-muted-foreground/60">
                      +{section.keyPoints.length - 2}
                    </span>
                  )}
                </div>
              )}
              {/* Target word count */}
              <div className="mt-0.5 text-[9px] text-muted-foreground/50">
                ~{section.targetWordCount}{isZh ? '字' : ' words'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleLock(section.id)
                }}
                className={`
                  p-1 rounded transition-colors
                  ${section.locked
                    ? 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                    : 'text-muted-foreground hover:bg-accent/50'
                  }
                `}
                title={section.locked ? (isZh ? '解锁段落' : 'Unlock section') : (isZh ? '锁定段落' : 'Lock section')}
              >
                {section.locked ? <Lock size={11} /> : <Unlock size={11} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleGenerate(section.id)
                }}
                className="p-1 rounded text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                title={isZh ? '生成段落' : 'Generate section'}
              >
                <RefreshCw size={11} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedSectionId(selectedSectionId === section.id ? null : section.id)
                }}
                className={`
                  p-1 rounded transition-colors
                  ${selectedSectionId === section.id
                    ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }
                `}
                title={isZh ? '版本历史' : 'Version history'}
              >
                <History size={11} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigateToSection?.(section.id)
                }}
                className="p-1 rounded text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                title={isZh ? '跳转到段落' : 'Navigate to section'}
              >
                <ChevronRight size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Version history for selected section */}
      {selectedSectionId && (
        <div className="border-t border-border">
          <VersionHistoryPanel sectionId={selectedSectionId} />
        </div>
      )}
    </div>
  )
}
