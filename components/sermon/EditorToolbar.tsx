'use client'

import React, { useCallback } from 'react'
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  BookOpen,
  LayoutTemplate,
} from 'lucide-react'
import { toggleStrongCommand, toggleEmphasisCommand, wrapInHeadingCommand, wrapInBlockquoteCommand, wrapInBulletListCommand, wrapInOrderedListCommand, insertHrCommand } from '@milkdown/preset-commonmark'
import { toggleStrikethroughCommand } from '@milkdown/preset-gfm'
import { undo, redo } from '@milkdown/prose/history'
import { commandsCtx } from '@milkdown/core'
import { useBreakpoint } from '@/hooks/use-media-query'
import { useSermonEditor } from './SermonEditorContext'
import { insertSectionBlockCommand } from './extensions/sectionBlock'
import VersePickerPopover from './VersePickerPopover'

interface EditorToolbarProps {
  isDark: boolean
}

export default function EditorToolbar({ isDark }: EditorToolbarProps) {
  const { isMd } = useBreakpoint()
  const { getEditor } = useSermonEditor()
  const iconSize = isMd ? 16 : 20

  const callCommand = useCallback((commandKey: any, payload?: any) => {
    const editor = getEditor()
    if (!editor) return
    editor.action((ctx) => {
      const commands = ctx.get(commandsCtx)
      commands.call(commandKey, payload)
      const view = ctx.get('editorView' as any) as any
      view.focus()
    })
  }, [getEditor])

  const handleUndo = useCallback(() => {
    const editor = getEditor()
    if (!editor) return
    editor.action((ctx) => {
      const view = ctx.get('editorView' as any) as any
      undo(view.state, view.dispatch)
      view.focus()
    })
  }, [getEditor])

  const handleRedo = useCallback(() => {
    const editor = getEditor()
    if (!editor) return
    editor.action((ctx) => {
      const view = ctx.get('editorView' as any) as any
      redo(view.state, view.dispatch)
      view.focus()
    })
  }, [getEditor])

  const handleInsertSection = useCallback(() => {
    callCommand(insertSectionBlockCommand.key, {
      sectionType: 'introduction',
      text: '段落内容',
    })
  }, [callCommand])

  const btnStyle = {
    color: isDark ? '#d1d5db' : '#4b5563',
  }

  const separator = <div className="w-px h-5 mx-1 flex-shrink-0" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }} />

  const buttons = [
    { icon: <Undo2 size={iconSize} />, label: '撤回', action: handleUndo },
    { icon: <Redo2 size={iconSize} />, label: '重做', action: handleRedo, sep: true },
    { icon: <Bold size={iconSize} />, label: '加粗', action: () => callCommand(toggleStrongCommand.key) },
    { icon: <Italic size={iconSize} />, label: '斜体', action: () => callCommand(toggleEmphasisCommand.key) },
    { icon: <Strikethrough size={iconSize} />, label: '删除线', action: () => callCommand(toggleStrikethroughCommand.key), sep: true },
    { icon: <Heading1 size={iconSize} />, label: '标题1', action: () => callCommand(wrapInHeadingCommand.key, 1) },
    { icon: <Heading2 size={iconSize} />, label: '标题2', action: () => callCommand(wrapInHeadingCommand.key, 2) },
    { icon: <Heading3 size={iconSize} />, label: '标题3', action: () => callCommand(wrapInHeadingCommand.key, 3), sep: true },
    { icon: <List size={iconSize} />, label: '无序列表', action: () => callCommand(wrapInBulletListCommand.key) },
    { icon: <ListOrdered size={iconSize} />, label: '有序列表', action: () => callCommand(wrapInOrderedListCommand.key) },
    { icon: <Quote size={iconSize} />, label: '引用', action: () => callCommand(wrapInBlockquoteCommand.key) },
    { icon: <Minus size={iconSize} />, label: '分割线', action: () => callCommand(insertHrCommand.key), sep: true },
    { icon: <LayoutTemplate size={iconSize} />, label: '段落', action: handleInsertSection },
  ]

  return (
    <div
      className={`flex items-center gap-0.5 px-2 py-1 border-b flex-shrink-0 ${!isMd ? 'overflow-x-auto no-scrollbar' : ''}`}
      style={{
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
      }}
    >
      {/* Verse picker button */}
      <VersePickerPopover isDark={isDark}>
        <button
          title="经文"
          className={`${isMd ? 'p-1.5' : 'p-2.5'} rounded hover:bg-blue-500/10 transition-colors active:scale-95 flex-shrink-0`}
          style={btnStyle}
        >
          <BookOpen size={iconSize} />
        </button>
      </VersePickerPopover>
      {separator}

      {buttons.map((btn, i) => (
        <React.Fragment key={i}>
          {btn.sep && separator}
          <button
            onClick={btn.action}
            title={btn.label}
            className={`${isMd ? 'p-1.5' : 'p-2.5'} rounded hover:bg-blue-500/10 transition-colors active:scale-95 flex-shrink-0`}
            style={btnStyle}
          >
            {btn.icon}
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}