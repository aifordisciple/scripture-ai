'use client';

import React from 'react';
import { EditorView } from '@codemirror/view';
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
} from 'lucide-react';
import { undo, redo } from '@codemirror/commands';
import { generateSectionBlock, SectionType } from '@/lib/sermon-markdown';
import VersePickerPopover from './VersePickerPopover';
import { useBreakpoint } from '@/hooks/use-media-query';

interface EditorToolbarProps {
  editorView: EditorView | null;
  isDark: boolean;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: (view: EditorView) => void;
  separator?: boolean;
}

/** Insert text at cursor position, wrapping selection if any */
function insertAtCursor(view: EditorView, before: string, after: string = '') {
  const { from, to } = view.state.selection.main;
  const selectedText = view.state.sliceDoc(from, to);
  const placeholder = before === '**' || before === '*' || before === '~~' ? '文本' : '';
  const insertion = `${before}${selectedText || placeholder}${after}`;

  view.dispatch({
    changes: { from, to, insert: insertion },
    selection: { anchor: from + before.length, head: from + before.length + (selectedText || placeholder).length },
  });
  view.focus();
}

/** Insert a block at the start of a new line after cursor */
function insertBlock(view: EditorView, text: string) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const insertPos = line.to;
  const prefix = line.text.trim() === '' ? '' : '\n';

  view.dispatch({
    changes: { from: insertPos, insert: `${prefix}${text}\n` },
    selection: { anchor: insertPos + prefix.length + text.length + 1 },
  });
  view.focus();
}

export default function EditorToolbar({ editorView, isDark }: EditorToolbarProps) {
  const { isMd } = useBreakpoint()
  const iconSize = isMd ? 16 : 20
  if (!editorView) return null;

  const buttons: ToolbarButton[] = [
    {
      icon: <Undo2 size={iconSize} />,
      label: '撤回',
      action: (view) => { undo(view); view.focus(); },
    },
    {
      icon: <Redo2 size={iconSize} />,
      label: '重做',
      action: (view) => { redo(view); view.focus(); },
    },
    {
      icon: <Bold size={iconSize} />,
      label: '加粗',
      action: (view) => insertAtCursor(view, '**', '**'),
      separator: true,
    },
    {
      icon: <Italic size={iconSize} />,
      label: '斜体',
      action: (view) => insertAtCursor(view, '*', '*'),
    },
    {
      icon: <Strikethrough size={iconSize} />,
      label: '删除线',
      action: (view) => insertAtCursor(view, '~~', '~~'),
    },
    {
      icon: <Heading1 size={iconSize} />,
      label: '标题1',
      action: (view) => insertBlock(view, '# '),
      separator: true,
    },
    {
      icon: <Heading2 size={iconSize} />,
      label: '标题2',
      action: (view) => insertBlock(view, '## '),
    },
    {
      icon: <Heading3 size={iconSize} />,
      label: '标题3',
      action: (view) => insertBlock(view, '### '),
    },
    {
      icon: <List size={iconSize} />,
      label: '无序列表',
      action: (view) => insertBlock(view, '- '),
      separator: true,
    },
    {
      icon: <ListOrdered size={iconSize} />,
      label: '有序列表',
      action: (view) => insertBlock(view, '1. '),
    },
    {
      icon: <Quote size={iconSize} />,
      label: '引用',
      action: (view) => insertBlock(view, '> '),
    },
    {
      icon: <Minus size={iconSize} />,
      label: '分割线',
      action: (view) => insertBlock(view, '---'),
      separator: true,
    },
    // Verse button is handled separately via VersePickerPopover
    {
      icon: <LayoutTemplate size={iconSize} />,
      label: '段落',
      action: (view) => insertBlock(view, generateSectionBlock('introduction', '段落内容')),
    },
  ];

  const btnStyle = {
    color: isDark ? '#d1d5db' : '#4b5563',
  };

  return (
    <div
      className={`flex items-center gap-0.5 px-2 py-1 border-b flex-shrink-0 ${!isMd ? 'overflow-x-auto no-scrollbar' : ''}`}
      style={{
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
      }}
    >
      {buttons.map((btn, i) => {
        // Insert verse picker before the last button (段落)
        const isLast = i === buttons.length - 1
        return (
          <React.Fragment key={i}>
            {isLast && (
              <>
                <div className="w-px h-5 mx-1 flex-shrink-0" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }} />
                <VersePickerPopover editorView={editorView} isDark={isDark}>
                  <button
                    title="经文"
                    className={`${isMd ? 'p-1.5' : 'p-2.5'} rounded hover:bg-blue-500/10 transition-colors active:scale-95 flex-shrink-0`}
                    style={btnStyle}
                  >
                    <BookOpen size={iconSize} />
                  </button>
                </VersePickerPopover>
              </>
            )}
            {btn.separator && <div className="w-px h-5 mx-1 flex-shrink-0" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }} />}
            <button
              onClick={() => btn.action(editorView)}
              title={btn.label}
              className={`${isMd ? 'p-1.5' : 'p-2.5'} rounded hover:bg-blue-500/10 transition-colors active:scale-95 flex-shrink-0`}
              style={btnStyle}
            >
              {btn.icon}
            </button>
          </React.Fragment>
        )
      })}
    </div>
  );
}