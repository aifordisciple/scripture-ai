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
  const isInternalChange = useRef(false);

  // Sync external content changes to editor (e.g. when switching sermons)
  useEffect(() => {
    const view = cmRef.current?.view;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== content) {
      isInternalChange.current = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
    }
  }, [content]);

  // Handle content change from CodeMirror
  const handleChange = useCallback(
    (value: string, viewUpdate: any) => {
      // Always notify parent of content changes
      onChange(value);
    },
    [onChange]
  );

  // Build extensions - stable reference via useMemo
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark]
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
          ref={cmRef}
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
