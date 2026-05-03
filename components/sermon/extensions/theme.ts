/**
 * CodeMirror theme for sermon editor
 * Matches the app's dark/light mode styling
 */
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

export const sermonEditorTheme = (isDark: boolean): Extension => {
  const baseTheme = EditorView.theme({
    '&': {
      fontSize: '15px',
      lineHeight: '1.7',
      height: '100%',
    },
    '.cm-content': {
      padding: '16px 0',
      fontFamily: '"Noto Serif SC", "Noto Serif", Georgia, serif',
      caretColor: isDark ? '#93c5fd' : '#3b82f6',
    },
    '.cm-cursor': {
      borderLeftColor: isDark ? '#93c5fd' : '#3b82f6',
      borderLeftWidth: '2px',
    },
    '.cm-activeLine': {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)',
    },
    '.cm-selectionBackground': {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.2) !important',
    },
    '.cm-gutters': {
      backgroundColor: isDark ? '#1e1e2e' : '#fafafa',
      color: isDark ? '#6b7280' : '#9ca3af',
      border: 'none',
      paddingRight: '8px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      fontSize: '12px',
      minWidth: '2.5em',
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: 'inherit',
    },
    '.cm-verse-block': {
      backgroundColor: isDark ? 'rgba(147, 197, 253, 0.08)' : 'rgba(219, 234, 254, 0.5)',
      borderLeft: `3px solid ${isDark ? '#3b82f6' : '#60a5fa'}`,
      borderRadius: '4px',
      padding: '8px 12px',
      margin: '4px 0',
    },
    '.cm-section-block': {
      backgroundColor: isDark ? 'rgba(167, 139, 250, 0.08)' : 'rgba(237, 233, 254, 0.5)',
      borderLeft: `3px solid ${isDark ? '#8b5cf6' : '#a78bfa'}`,
      borderRadius: '4px',
      padding: '8px 12px',
      margin: '4px 0',
    },
    '.cm-preview-widget': {
      cursor: 'text',
      transition: 'opacity 0.15s ease',
    },
    '.cm-preview-widget:hover': {
      opacity: '0.85',
    },
    '.cm-toolbar': {
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      padding: '4px 8px',
      borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
    },
  });

  const darkHighlightStyle = isDark
    ? EditorView.baseTheme({
        '.cm-content': { color: '#e5e7eb' },
        '.tok-heading': { color: '#93c5fd', fontWeight: '700' },
        '.tok-heading1': { fontSize: '1.6em' },
        '.tok-heading2': { fontSize: '1.3em' },
        '.tok-heading3': { fontSize: '1.1em' },
        '.tok-strong': { color: '#f9fafb', fontWeight: '700' },
        '.tok-emphasis': { color: '#c4b5fd', fontStyle: 'italic' },
        '.tok-strikethrough': { textDecoration: 'line-through', color: '#6b7280' },
        '.tok-link': { color: '#60a5fa', textDecoration: 'underline' },
        '.tok-url': { color: '#60a5fa' },
        '.tok-string': { color: '#86efac' },
        '.tok-meta': { color: '#fbbf24' },
        '.tok-comment': { color: '#6b7280' },
        '.tok-keyword': { color: '#f472b6' },
        '.tok-number': { color: '#fb923c' },
        '.tok-processingInstruction': { color: '#fbbf24' },
      })
    : EditorView.baseTheme({
        '.cm-content': { color: '#1f2937' },
        '.tok-heading': { color: '#1d4ed8', fontWeight: '700' },
        '.tok-heading1': { fontSize: '1.6em' },
        '.tok-heading2': { fontSize: '1.3em' },
        '.tok-heading3': { fontSize: '1.1em' },
        '.tok-strong': { color: '#111827', fontWeight: '700' },
        '.tok-emphasis': { color: '#6d28d9', fontStyle: 'italic' },
        '.tok-strikethrough': { textDecoration: 'line-through', color: '#9ca3af' },
        '.tok-link': { color: '#2563eb', textDecoration: 'underline' },
        '.tok-url': { color: '#2563eb' },
        '.tok-string': { color: '#15803d' },
        '.tok-meta': { color: '#b45309' },
        '.tok-comment': { color: '#9ca3af' },
        '.tok-keyword': { color: '#be185d' },
        '.tok-number': { color: '#c2410c' },
        '.tok-processingInstruction': { color: '#b45309' },
      });

  return [baseTheme, darkHighlightStyle];
};
