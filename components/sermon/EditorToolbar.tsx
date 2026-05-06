'use client'

import React, { useCallback, useState, useRef } from 'react'
import { type VditorEditorHandle } from './VditorEditor'
import { generateSectionMarkdown, SECTION_TYPES, SECTION_LABELS, type SectionType } from '@/lib/sermon-vditor'
import { BookOpen, LayoutTemplate, Sparkles, Loader2 } from 'lucide-react'
import { useBreakpoint } from '@/hooks/use-media-query'

interface EditorToolbarProps {
  editorRef: React.RefObject<VditorEditorHandle | null>
  onOpenVersePicker: () => void
  onAIAssist: (action: string) => void
  isGenerating: boolean
  onInsertVerse: (verseMarkdown: string) => void
}

export default function EditorToolbar({
  editorRef,
  onOpenVersePicker,
  onAIAssist,
  isGenerating,
}: EditorToolbarProps) {
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

  const handleAIContinue = useCallback(() => {
    onAIAssist('continue')
  }, [onAIAssist])

  const handleAIPolish = useCallback(() => {
    onAIAssist('polish')
  }, [onAIAssist])

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border dark:border-white/[0.06] flex-shrink-0 bg-white dark:bg-[#1f2937]">
      {/* Verse picker */}
      <button
        onClick={onOpenVersePicker}
        title="插入经文"
        className={`${isMd ? 'p-1.5' : 'p-2.5'} rounded hover:bg-blue-500/10 transition-colors active:scale-95 flex-shrink-0 text-gray-600 dark:text-gray-300`}
      >
        <BookOpen size={iconSize} />
      </button>

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

      {/* AI assist */}
      <button
        onClick={handleAIContinue}
        disabled={isGenerating}
        title="AI 续写"
        className={`${isMd ? 'p-1.5' : 'p-2.5'} rounded hover:bg-blue-500/10 transition-colors active:scale-95 flex-shrink-0 text-gray-600 dark:text-gray-300 disabled:opacity-50`}
      >
        {isGenerating ? <Loader2 size={iconSize} className="animate-spin" /> : <Sparkles size={iconSize} />}
      </button>

      <button
        onClick={handleAIPolish}
        disabled={isGenerating}
        title="AI 润色"
        className={`${isMd ? 'p-1.5' : 'p-2.5'} rounded hover:bg-blue-500/10 transition-colors active:scale-95 flex-shrink-0 text-gray-600 dark:text-gray-300 disabled:opacity-50`}
      >
        <Sparkles size={iconSize} className="text-purple-500" />
      </button>
    </div>
  )
}