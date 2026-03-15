"use client";

import { ZoomIn, ZoomOut, Maximize2, Download, X } from 'lucide-react';
import { LayoutType, LAYOUT_OPTIONS } from './MindMapCanvas';

interface MindMapToolbarProps {
  zoom: number;
  currentLayout: LayoutType;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onLayoutChange: (layout: LayoutType) => void;
  onExport: () => void;
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
  onClose,
}: MindMapToolbarProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* 左侧：缩放控制 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="缩小"
        >
          <ZoomOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px] text-center">
          {zoomPercent}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="放大"
        >
          <ZoomIn className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <button
          onClick={onResetZoom}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2"
          title="重置视图"
        >
          <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* 中间：布局选择 */}
      <div className="flex items-center gap-2">
        <select
          value={currentLayout}
          onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LAYOUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 右侧：导出和关闭 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          导出图片
        </button>

        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="关闭"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </div>
  );
}