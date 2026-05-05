"use client";

import { ZoomIn, ZoomOut, Maximize2, Download, X, FileText, Image, MoreVertical } from 'lucide-react';
import { LayoutType, LAYOUT_OPTIONS } from './MindMapCanvas';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

interface MindMapToolbarProps {
  zoom: number;
  currentLayout: LayoutType;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onLayoutChange: (layout: LayoutType) => void;
  onExport: () => void;
  onExportMarkdown?: () => void;
  onClose: () => void;
}

export function MindMapToolbar({
  zoom,
  currentLayout,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onLayoutChange,
  onExport,
  onExportMarkdown,
  onClose,
}: MindMapToolbarProps) {
  const zoomPercent = Math.round(zoom * 100);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(event.target as Node)) {
        setShowLayoutMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // 获取当前布局的名称
  const currentLayoutKey = LAYOUT_OPTIONS.find(o => o.value === currentLayout)?.label || 'mindmap.layoutDefault';
  const currentLayoutLabel = t(currentLayoutKey);

  return (
    <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-border dark:border-border bg-white dark:bg-accent gap-1 sm:gap-2">
      {/* 左侧：缩放控制 */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          onClick={onZoomOut}
          className="p-2 sm:p-2 rounded-xl hover:bg-accent dark:hover:bg-accent active:bg-accent dark:active:bg-accent transition-colors touch-manipulation"
          title={t('mindmap.zoomOut')}
        >
          <ZoomOut className="w-5 h-5 sm:w-5 sm:h-5 text-muted-foreground dark:text-foreground" />
        </button>

        <span className="text-xs sm:text-sm text-muted-foreground dark:text-foreground min-w-[40px] sm:min-w-[60px] text-center font-medium">
          {zoomPercent}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-2 sm:p-2 rounded-xl hover:bg-accent dark:hover:bg-accent active:bg-accent dark:active:bg-accent transition-colors touch-manipulation"
          title={t('mindmap.zoomIn')}
        >
          <ZoomIn className="w-5 h-5 sm:w-5 sm:h-5 text-muted-foreground dark:text-foreground" />
        </button>

        <button
          onClick={onResetZoom}
          className="p-2 sm:p-2 rounded-xl hover:bg-accent dark:hover:bg-accent active:bg-accent dark:active:bg-accent transition-colors touch-manipulation hidden sm:block"
          title={t('mindmap.resetView')}
        >
          <Maximize2 className="w-5 h-5 text-muted-foreground dark:text-foreground" />
        </button>
      </div>

      {/* 中间：布局选择 */}
      <div className="flex items-center relative" ref={layoutMenuRef}>
        {/* 桌面端：下拉选择 */}
        <select
          value={currentLayout}
          onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
          className="hidden sm:block px-3 py-1.5 rounded-xl border border-border dark:border-border bg-white dark:bg-accent text-sm text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LAYOUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </select>

        {/* 移动端：点击弹窗选择 */}
        <button
          onClick={() => setShowLayoutMenu(!showLayoutMenu)}
          className="sm:hidden px-3 py-2 rounded-xl border border-border dark:border-border bg-white dark:bg-accent text-sm text-foreground dark:text-foreground touch-manipulation"
        >
          {currentLayoutLabel}
        </button>

        {/* 移动端布局选择弹窗 */}
        {showLayoutMenu && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white dark:bg-accent rounded-xl shadow-xl shadow-black/10 border dark:border-border z-50 overflow-hidden">
            {LAYOUT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onLayoutChange(option.value);
                  setShowLayoutMenu(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm touch-manipulation ${
                  currentLayout === option.value
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-foreground dark:text-foreground hover:bg-accent/50 dark:hover:bg-accent/50'
                }`}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 右侧：导出和关闭 */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* 桌面端：直接显示导出按钮 */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm transition-colors"
          >
            <Image className="w-4 h-4" />
            {t('mindmap.exportImage')}
          </button>
          {onExportMarkdown && (
            <button
              onClick={onExportMarkdown}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent active:bg-accent text-white text-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t('mindmap.exportMD')}
            </button>
          )}
        </div>

        {/* 移动端：更多菜单 */}
        <div className="sm:hidden relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 rounded-xl hover:bg-accent dark:hover:bg-accent active:bg-accent dark:active:bg-accent transition-colors touch-manipulation"
            title={t('mindmap.moreActions')}
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground dark:text-foreground" />
          </button>

          {/* 移动端导出菜单 */}
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-2 w-36 bg-white dark:bg-accent rounded-xl shadow-xl shadow-black/10 border dark:border-border z-50 overflow-hidden">
              <button
                onClick={() => {
                  onExport();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-foreground dark:text-foreground hover:bg-accent/50 dark:hover:bg-accent/50 touch-manipulation"
              >
                <Image className="w-4 h-4" />
                {t('mindmap.exportImage')}
              </button>
              {onExportMarkdown && (
                <button
                  onClick={() => {
                    onExportMarkdown();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-foreground dark:text-foreground hover:bg-accent/50 dark:hover:bg-accent/50 touch-manipulation"
                >
                  <FileText className="w-4 h-4" />
                  {t('mindmap.exportMarkdown')}
                </button>
              )}
              <button
                onClick={() => {
                  onResetZoom();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-foreground dark:text-foreground hover:bg-accent/50 dark:hover:bg-accent/50 touch-manipulation sm:hidden"
              >
                <Maximize2 className="w-4 h-4" />
                {t('mindmap.resetView')}
              </button>
            </div>
          )}
        </div>

        {/* 关闭按钮 - 移动端加大触摸区域 */}
        <button
          onClick={onClose}
          className="p-2 sm:p-2 rounded-xl hover:bg-accent dark:hover:bg-accent active:bg-accent dark:active:bg-accent transition-colors touch-manipulation"
          title={t('mindmap.close')}
        >
          <X className="w-5 h-5 sm:w-5 sm:h-5 text-muted-foreground dark:text-foreground" />
        </button>
      </div>
    </div>
  );
}
