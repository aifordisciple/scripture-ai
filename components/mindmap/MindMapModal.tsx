"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import MindMap from 'simple-mind-map';
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

export function MindMapModal({ isOpen, onClose, data, title }: MindMapModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindMap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('logicalStructure');

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
        enableEdit: false,
        enableNodeDrag: false,
        style: {
          lineColor: '#4a90d9',
          lineWidth: 2,
        },
        // 主题配置
        themeConfig: {
          paddingX: 30,
          paddingY: 30,
        },
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

  // 导出为图片
  const handleExport = useCallback(async () => {
    if (mindMapRef.current) {
      try {
        const pngData = await mindMapRef.current.export('png', true);
        const link = document.createElement('a');
        link.href = pngData;
        link.download = `mindmap-${title || 'export'}.png`;
        link.click();
      } catch (error) {
        console.error('Export failed:', error);
      }
    }
  }, [title]);

  if (!data) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed inset-4 md:inset-8 bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* 标题 */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white truncate">
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
            onClose={handleClose}
          />

          {/* 画布容器 */}
          <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800">
            <div
              ref={containerRef}
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}