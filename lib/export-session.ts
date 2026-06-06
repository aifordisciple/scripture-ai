/**
 * HTML 导出工具 — 将 AI 会话导出为自包含的精美 HTML 文档。
 */

import { stripAllThinkTags } from '@/lib/ai'

export interface ExportMessage {
  id: string
  role: 'user' | 'assistant' | string
  content: string
}

export interface BuildSessionHTMLOptions {
  title: string
  modeLabel: string
  locale: string
  messages: ExportMessage[]
  userLabel: string
  aiLabel: string
  generatedAt: Date
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 轻量级 Markdown -> HTML，覆盖会话中的常见语法。
// 顺序：先块级元素，再行内元素，最后再处理段落。
function markdownToHtml(md: string): string {
  let html = escapeHtml(md)

  // 代码块
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${code}</code></pre>`)
  // 行内代码
  html = html.replace(/`([^`\n]+)`/g, (_m, code) => `<code>${code}</code>`)

  // 引用块
  html = html.replace(/(^|\n)&gt; ?([^\n]*)/g, '$1<blockquote>$2</blockquote>')
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>')

  // 标题
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')

  // 水平线
  html = html.replace(/^---+$/gm, '<hr>')

  // 粗体 / 斜体
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
  html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
  html = html.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>')

  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) =>
    `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`
  )

  // 无序 / 有序列表
  html = html.replace(/(^|\n)[-*]\s+([^\n]+)/g, '$1<li>$2</li>')
  html = html.replace(/(<li>[^<]*<\/li>)(?:\n<li>[^<]*<\/li>)+/g, (block) => `<ul>${block.replace(/\n/g, '')}</ul>`)
  html = html.replace(/(^|\n)\d+\.\s+([^\n]+)/g, '$1<oli>$2</oli>')
  html = html.replace(/(<oli>[^<]*<\/oli>)(?:\n<oli>[^<]*<\/oli>)+/g, (block) => `<ol>${block.replace(/\n/g, '')}</ol>`)
  html = html.replace(/<oli>/g, '<li>').replace(/<\/oli>/g, '</li>')

  // 段落：将相邻的非空行包裹在 <p> 中
  const blocks = html.split(/\n{2,}/)
  html = blocks.map((block) => {
    if (/^<(h\d|ul|ol|blockquote|pre|hr|p|li)/.test(block.trim())) return block
    if (!block.trim()) return ''
    const inline = block.replace(/\n/g, '<br>')
    return `<p>${inline}</p>`
  }).join('\n')

  return html
}

const STYLES = `
  :root {
    color-scheme: light dark;
    --bg: #faf7f2;
    --bg-gradient: linear-gradient(135deg, #faf7f2 0%, #f3ede2 100%);
    --card: #ffffff;
    --text: #1f1d1a;
    --text-muted: #6b655c;
    --border: #e8e0d2;
    --primary: #b08d57;
    --primary-soft: rgba(176, 141, 87, 0.1);
    --user-bg: linear-gradient(135deg, #b08d57 0%, #9a7a4a 100%);
    --user-text: #ffffff;
    --ai-bg: #ffffff;
    --ai-border: #e8e0d2;
    --code-bg: #f5efe2;
    --blockquote-border: #b08d57;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1a1814;
      --bg-gradient: linear-gradient(135deg, #1a1814 0%, #221f19 100%);
      --card: #25221c;
      --text: #f0ebe0;
      --text-muted: #a89f8c;
      --border: #3a352c;
      --primary: #d4af7a;
      --primary-soft: rgba(212, 175, 122, 0.12);
      --user-bg: linear-gradient(135deg, #d4af7a 0%, #b89261 100%);
      --user-text: #1a1814;
      --ai-bg: #25221c;
      --ai-border: #3a352c;
      --code-bg: #2e2a22;
      --blockquote-border: #d4af7a;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif;
    background: var(--bg-gradient);
    color: var(--text);
    line-height: 1.7;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }
  .container { max-width: 760px; margin: 0 auto; padding: 48px 24px 80px; }
  header.page-header {
    text-align: center;
    margin-bottom: 48px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--border);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--primary);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .brand-mark {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 14px;
  }
  h1.title {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 12px;
    letter-spacing: -0.02em;
    line-height: 1.3;
  }
  .meta { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--text-muted); }
  .meta-item { display: inline-flex; align-items: center; gap: 6px; }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--primary-soft);
    color: var(--primary);
    font-size: 12px;
    font-weight: 600;
  }
  .messages { display: flex; flex-direction: column; gap: 24px; }
  .message {
    border-radius: 16px;
    padding: 20px 24px;
    background: var(--ai-bg);
    border: 1px solid var(--ai-border);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }
  .message.user {
    background: var(--user-bg);
    color: var(--user-text);
    border-color: transparent;
    margin-left: 48px;
  }
  .message.assistant { margin-right: 24px; }
  .message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 600;
  }
  .message.user .message-header { color: rgba(255, 255, 255, 0.85); }
  .message.assistant .message-header { color: var(--text-muted); }
  .avatar { font-size: 14px; }
  .role { letter-spacing: 0.04em; }
  .index { margin-left: auto; font-size: 11px; opacity: 0.55; font-weight: 500; }
  .message-body { font-size: 15px; }
  .message-body p { margin: 0 0 12px; }
  .message-body p:last-child { margin-bottom: 0; }
  .message-body h1, .message-body h2, .message-body h3,
  .message-body h4, .message-body h5, .message-body h6 {
    margin: 20px 0 12px;
    font-weight: 700;
    line-height: 1.4;
  }
  .message-body h1 { font-size: 1.5em; }
  .message-body h2 { font-size: 1.3em; }
  .message-body h3 { font-size: 1.15em; }
  .message-body h4 { font-size: 1em; }
  .message-body ul, .message-body ol { margin: 0 0 12px; padding-left: 24px; }
  .message-body li { margin: 4px 0; }
  .message-body strong { font-weight: 700; }
  .message-body em { font-style: italic; }
  .message-body code {
    background: var(--code-bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.9em;
  }
  .message-body pre {
    background: var(--code-bg);
    padding: 14px 16px;
    border-radius: 10px;
    overflow-x: auto;
    margin: 0 0 12px;
  }
  .message-body pre code {
    background: transparent;
    padding: 0;
    font-size: 13px;
    line-height: 1.5;
  }
  .message-body blockquote {
    margin: 0 0 12px;
    padding: 8px 16px;
    border-left: 3px solid var(--blockquote-border);
    background: var(--primary-soft);
    border-radius: 0 8px 8px 0;
    color: inherit;
  }
  .message-body hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .message-body a { color: var(--primary); text-decoration: underline; text-underline-offset: 2px; }
  .message.user .message-body a { color: #fff; }
  footer.page-footer {
    margin-top: 64px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
  }
  @media (max-width: 600px) {
    .container { padding: 32px 16px 60px; }
    h1.title { font-size: 24px; }
    .message.user { margin-left: 12px; }
    .message.assistant { margin-right: 0; }
    .message { padding: 16px 18px; }
  }
  @media print {
    body { background: #fff; }
    .message { box-shadow: none; break-inside: avoid; }
  }
`

export function buildSessionHTML({
  title,
  modeLabel,
  locale,
  messages,
  userLabel,
  aiLabel,
  generatedAt,
}: BuildSessionHTMLOptions): string {
  const safeTitle = escapeHtml(title)
  const safeModeLabel = escapeHtml(modeLabel)
  const dateStr = generatedAt.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const messagesHtml = messages
    .map((m, idx) => {
      const cleaned = m.role === 'assistant' ? stripAllThinkTags(m.content) : m.content
      const body = markdownToHtml(cleaned)
      const isUser = m.role === 'user'
      const roleLabel = isUser ? escapeHtml(userLabel) : escapeHtml(aiLabel)
      const avatar = isUser ? '👤' : '✨'
      const sideClass = isUser ? 'user' : 'assistant'
      return (
        '<article class="message ' + sideClass + '" id="msg-' + (idx + 1) + '">' +
          '<header class="message-header">' +
            '<span class="avatar">' + avatar + '</span>' +
            '<span class="role">' + roleLabel + '</span>' +
            '<span class="index">#' + (idx + 1) + '</span>' +
          '</header>' +
          '<div class="message-body">' + body + '</div>' +
        '</article>'
      )
    })
    .join('\n')

  const head =
    '<!DOCTYPE html>' +
    '<html lang="' + escapeHtml(locale) + '">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + safeTitle + ' · AI 读</title>' +
    '<style>' + STYLES + '</style>' +
    '</head>'

  const body =
    '<body>' +
    '<div class="container">' +
      '<header class="page-header">' +
        '<div class="brand">' +
          '<span class="brand-mark">✦</span>' +
          '<span>AI 读 · Bible AI</span>' +
        '</div>' +
        '<h1 class="title">' + safeTitle + '</h1>' +
        '<div class="meta">' +
          '<span class="meta-item"><span class="badge">' + safeModeLabel + '</span></span>' +
          '<span class="meta-item">📅 ' + escapeHtml(dateStr) + '</span>' +
          '<span class="meta-item">💬 ' + messages.length + ' 条消息</span>' +
        '</div>' +
      '</header>' +
      '<main class="messages">' + messagesHtml + '</main>' +
      '<footer class="page-footer">由 AI 读 生成 · ' + escapeHtml(dateStr) + '</footer>' +
    '</div>' +
    '</body>' +
    '</html>'

  return head + body
}
