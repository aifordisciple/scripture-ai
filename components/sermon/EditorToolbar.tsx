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
import { generateVerseBlock, generateSectionBlock, SectionType } from '@/lib/sermon-markdown';

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
  if (!editorView) return null;

  const buttons: ToolbarButton[] = [
    {
      icon: <Undo2 size={16} />,
      label: '撤回',
      action: (view) => { undo(view); view.focus(); },
    },
    {
      icon: <Redo2 size={16} />,
      label: '重做',
      action: (view) => { redo(view); view.focus(); },
    },
    {
      icon: <Bold size={16} />,
      label: '加粗',
      action: (view) => insertAtCursor(view, '**', '**'),
      separator: true,
    },
    {
      icon: <Italic size={16} />,
      label: '斜体',
      action: (view) => insertAtCursor(view, '*', '*'),
    },
    {
      icon: <Strikethrough size={16} />,
      label: '删除线',
      action: (view) => insertAtCursor(view, '~~', '~~'),
    },
    {
      icon: <Heading1 size={16} />,
      label: '标题1',
      action: (view) => insertBlock(view, '# '),
      separator: true,
    },
    {
      icon: <Heading2 size={16} />,
      label: '标题2',
      action: (view) => insertBlock(view, '## '),
    },
    {
      icon: <Heading3 size={16} />,
      label: '标题3',
      action: (view) => insertBlock(view, '### '),
    },
    {
      icon: <List size={16} />,
      label: '无序列表',
      action: (view) => insertBlock(view, '- '),
      separator: true,
    },
    {
      icon: <ListOrdered size={16} />,
      label: '有序列表',
      action: (view) => insertBlock(view, '1. '),
    },
    {
      icon: <Quote size={16} />,
      label: '引用',
      action: (view) => insertBlock(view, '> '),
    },
    {
      icon: <Minus size={16} />,
      label: '分割线',
      action: (view) => insertBlock(view, '---'),
      separator: true,
    },
    {
      icon: <BookOpen size={16} />,
      label: '经文',
      action: (view) => insertBlock(view, generateVerseBlock('经文引用', '经文内容')),
      separator: true,
    },
    {
      icon: <LayoutTemplate size={16} />,
      label: '段落',
      action: (view) => insertBlock(view, generateSectionBlock('introduction', '段落内容')),
    },
  ];

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1 border-b flex-shrink-0"
      style={{
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderColor: isDark ? '#374151' : '#e5e7eb',
      }}
    >
      {buttons.map((btn, i) => (
        <React.Fragment key={i}>
          {btn.separator && <div className="w-px h-5 mx-1" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }} />}
          <button
            onClick={() => btn.action(editorView)}
            title={btn.label}
            className="p-1.5 rounded hover:bg-blue-500/10 transition-colors"
            style={{ color: isDark ? '#d1d5db' : '#4b5563' }}
          >
            {btn.icon}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
