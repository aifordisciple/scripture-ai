'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { SermonEditorHeader } from './SermonEditorHeader'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Highlighter,
} from 'lucide-react'

export function SermonEditor() {
  const { t } = useTranslation()
  const {
    currentSermon,
    setCurrentSermon,
    setIsSermonSaving,
    setSermons,
    sermons,
  } = useBibleStore()

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 自动保存
  const autoSave = useCallback(async (content: string) => {
    if (!currentSermon) return

    // 计算字数
    const text = JSON.parse(content).content
      ?.map((node: any) => node.content?.map((c: any) => c.text || '').join('') || '')
      .join('\n') || ''
    const wordCount = text.length

    setIsSermonSaving(true)
    try {
      const res = await fetch('/api/sermon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentSermon.id,
          content,
          wordCount,
          title: currentSermon.title,
          tags: currentSermon.tags,
          style: currentSermon.style,
          status: currentSermon.status,
        }),
      })
      const data = await res.json()
      // 更新列表中的讲章
      setSermons(sermons.map(s => s.id === currentSermon.id ? { ...s, wordCount, updatedAt: data.data.updatedAt } : s))
    } catch {
      // 静默处理
    } finally {
      setIsSermonSaving(false)
    }
  }, [currentSermon, setIsSermonSaving, setSermons, sermons])

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
    content: currentSermon ? (typeof currentSermon.content === 'string' ? JSON.parse(currentSermon.content) : currentSermon.content) : '',
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON())
      setCurrentSermon({ ...currentSermon!, content: json })

      // Debounce 自动保存
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => autoSave(json), 2000)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px] text-[14px] leading-[1.8]',
      },
    },
  })

  // 当切换讲章时更新编辑器内容
  useEffect(() => {
    if (editor && currentSermon) {
      const content = typeof currentSermon.content === 'string'
        ? JSON.parse(currentSermon.content)
        : currentSermon.content
      editor.commands.setContent(content, false)
    }
  }, [currentSermon?.id]) // 只在切换讲章时更新，不在每次 content 变化时更新

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  if (!currentSermon || !editor) return null

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 头部元数据 */}
      <SermonEditorHeader />

      {/* 工具栏 */}
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

      {/* 编辑器内容 */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-1 flex items-center gap-4 text-[10px] text-slate-400">
        <span>{currentSermon.wordCount}字</span>
        <span>~{Math.max(1, Math.round(currentSermon.wordCount / 250))}分钟讲道时长</span>
      </div>
    </div>
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