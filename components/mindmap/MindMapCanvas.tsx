"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import MindMap from 'simple-mind-map';
import { MindMapNode } from '@/store/types';
import { toSimpleMindMapData } from './markdownParser';

// 布局类型定义
export type LayoutType = 'logicalStructure' | 'mindMap' | 'organizationStructure' | 'catalogOrganization' | 'timeline';

interface LayoutOption {
  value: LayoutType;
  label: string;
}

// 可用的布局选项
export const LAYOUT_OPTIONS: LayoutOption[] = [
  { value: 'logicalStructure', label: '逻辑结构图' },
  { value: 'mindMap', label: '思维导图' },
  { value: 'organizationStructure', label: '组织结构图' },
  { value: 'catalogOrganization', label: '目录组织图' },
  { value: 'timeline', label: '时间轴' },
];

interface MindMapCanvasProps {
  data: MindMapNode;
  onZoomChange?: (zoom: number) => void;
  onLayoutChange?: (layout: LayoutType) => void;
  currentLayout?: LayoutType;
}

export function MindMapCanvas({ data, onZoomChange, onLayoutChange, currentLayout = 'logicalStructure' }: MindMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindMap | null>(null);
  const [zoom, setZoom] = useState(1);

  // 初始化思维导图
  useEffect(() => {
    if (!containerRef.current) return;

    // 清理旧实例
    if (mindMapRef.current) {
      mindMapRef.current.destroy();
    }

    // 创建新实例
    const mindMap = new MindMap({
      el: containerRef.current,
      data: toSimpleMindMapData(data),
      layout: currentLayout,
      theme: 'default',
      fit: true,
      // 禁用编辑
      enableEdit: false,
      enableNodeDrag: false,
      // 样式配置
      style: {
        lineColor: '#4a90d9',
        lineWidth: 2,
      },
      // 节点样式
      nodeStyle: {
        padding: '10px 15px',
        fontSize: '14px',
        borderRadius: '6px',
      },
      // 主题配置
      themeConfig: {
        paddingX: 20,
        paddingY: 20,
      },
    });

    mindMapRef.current = mindMap;

    // 监听缩放变化
    mindMap.on('scale', (scale: number) => {
      setZoom(scale);
      onZoomChange?.(scale);
    });

    // 初始适配
    setTimeout(() => {
      mindMap.fit();
    }, 100);

    return () => {
      if (mindMapRef.current) {
        mindMapRef.current.destroy();
        mindMapRef.current = null;
      }
    };
  }, [data, currentLayout, onZoomChange]);

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
    if (mindMapRef.current) {
      mindMapRef.current.setLayout(layout);
      onLayoutChange?.(layout);
    }
  }, [onLayoutChange]);

  // 导出为图片
  const handleExport = useCallback(async () => {
    if (mindMapRef.current) {
      try {
        const pngData = await mindMapRef.current.export('png', true);
        // 创建下载链接
        const link = document.createElement('a');
        link.href = pngData;
        link.download = `mindmap-${Date.now()}.png`;
        link.click();
      } catch (error) {
        console.error('Export failed:', error);
      }
    }
  }, []);

  return {
    containerRef,
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleLayoutChange,
    handleExport,
    currentLayout,
  };
}

// 单独的画布渲染组件
export function MindMapCanvasView({ data, currentLayout = 'logicalStructure' }: { data: MindMapNode; currentLayout?: LayoutType }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 清理旧实例
    if (mindMapRef.current) {
      mindMapRef.current.destroy();
    }

    // 创建新实例
    const mindMap = new MindMap({
      el: containerRef.current,
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
    });

    mindMapRef.current = mindMap;

    // 初始适配
    setTimeout(() => {
      mindMap.fit();
    }, 100);

    return () => {
      if (mindMapRef.current) {
        mindMapRef.current.destroy();
        mindMapRef.current = null;
      }
    };
  }, [data, currentLayout]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  );
}