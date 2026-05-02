'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { SermonEditorHeader } from './SermonEditorHeader'
import { useSetSermonEditor } from './SermonEditorContext'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Highlighter,
  Sparkles,
  PenLine,
  BookOpen,
  Lightbulb,
  Link2,
  Loader2,
} from 'lucide-react'

export function SermonEditor() {
  const { t } = useTranslation()
  const {
    currentSermon,
    setCurrentSermon,
    setIsSermonSaving,
    setSermons,
    sermons,
    apiConfig,
    locale,
    sermonAiActionLoading,
    setSermonAiActionLoading,
  } = useBibleStore()

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sermonsRef = useRef(sermons)
  sermonsRef.current = sermons
  const currentSermonRef = useRef(currentSermon)
  currentSermonRef.current = currentSermon
  const [aiAction, setAiAction] = useState<string | null>(null)
  const setSermonEditor = useSetSermonEditor()

  // Auto-save - uses refs to avoid stale closure
  const autoSave = useCallback(async (content: string) => {
    const sermon = currentSermonRef.current
    if (!sermon) return
    let wordCount = 0
    try {
      const parsed = JSON.parse(content)
      const text = parsed?.content
        ?.map((node: any) => node.content?.map((c: any) => c.text || '').join('') || '')
        .join('\n') || ''
      wordCount = text.length
    } catch {
      // Fallback: count raw string length
      wordCount = content.length
    }

    setIsSermonSaving(true)
    try {
      const res = await fetch('/api/sermon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sermon.id,
          content,
          wordCount,
          title: sermon.title,
          tags: sermon.tags,
          style: sermon.style,
          status: sermon.status,
        }),
      })
      const data = await res.json()
      const currentSermons = sermonsRef.current
      setSermons(currentSermons.map(s => s.id === sermon.id ? { ...s, wordCount, updatedAt: data.data?.updatedAt } : s))
    } catch (error) {
      console.error('[SermonEditor] Auto-save failed:', error)
    } finally {
      setIsSermonSaving(false)
    }
  }, [setIsSermonSaving, setSermons])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: t('sermon.editorPlaceholder'),
      }),
      Highlight,
    ],
    content: (() => {
      if (!currentSermon) return ''
      const raw = currentSermon.content
      if (!raw || raw.trim() === '' || raw.trim() === '{}') return ''
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          // Valid Tiptap JSON must have a `type` field (e.g. "doc")
          if (typeof parsed === 'object' && parsed !== null && parsed.type) return parsed
          // Parsed to something without `type` — invalid for Tiptap
          return ''
        } catch {
          // Not valid JSON — treat as plain HTML/text for Tiptap
          return raw
        }
      }
      if (typeof raw === 'object' && raw !== null && raw.type) return raw
      return ''
    })(),
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON())
      setCurrentSermon({ ...currentSermon!, content: json })
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => autoSave(json), 2000)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px] text-[14px] leading-[1.8]',
      },
    },
  })

  // Sync editor instance to context so panels can access it
  useEffect(() => {
    setSermonEditor(editor)
    return () => setSermonEditor(null)
  }, [editor, setSermonEditor])

  // Update editor content when switching sermons + clear pending save
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    if (editor && currentSermon) {
      const raw = currentSermon.content
      let content: any = ''
      if (raw && raw.trim() !== '' && raw.trim() !== '{}') {
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw)
            if (typeof parsed === 'object' && parsed !== null && parsed.type) content = parsed
          } catch {
            content = raw
          }
        } else if (typeof raw === 'object' && raw !== null && raw.type) {
          content = raw
        }
      }
      editor.commands.setContent(content, false)
    }
  }, [currentSermon?.id])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // Inline AI action handler
  const handleAiAction = async (action: string) => {
    if (!editor || sermonAiActionLoading) return
    const { from, to } = editor.state.selection
    if (from === to) return
    const selectedText = editor.state.doc.textBetween(from, to, '\n')
    if (!selectedText.trim()) return

    setSermonAiActionLoading(true)
    setAiAction(action)
    try {
      const res = await fetch('/api/sermon/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          selectedText,
          verseRefs: currentSermon?.verseRefs,
          style: currentSermon?.style,
          locale,
          apiConfig,
        }),
      })
      const data = await res.json()
      if (data.result) {
        // Replace selection with AI result
        editor.chain().focus().insertContent(data.result).run()
      }
    } catch (error) {
      console.error('[SermonEditor] AI action failed:', error)
    } finally {
      setSermonAiActionLoading(false)
      setAiAction(null)
    }
  }

  if (!currentSermon || !editor) return null

  const inlineActions = [
    { action: 'continue', icon: Sparkles, label: t('sermon.inlineContinue') },
    { action: 'polish', icon: PenLine, label: t('sermon.inlinePolish') },
    { action: 'insert-verse', icon: BookOpen, label: t('sermon.inlineVerse') },
    { action: 'add-example', icon: Lightbulb, label: t('sermon.inlineExample') },
    { action: 'cross-ref', icon: Link2, label: t('sermon.inlineCrossRef') },
  ]

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <SermonEditorHeader />

        {/* Toolbar */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-1.5 flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={<Bold className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={<Italic className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            icon={<Heading2 className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            icon={<Heading3 className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={<List className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={<ListOrdered className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            icon={<Quote className="w-3.5 h-3.5" />}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            icon={<Highlighter className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl mx-auto">
            <EditorContent editor={editor} />

            {/* BubbleMenu for inline AI actions */}
            <BubbleMenu
              editor={editor}
              tippyOptions={{ duration: 150, placement: 'top' }}
              className="flex items-center gap-0.5 rounded-lg bg-slate-800 dark:bg-slate-700 border border-slate-600 shadow-lg px-1 py-0.5"
            >
              {sermonAiActionLoading ? (
                <div className="flex items-center gap-1 px-2 py-1 text-[10px] text-white">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('sermon.inlineProcessing')}
                </div>
              ) : (
                inlineActions.map(({ action, icon: Icon, label }) => (
                  <button
                    key={action}
                    onClick={() => handleAiAction(action)}
                    className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] text-slate-200 hover:text-white hover:bg-slate-600 rounded transition-colors"
                    title={label}
                  >
                    <Icon className="w-3 h-3" />
                  </button>
                ))
              )}
            </BubbleMenu>
          </div>
        </div>

        {/* Status Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-1 flex items-center gap-4 text-[10px] text-slate-400">
          <span>{currentSermon.wordCount}{t('sermon.editorWords')}</span>
          <span>~{Math.max(1, Math.round(currentSermon.wordCount / 250))}{t('sermon.editorMinutes')}</span>
        </div>
      </div>
    </>
  )
}

function ToolbarButton({ onClick, isActive, icon }: { onClick: () => void; isActive: boolean; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      )}
    >
      {icon}
    </button>
  )
}
