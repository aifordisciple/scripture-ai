/**
 * CodeMirror theme for sermon editor
 * Matches the app's dark/light mode styling
 */
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

export const sermonEditorTheme = (isDark: boolean): Extension => {
  const bg = isDark ? '#0f172a' : '#ffffff';
  const fg = isDark ? '#e2e8f0' : '#1e293b';
  const gutterBg = isDark ? '#1e293b' : '#f8fafc';
  const gutterFg = isDark ? '#475569' : '#94a3b8';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const activeLineBg = isDark ? 'rgba(59, 130, 246, 0.07)' : 'rgba(59, 130, 246, 0.04)';
  const selectionBg = isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)';
  const cursorColor = isDark ? '#60a5fa' : '#3b82f6';

  return EditorView.theme({
    '&': {
      fontSize: '15px',
      lineHeight: '1.75',
      height: '100%',
      backgroundColor: bg,
      color: fg,
    },
    '.cm-editor': {
      height: '100%',
      outline: 'none',
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: '"Noto Serif SC", "Noto Serif", Georgia, serif',
    },
    '.cm-content': {
      padding: '12px 4px 12px 0',
      caretColor: cursorColor,
      maxWidth: '800px',
      margin: '0 auto',
    },
    '.cm-cursor': {
      borderLeftColor: cursorColor,
      borderLeftWidth: '2px',
    },
    '.cm-activeLine': {
      backgroundColor: activeLineBg,
    },
    '.cm-activeLineGutter': {
      backgroundColor: activeLineBg,
    },
    '.cm-selectionBackground': {
      backgroundColor: `${selectionBg} !important`,
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: `${selectionBg} !important`,
    },
    '.cm-gutters': {
      backgroundColor: gutterBg,
      color: gutterFg,
      border: 'none',
      paddingRight: '8px',
      borderRight: `1px solid ${borderColor}`,
    },
    '.cm-lineNumbers .cm-gutterElement': {
      fontSize: '11px',
      minWidth: '2.5em',
    },
    '.cm-foldGutter': {
      width: '16px',
    },
    // Live preview heading styles
    '.cm-livepreview-heading': {
      fontFamily: '"Noto Serif SC", "Noto Serif", Georgia, serif',
      padding: '0 4px',
    },
    // Code block styling
    '.cm-line .cm-monospace': {
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: '0.9em',
    },
    // Fenced code block background
    '.cm-line.cm-fencedcode, .cm-block-comment': {
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    },
  });
};