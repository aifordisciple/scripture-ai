// apps/desktop/src/components/PrintPreview.tsx
/**
 * Print preview and print functionality for verses
 *
 * Allows printing selected verses or entire chapters
 */

import { useState } from 'react';
import { Printer, X, FileText, BookOpen } from 'lucide-react';

interface PrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  bookName: string;
  chapter: number;
  verses: {
    verse: number;
    text: string;
    textEn?: string;
  }[];
  selectedVerses?: number[];
}

export function PrintPreview({
  isOpen,
  onClose,
  bookName,
  chapter,
  verses,
  selectedVerses,
}: PrintPreviewProps) {
  const [includeEnglish, setIncludeEnglish] = useState(false);
  const [fontSize, setFontSize] = useState(12);

  if (!isOpen) return null;

  // Filter verses if specific ones are selected
  const versesToPrint = selectedVerses && selectedVerses.length > 0
    ? verses.filter(v => selectedVerses.includes(v.verse))
    : verses;

  const handlePrint = () => {
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('无法打开打印窗口，请检查弹窗设置');
      return;
    }

    // Build HTML content
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${bookName} ${chapter}章 - AI读</title>
        <style>
          body {
            font-family: "Noto Serif SC", serif;
            font-size: ${fontSize}pt;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
          }
          h1 {
            font-size: 18pt;
            text-align: center;
            margin-bottom: 30px;
            color: #111;
          }
          .verse {
            margin-bottom: 12px;
            text-indent: 2em;
          }
          .verse-number {
            font-size: 10pt;
            color: #666;
            vertical-align: super;
            margin-right: 4px;
          }
          .verse-text {
            font-size: ${fontSize}pt;
          }
          .verse-text-en {
            display: block;
            font-size: ${(fontSize * 0.9).toFixed(1)}pt;
            color: #555;
            margin-top: 4px;
            font-style: italic;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10pt;
            color: #999;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>${bookName} ${chapter}章</h1>
        ${versesToPrint.map(v => `
          <div class="verse">
            <span class="verse-number">${v.verse}</span>
            <span class="verse-text">${v.text}</span>
            ${includeEnglish && v.textEn ? `<span class="verse-text-en">${v.textEn}</span>` : ''}
          </div>
        `).join('')}
        <div class="footer">
          打印自 AI读 (aidu.app) - ${new Date().toLocaleDateString('zh-CN')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Trigger print after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content print-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Printer className="w-5 h-5" />
            <h3>打印预览</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          {/* Print Options */}
          <div className="print-options">
            <div className="print-option">
              <label>
                <input
                  type="checkbox"
                  checked={includeEnglish}
                  onChange={(e) => setIncludeEnglish(e.target.checked)}
                />
                包含英文经文 (KJV)
              </label>
            </div>
            <div className="print-option">
              <label>
                字体大小:
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                >
                  <option value={10}>10pt</option>
                  <option value={11}>11pt</option>
                  <option value={12}>12pt</option>
                  <option value={14}>14pt</option>
                  <option value={16}>16pt</option>
                </select>
              </label>
            </div>
          </div>

          {/* Preview Info */}
          <div className="print-info">
            <BookOpen className="w-5 h-5" />
            <span>
              {bookName} {chapter}章
              {selectedVerses && selectedVerses.length > 0 && (
                <span> (第 {selectedVerses.join(', ')} 节)</span>
              )}
            </span>
          </div>

          {/* Preview Content */}
          <div className="print-preview-content" style={{ fontSize: `${fontSize}px` }}>
            {versesToPrint.slice(0, 5).map(v => (
              <div key={v.verse} className="preview-verse">
                <span className="verse-number">{v.verse}</span>
                <span>{v.text}</span>
                {includeEnglish && v.textEn && (
                  <div className="preview-verse-en">{v.textEn}</div>
                )}
              </div>
            ))}
            {versesToPrint.length > 5 && (
              <div className="preview-more">
                ... 还有 {versesToPrint.length - 5} 节
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            打印
          </button>
        </div>
      </div>
    </div>
  );
}