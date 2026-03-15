"use client";

import { ZoomIn, ZoomOut, Maximize2, Download, X, FileText, Image, MoreVertical } from 'lucide-react';
import { LayoutType, LAYOUT_OPTIONS } from './MindMapCanvas';
import { useState, useRef, useEffect } from 'react';

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

  // 获取当前布局的中文名称
  const currentLayoutLabel = LAYOUT_OPTIONS.find(o => o.value === currentLayout)?.label || '布局';

  return (
    <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 gap-1 sm:gap-2">
      {/* 左侧：缩放控制 */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          onClick={onZoomOut}
          className="p-2 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors touch-manipulation"
          title="缩小"
        >
          <ZoomOut className="w-5 h-5 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 min-w-[40px] sm:min-w-[60px] text-center font-medium">
          {zoomPercent}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-2 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors touch-manipulation"
          title="放大"
        >
          <ZoomIn className="w-5 h-5 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <button
          onClick={onResetZoom}
          className="p-2 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors touch-manipulation hidden sm:block"
          title="重置视图"
        >
          <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* 中间：布局选择 */}
      <div className="flex items-center relative" ref={layoutMenuRef}>
        {/* 桌面端：下拉选择 */}
        <select
          value={currentLayout}
          onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
          className="hidden sm:block px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LAYOUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* 移动端：点击弹窗选择 */}
        <button
          onClick={() => setShowLayoutMenu(!showLayoutMenu)}
          className="sm:hidden px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 touch-manipulation"
        >
          {currentLayoutLabel}
        </button>

        {/* 移动端布局选择弹窗 */}
        {showLayoutMenu && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-50 overflow-hidden">
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
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {option.label}
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm transition-colors"
          >
            <Image className="w-4 h-4" />
            导出图片
          </button>
          {onExportMarkdown && (
            <button
              onClick={onExportMarkdown}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white text-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              导出MD
            </button>
          )}
        </div>

        {/* 移动端：更多菜单 */}
        <div className="sm:hidden relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors touch-manipulation"
            title="更多操作"
          >
            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* 移动端导出菜单 */}
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-50 overflow-hidden">
              <button
                onClick={() => {
                  onExport();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 touch-manipulation"
              >
                <Image className="w-4 h-4" />
                导出图片
              </button>
              {onExportMarkdown && (
                <button
                  onClick={() => {
                    onExportMarkdown();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 touch-manipulation"
                >
                  <FileText className="w-4 h-4" />
                  导出Markdown
                </button>
              )}
              <button
                onClick={() => {
                  onResetZoom();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 touch-manipulation sm:hidden"
              >
                <Maximize2 className="w-4 h-4" />
                重置视图
              </button>
            </div>
          )}
        </div>

        {/* 关闭按钮 - 移动端加大触摸区域 */}
        <button
          onClick={onClose}
          className="p-2 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors touch-manipulation"
          title="关闭"
        >
          <X className="w-5 h-5 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </div>
  );
}