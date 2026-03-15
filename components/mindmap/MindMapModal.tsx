"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
// 使用 full 版本，包含 Export、TouchEvent 等插件
import MindMap from 'simple-mind-map/full';
import { MindMapNode } from '@/store/types';
import { toSimpleMindMapData } from './markdownParser';
import { MindMapToolbar, LAYOUT_OPTIONS } from './MindMapToolbar';

export type LayoutType = 'logicalStructure' | 'mindMap' | 'organizationStructure' | 'catalogOrganization' | 'timeline';

interface MindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MindMapNode | null;
  title: string;
}

// 将 MindMapNode 转换为 Markdown 格式
function mindMapNodeToMarkdown(node: MindMapNode, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  const bullet = depth === 0 ? '# ' : '- ';
  let result = `${indent}${bullet}${node.text}\n`;

  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      result += mindMapNodeToMarkdown(child, depth + 1);
    });
  }

  return result;
}

export function MindMapModal({ isOpen, onClose, data, title }: MindMapModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindMap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('logicalStructure');
  const [isExporting, setIsExporting] = useState(false);

  // 初始化/更新思维导图
  useEffect(() => {
    if (!isOpen || !containerRef.current || !data) return;

    // 延迟一帧确保容器已渲染
    const timer = setTimeout(() => {
      // 清理旧实例
      if (mindMapRef.current) {
        mindMapRef.current.destroy();
        mindMapRef.current = null;
      }

      // 创建新实例
      const mindMap = new MindMap({
        el: containerRef.current!,
        data: toSimpleMindMapData(data),
        layout: currentLayout,
        theme: 'default',
        fit: true,
        // 禁用编辑但启用手势
        enableEdit: false,
        enableNodeDrag: false,
        // 启用双击缩放
        enableDblclickZoom: true,
        // 启用触摸缩放（双指捏合）
        disableTouchZoom: false,
        minTouchZoomScale: 0.2,
        maxTouchZoomScale: 3,
        // 鼠标滚轮缩放
        disableMouseWheelZoom: false,
        // 移动画布相关
        isDisableDrag: false,
        // 样式配置
        style: {
          lineColor: '#4a90d9',
          lineWidth: 2,
        },
        // 主题配置
        themeConfig: {
          paddingX: 30,
          paddingY: 30,
        },
        // 节点样式
        nodeStyle: {
          padding: '10px 15px',
          fontSize: '14px',
          borderRadius: '6px',
        },
        // fit 时的内边距
        fitPadding: 20,
      });

      mindMapRef.current = mindMap;

      // 监听缩放变化
      mindMap.on('scale', (scale: number) => {
        setZoom(scale);
      });

      // 初始适配
      setTimeout(() => {
        mindMap.fit();
      }, 100);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mindMapRef.current) {
        mindMapRef.current.destroy();
        mindMapRef.current = null;
      }
    };
  }, [isOpen, data, currentLayout]);

  // 关闭时清理
  const handleClose = useCallback(() => {
    if (mindMapRef.current) {
      mindMapRef.current.destroy();
      mindMapRef.current = null;
    }
    onClose();
  }, [onClose]);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    if (mindMapRef.current) {
      mindMapRef.current.enlarge();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mindMapRef.current) {
      mindMapRef.current.narrow();
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (mindMapRef.current) {
      mindMapRef.current.setScale(1);
      mindMapRef.current.fit();
    }
  }, []);

  // 布局切换
  const handleLayoutChange = useCallback((layout: LayoutType) => {
    setCurrentLayout(layout);
  }, []);

  // 导出为图片 - 兼容移动端
  const handleExport = useCallback(async () => {
    if (!mindMapRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const pngData = await mindMapRef.current.export('png', true);

      // 检查是否支持 Web Share API（移动端）
      if (navigator.share && navigator.canShare) {
        try {
          // 将 base64 转换为 Blob
          const response = await fetch(pngData);
          const blob = await response.blob();
          const file = new File([blob], `mindmap-${title || 'export'}.png`, { type: 'image/png' });

          await navigator.share({
            title: title || '思维导图',
            files: [file]
          });
        } catch (shareError) {
          // 用户取消分享或分享失败，回退到下载
          console.log('Share failed, falling back to download:', shareError);
          downloadImage(pngData, title);
        }
      } else {
        // 桌面端或不支持分享，直接下载
        downloadImage(pngData, title);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [title, isExporting]);

  // 下载图片的辅助函数
  const downloadImage = (pngData: string, title: string) => {
    const link = document.createElement('a');
    link.href = pngData;
    link.download = `mindmap-${title || 'export'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 导出为 Markdown
  const handleExportMarkdown = useCallback(() => {
    if (!data) return;

    const markdown = `# ${title || '思维导图'}\n\n${mindMapNodeToMarkdown(data, 0)}`;

    // 检查是否支持 Web Share API（移动端）
    if (navigator.share && navigator.canShare) {
      try {
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const file = new File([blob], `mindmap-${title || 'export'}.md`, { type: 'text/markdown' });

        navigator.share({
          title: title || '思维导图',
          text: markdown,
          files: [file]
        }).catch(() => {
          // 分享失败，回退到下载
          downloadMarkdown(markdown, title);
        });
      } catch {
        downloadMarkdown(markdown, title);
      }
    } else {
      // 桌面端直接下载
      downloadMarkdown(markdown, title);
    }
  }, [data, title]);

  // 下载 Markdown 的辅助函数
  const downloadMarkdown = (markdown: string, title: string) => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap-${title || 'export'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!data) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed inset-0 sm:inset-4 md:inset-8 bg-white dark:bg-gray-900 sm:rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* 标题栏 - 移动端固定高度 */}
          <div className="shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <Dialog.Title className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              {title || '思维导图'}
            </Dialog.Title>
          </div>

          {/* 工具栏 */}
          <MindMapToolbar
            zoom={zoom}
            currentLayout={currentLayout}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onLayoutChange={handleLayoutChange}
            onExport={handleExport}
            onExportMarkdown={handleExportMarkdown}
            onClose={handleClose}
          />

          {/* 画布容器 - 移动端全屏 */}
          <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800 touch-pan-x touch-pan-y">
            <div
              ref={containerRef}
              className="w-full h-full"
              style={{ minHeight: '300px', touchAction: 'pan-x pan-y' }}
            />
          </div>

          {/* 导出中状态提示 */}
          {isExporting && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
              <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-xl">
                <span className="text-gray-700 dark:text-gray-200">正在导出...</span>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}