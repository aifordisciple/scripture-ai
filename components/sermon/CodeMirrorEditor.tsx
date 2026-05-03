'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { history, historyKeymap } from '@codemirror/commands';
import { keymap, EditorView as CMEditorView } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';
import { livePreviewExtension } from './extensions/livePreview';
import { sermonEditorTheme } from './extensions/theme';
import EditorToolbar from './EditorToolbar';

interface CodeMirrorEditorProps {
  content: string;
  onChange: (content: string) => void;
  isDark: boolean;
  onSave: () => void;
  fontSize: number;
  lineHeight: number;
}

export default function CodeMirrorEditor({
  content,
  onChange,
  isDark,
  onSave,
  fontSize,
  lineHeight,
}: CodeMirrorEditorProps) {
  const [editorView, setEditorView] = useState<CMEditorView | null>(null);

  // Handle content change from CodeMirror
  const handleChange = useCallback(
    (value: string) => {
      onChange(value);
    },
    [onChange]
  );

  // Build extensions - stable reference via useMemo
  // Note: onSave is captured via ref to avoid extension rebuild on every render
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      history({ newGroupDelay: 500 }),
      livePreviewExtension(),
      sermonEditorTheme(isDark, fontSize, lineHeight),
      autocompletion(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
        {
          key: 'Mod-s',
          run: () => {
            onSaveRef.current();
            return true;
          },
        },
      ]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark, fontSize, lineHeight]
  );

  // Capture editorView after mount
  const onCreateEditor = useCallback((view: CMEditorView) => {
    setEditorView(view);
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <EditorToolbar editorView={editorView} isDark={isDark} />
      <div className="flex-1" style={{ minHeight: 0, overflow: 'auto' }}>
        <CodeMirror
          value={content}
          onChange={handleChange}
          onCreateEditor={onCreateEditor}
          extensions={extensions}
          theme={isDark ? 'dark' : 'light'}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
            history: false,
            search: false,
            autocompletion: false,
          }}
        />
      </div>
    </div>
  );
}