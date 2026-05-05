/**
 * Milkdown theme for sermon editor
 * Uses CSS classes for theming (ProseMirror/Milkdown approach)
 * rather than EditorView.baseTheme (which is CodeMirror-specific)
 */

export const DEFAULT_FONT_SIZE = 15
export const DEFAULT_LINE_HEIGHT = 2.0
export const MIN_FONT_SIZE = 12
export const MAX_FONT_SIZE = 24
export const MIN_LINE_HEIGHT = 1.2
export const MAX_LINE_HEIGHT = 3.5

/**
 * Generate CSS string for the sermon editor theme.
 * This is injected as a <style> tag in the editor component.
 */
export function sermonEditorCSS(isDark: boolean, fontSize: number = DEFAULT_FONT_SIZE, lineHeight: number = DEFAULT_LINE_HEIGHT): string {
  const bg = isDark ? '#0f172a' : '#ffffff'
  const fg = isDark ? '#e2e8f0' : '#1e293b'
  const borderColor = isDark ? '#334155' : '#e2e8f0'
  const activeLineBg = isDark ? 'rgba(59, 130, 246, 0.07)' : 'rgba(59, 130, 246, 0.04)'
  const selectionBg = isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)'
  const cursorColor = isDark ? '#60a5fa' : '#3b82f6'
  const mutedColor = isDark ? '#94a3b8' : '#64748b'

  return `
    .milkdown {
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      background-color: ${bg};
      color: ${fg};
      height: 100%;
    }
    .milkdown .editor {
      font-family: "Noto Serif SC", "Noto Serif", Georgia, serif;
      padding: 12px 16px;
      min-height: 100%;
      outline: none;
      caret-color: ${cursorColor};
      max-width: 800px;
      margin: 0 auto;
    }
    .milkdown .editor ::selection {
      background-color: ${selectionBg};
    }

    /* Headings */
    .milkdown .editor h1 { font-size: 1.4em; font-weight: 700; margin-top: 1.2em; margin-bottom: 0.4em; line-height: 1.3; }
    .milkdown .editor h2 { font-size: 1.2em; font-weight: 700; margin-top: 1em; margin-bottom: 0.3em; line-height: 1.3; }
    .milkdown .editor h3 { font-size: 1.05em; font-weight: 600; margin-top: 0.8em; margin-bottom: 0.2em; line-height: 1.4; }
    .milkdown .editor h4, .milkdown .editor h5, .milkdown .editor h6 { font-weight: 600; margin-top: 0.6em; margin-bottom: 0.2em; }

    /* Block elements */
    .milkdown .editor blockquote {
      border-left: 3px solid ${isDark ? '#475569' : '#6b7280'};
      padding-left: 12px;
      color: ${mutedColor};
      font-style: italic;
    }
    .milkdown .editor hr {
      border: none;
      border-top: 1px solid ${isDark ? '#334155' : '#d1d5db'};
      margin: 1em 0;
    }
    .milkdown .editor p { margin-bottom: 0.5em; }

    /* Lists */
    .milkdown .editor ul, .milkdown .editor ol { padding-left: 1.5em; margin-bottom: 0.5em; }
    .milkdown .editor li { margin-bottom: 0.2em; }

    /* Inline marks */
    .milkdown .editor strong { font-weight: 700; }
    .milkdown .editor em { font-style: italic; }
    .milkdown .editor s { text-decoration: line-through; }
    .milkdown .editor code {
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 0.9em;
      background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
      padding: 1px 4px;
      border-radius: 3px;
    }
    .milkdown .editor a { color: ${cursorColor}; text-decoration: underline; }

    /* Code block */
    .milkdown .editor pre {
      font-family: "JetBrains Mono", "Fira Code", monospace;
      font-size: 0.9em;
      background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
      padding: 8px 12px;
      border-radius: 4px;
      overflow: auto;
    }

    /* Verse card */
    .sermon-verse-card {
      margin: 8px 0;
      border-radius: 8px;
      border: 1px solid ${borderColor};
      overflow: hidden;
      background: ${isDark
        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'};
    }
    .sermon-verse-card-header {
      padding: 6px 14px;
      border-bottom: 1px solid ${borderColor};
      background: ${isDark
        ? 'linear-gradient(135deg, #1e3a5f 0%, #172554 100%)'
        : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'};
      color: ${isDark ? '#93c5fd' : '#1e40af'};
    }
    .sermon-verse-icon { font-size: 0.9em; margin-right: 4px; }
    .sermon-verse-ref { font-weight: 600; font-size: 0.85em; }
    .sermon-verse-card-body {
      padding: 10px 14px;
      color: ${fg};
      white-space: pre-wrap;
      line-height: 1.8;
    }

    /* Section card */
    .sermon-section-card {
      margin: 8px 0;
      border-radius: 4px;
      border-left: 3px solid #8b5cf6;
      padding: 2px 10px;
      background: ${isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.04)'};
    }
    .sermon-section-card-header {
      font-weight: 600;
      font-size: 0.85em;
      margin-bottom: 2px;
    }
    .sermon-section-card-body {
      white-space: pre-wrap;
    }

    /* ProseMirror selected node highlight */
    .ProseMirror-selectednode {
      outline: 2px solid ${cursorColor};
      outline-offset: 2px;
    }
  `
}