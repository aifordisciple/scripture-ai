'use client'

import React, { useCallback, useState, useRef } from 'react'
import { useBibleStore } from '@/store/useBibleStore'
import { type VditorEditorHandle } from './VditorEditor'
import { generateSectionMarkdown, SECTION_TYPES, SECTION_LABELS, type SectionType } from '@/lib/sermon-vditor'
import { BookOpen, LayoutTemplate, Sparkles } from 'lucide-react'
import { useBreakpoint } from '@/hooks/use-media-query'
import VersePickerPopover from './VersePickerPopover'

interface EditorToolbarProps {
  editorRef: React.RefObject<VditorEditorHandle | null>
  onAIAssist: (action: string) => void
  isGenerating: boolean
}

export default function EditorToolbar({
  editorRef,
  onAIAssist,
  isGenerating,
}: EditorToolbarProps) {
  const { isDarkMode } = useBibleStore()
  const { isMd } = useBreakpoint()
  const [showSectionMenu, setShowSectionMenu] = useState(false)
  const sectionMenuRef = useRef<HTMLDivElement>(null)

  const iconSize = isMd ? 16 : 20

  const handleInsertSection = useCallback((sectionType: SectionType) => {
    const label = SECTION_LABELS[sectionType]
    const md = generateSectionMarkdown(sectionType, label)
    editorRef.current?.insertValue(md)
    setShowSectionMenu(false)
  }, [editorRef])

  const handleInsertVerse = useCallback((verseMarkdown: string) => {
    editorRef.current?.insertValue(verseMarkdown)
  }, [editorRef])

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border dark:border-white/[0.06] flex-shrink-0 bg-white dark:bg-[#1f2937]">
      {/* Verse picker */}
      <VersePickerPopover isDark={isDarkMode} onInsert={handleInsertVerse}>
        <button
          title="插入经文"
          className={`${isMd ? 'p-1.5' : 'p-2.5'} rounded hover:bg-blue-500/10 transition-colors active:scale-95 flex-shrink-0 text-gray-600 dark:text-gray-300`}
        >
          <BookOpen size={iconSize} />
        </button>
      </VersePickerPopover>

      <div className="w-px h-5 mx-1 bg-gray-200 dark:bg-gray-700" />

      {/* Section heading */}
      <div className="relative" ref={sectionMenuRef}>
        <button
          onClick={() => setShowSectionMenu(prev => !prev)}
          title="插入段落标题"
          className={`${isMd ? 'p-1.5' : 'p-2.5'} rounded hover:bg-blue-500/10 transition-colors active:scale-95 flex-shrink-0 text-gray-600 dark:text-gray-300`}
        >
          <LayoutTemplate size={iconSize} />
        </button>

        {showSectionMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
            {SECTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleInsertSection(type)}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-blue-500/10 transition-colors text-gray-700 dark:text-gray-300"
              >
                {SECTION_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 mx-1 bg-gray-200 dark:bg-gray-700" />

      {/* AI assist — single button for Cmd+J trigger */}
      <button
        onClick={() => onAIAssist('continue')}
        disabled={isGenerating}
        title="AI 续写 (⌘J)"
        className={`${isMd ? 'p-1.5' : 'p-2.5'} rounded hover:bg-blue-500/10 transition-colors active:scale-95 flex-shrink-0 text-gray-600 dark:text-gray-300 disabled:opacity-50`}
      >
        {isGenerating ? (
          <svg className="animate-spin" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" />
          </svg>
        ) : (
          <Sparkles size={iconSize} />
        )}
      </button>

      {/* Slash command hint */}
      <span className="text-[10px] text-muted-foreground ml-1 hidden md:inline">/ 命令</span>
    </div>
  )
}