'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { history, historyKeymap } from '@codemirror/commands';
import { keymap, EditorView as CMEditorView } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';
import { verseBlockExtension } from './extensions/verseBlock';
import { sectionBlockExtension } from './extensions/sectionBlock';
import { livePreviewExtension } from './extensions/livePreview';
import { sermonEditorTheme } from './extensions/theme';
import EditorToolbar from './EditorToolbar';

interface CodeMirrorEditorProps {
  content: string;
  onChange: (content: string) => void;
  isDark: boolean;
  onSave: () => void;
}

export default function CodeMirrorEditor({
  content,
  onChange,
  isDark,
  onSave,
}: CodeMirrorEditorProps) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const [editorView, setEditorView] = useState<CMEditorView | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get editor view from ref
  useEffect(() => {
    if (cmRef.current?.view) {
      setEditorView(cmRef.current.view);
    }
  }, [cmRef.current?.view]);

  // Debounced onChange handler
  const handleChange = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(value);
      }, 300);
    },
    [onChange]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Build extensions
  const extensions = React.useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      history({ newGroupDelay: 500 }),
      verseBlockExtension(),
      sectionBlockExtension(),
      livePreviewExtension(),
      sermonEditorTheme(isDark),
      autocompletion(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
        {
          key: 'Mod-s',
          run: () => {
            onSave();
            return true;
          },
        },
      ]),
      CMEditorView.updateListener.of((update) => {
        if (update.view !== editorView) {
          setEditorView(update.view);
        }
      }),
    ],
    [isDark, onSave, editorView]
  );

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editorView={editorView} isDark={isDark} />
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          ref={cmRef}
          value={content}
          onChange={handleChange}
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
          className="h-full"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
