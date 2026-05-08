'use client'

import React, { useCallback, useState } from 'react'
import { Download, FileText, File, Code, Copy, Check } from 'lucide-react'
import { useBibleStore } from '@/store/useBibleStore'
import { useTranslation } from '@/lib/i18n'

type ExportFormat = 'markdown' | 'text' | 'html' | 'pdf'

/** Format options with icons and descriptions */
const FORMAT_OPTIONS: { value: ExportFormat; icon: typeof FileText; zhName: string; enName: string; zhDesc: string; enDesc: string }[] = [
  { value: 'markdown', icon: Code, zhName: 'Markdown', enName: 'Markdown', zhDesc: '保留格式标记，适合二次编辑', enDesc: 'With formatting, good for re-editing' },
  { value: 'text', icon: FileText, zhName: '纯文本', enDesc: 'Plain text without formatting', zhDesc: '无格式纯文本' },
  { value: 'html', icon: Code, zhName: 'HTML', enName: 'HTML', zhDesc: '网页格式，可直接发布', enDesc: 'Web format, ready to publish' },
  { value: 'pdf', icon: File, zhName: 'PDF', enName: 'PDF', zhDesc: '打印和分享的最佳格式', enDesc: 'Best for printing and sharing' },
]

/**
 * ExportPanel — 多格式导出面板
 *
 * Features:
 * - 4 export formats: Markdown, plain text, HTML, PDF
 * - Copy to clipboard
 * - Download as file
 * - Preview before export
 */
export function ExportPanel() {
  const { locale } = useTranslation()
  const isZh = locale !== 'en'

  const { currentSermon } = useBibleStore()
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown')
  const [copied, setCopied] = useState(false)

  const content = currentSermon?.content || ''
  const title = currentSermon?.title || (isZh ? '未命名讲章' : 'Untitled Sermon')

  /** Convert content to selected format */
  const convertContent = useCallback((format: ExportFormat): string => {
    switch (format) {
      case 'markdown':
        return content
      case 'text':
        return content
          .replace(/^#{1,6}\s+/gm, '') // remove headings
          .replace(/\*\*(.+?)\*\*/g, '$1') // remove bold
          .replace(/\*(.+?)\*/g, '$1') // remove italic
          .replace(/[-*]\s+/gm, '• ') // convert list markers
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove links
      case 'html':
        return `<!DOCTYPE html>
<html lang="${isZh ? 'zh-CN' : 'en'}">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: serif; max-width: 800px; margin: 2em auto; padding: 0 1em; line-height: 1.8; }
    h1 { text-align: center; margin-bottom: 0.5em; }
    h2 { margin-top: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    blockquote { border-left: 3px solid #ccc; padding-left: 1em; color: #555; }
  </style>
</head>
<body>
${markdownToHtml(content, title)}
</body>
</html>`
      case 'pdf':
        // PDF export uses the HTML format with print styles
        return convertContent('html')
      default:
        return content
    }
  }, [content, title, isZh])

  /** Simple markdown to HTML converter */
  function markdownToHtml(md: string, docTitle: string): string {
    let html = `<h1>${docTitle}</h1>\n`
    const lines = md.split('\n')
    for (const line of lines) {
      if (line.match(/^##\s+/)) {
        html += `<h2>${line.replace(/^##\s+/, '')}</h2>\n`
      } else if (line.match(/^###\s+/)) {
        html += `<h3>${line.replace(/^###\s+/, '')}</h3>\n`
      } else if (line.match(/^>\s+/)) {
        html += `<blockquote>${line.replace(/^>\s+/, '')}</blockquote>\n`
      } else if (line.match(/^[-*]\s+/)) {
        html += `<li>${line.replace(/^[-*]\s+/, '')}</li>\n`
      } else if (line.trim()) {
        html += `<p>${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>\n`
      }
    }
    return html
  }

  const handleCopy = useCallback(async () => {
    const text = convertContent(selectedFormat)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [selectedFormat, convertContent])

  const handleDownload = useCallback(() => {
    const text = convertContent(selectedFormat)
    const extensions: Record<ExportFormat, string> = { markdown: '.md', text: '.txt', html: '.html', pdf: '.html' }
    const mimeTypes: Record<ExportFormat, string> = { markdown: 'text/markdown', text: 'text/plain', html: 'text/html', pdf: 'text/html' }

    if (selectedFormat === 'pdf') {
      // Open in new window for print-to-PDF
      const blob = new Blob([text], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      if (win) {
        win.onload = () => { win.print() }
      }
      return
    }

    const blob = new Blob([text], { type: mimeTypes[selectedFormat] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}${extensions[selectedFormat]}`
    a.click()
    URL.revokeObjectURL(url)
  }, [selectedFormat, convertContent, title])

  if (!content) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
          <Download size={12} className="text-indigo-500" />
          <span className="text-xs font-medium text-foreground">
            {isZh ? '导出' : 'Export'}
          </span>
        </div>
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          {isZh ? '暂无内容可导出' : 'No content to export'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <Download size={12} className="text-indigo-500" />
        <span className="text-xs font-medium text-foreground">
          {isZh ? '导出讲章' : 'Export Sermon'}
        </span>
      </div>

      <div className="px-3 py-2 space-y-2">
        {/* Format selection */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isZh ? '导出格式' : 'Format'}
          </label>
          <div className="space-y-1 mt-1">
            {FORMAT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedFormat(opt.value)}
                className={`
                  w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors
                  ${selectedFormat === opt.value
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-1 ring-indigo-300 dark:ring-indigo-700'
                    : 'bg-muted/30 hover:bg-muted/50'
                  }
                `}
              >
                <opt.icon size={12} className={selectedFormat === opt.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'} />
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-medium ${selectedFormat === opt.value ? 'text-indigo-700 dark:text-indigo-300' : 'text-foreground/70'}`}>
                    {isZh ? opt.zhName : opt.enName}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {isZh ? opt.zhDesc : opt.enDesc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs bg-muted/40 hover:bg-muted/60 text-foreground transition-colors"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            {copied ? (isZh ? '已复制' : 'Copied') : (isZh ? '复制' : 'Copy')}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            <Download size={12} />
            {isZh ? '下载' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  )
}
