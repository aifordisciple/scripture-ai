'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  category: string;
  verseCount: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  source: string;
  target: string;
  type: string;
  strength: number;
  description?: string;
}

interface NetworkGraphProps {
  data: {
    nodes: Node[];
    edges: Edge[];
  };
  selectedNodeId?: string | null;
  onNodeClick?: (node: Node) => void;
}

// 颜色映射
const categoryColors: Record<string, string> = {
  THEOLOGICAL: '#6366f1', // indigo
  ETHICAL: '#10b981',     // emerald
  HISTORICAL: '#f59e0b',  // amber
  PROPHETIC: '#ef4444',   // red
};

const categoryLabels: Record<string, string> = {
  THEOLOGICAL: '神学主题',
  ETHICAL: '伦理主题',
  HISTORICAL: '历史主题',
  PROPHETIC: '预言主题',
};

// 边类型颜色
const edgeTypeColors: Record<string, string> = {
  RELATED: '#9ca3af',   // gray
  PARENT: '#3b82f6',    // blue
  CHILD: '#8b5cf6',     // purple
  CONTRAST: '#ef4444',  // red
  FULFILLS: '#10b981',  // green
};

// 边类型标签
const edgeTypeLabels: Record<string, string> = {
  RELATED: '关联',
  PARENT: '父主题',
  CHILD: '子主题',
  CONTRAST: '对比',
  FULFILLS: '成全',
};

export default function NetworkGraph({ data, selectedNodeId, onNodeClick }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useBibleStore();
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef<{ x: number; y: number; node: Node | null; edge: Edge | null }>({ x: 0, y: 0, node: null, edge: null });

  // 缩放和平移状态
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // 边详情状态
  const [selectedEdge, setSelectedEdge] = useState<{edge: Edge; sourceNode: Node; targetNode: Node} | null>(null);

  // 初始化节点位置
  const initializePositions = useCallback(() => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    nodesRef.current = data.nodes.map((node, index) => {
      const angle = (index / data.nodes.length) * 2 * Math.PI;
      const radius = 150 + Math.random() * 100;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
      };
    });
    edgesRef.current = data.edges;
  }, [data]);

  // 力导向布局模拟
  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    // 应用力
    nodes.forEach((node, i) => {
      // 斥力（节点间）
      nodes.forEach((other, j) => {
        if (i === j) return;
        const dx = (node.x || 0) - (other.x || 0);
        const dy = (node.y || 0) - (other.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 5000 / (distance * distance);
        node.vx = (node.vx || 0) + (dx / distance) * force;
        node.vy = (node.vy || 0) + (dy / distance) * force;
      });

      // 引力（边连接的节点）
      edges.forEach((edge) => {
        let source: Node | undefined;
        let target: Node | undefined;

        if (edge.source === node.id) {
          source = node;
          target = nodes.find(n => n.id === edge.target);
        } else if (edge.target === node.id) {
          source = node;
          target = nodes.find(n => n.id === edge.source);
        }

        if (source && target) {
          const dx = (target.x || 0) - (source.x || 0);
          const dy = (target.y || 0) - (source.y || 0);
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (distance - 100) * 0.01 * (edge.strength || 0.5);
          source.vx = (source.vx || 0) + (dx / distance) * force;
          source.vy = (source.vy || 0) + (dy / distance) * force;
        }
      });

      // 中心引力
      const centerX = width / 2;
      const centerY = height / 2;
      node.vx = (node.vx || 0) + (centerX - (node.x || 0)) * 0.001;
      node.vy = (node.vy || 0) + (centerY - (node.y || 0)) * 0.001;

      // 阻尼
      node.vx = (node.vx || 0) * 0.9;
      node.vy = (node.vy || 0) * 0.9;

      // 更新位置
      node.x = Math.max(50, Math.min(width - 50, (node.x || 0) + (node.vx || 0)));
      node.y = Math.max(50, Math.min(height - 50, (node.y || 0) + (node.vy || 0)));
    });
  }, []);

  // 绘制
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 清空画布
    ctx.fillStyle = isDarkMode ? '#111827' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    // 应用变换
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    // 绘制边
    edges.forEach((edge) => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (source && target && source.x && source.y && target.x && target.y) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        // 根据边类型设置颜色
        const edgeColor = edgeTypeColors[edge.type] || edgeTypeColors.RELATED;
        ctx.strokeStyle = isDarkMode
          ? edgeColor.replace('#', 'rgba(').replace(/(.{2})(.{2})(.{2})/, (_, r, g, b) =>
              `${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, 0.6)`)
          : edgeColor.replace('#', 'rgba(').replace(/(.{2})(.{2})(.{2})/, (_, r, g, b) =>
              `${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, 0.4)`);

        // 根据强度设置线宽
        ctx.lineWidth = Math.max(1, edge.strength * 3);

        // 虚线样式（对于弱关联）
        if (edge.strength < 0.5) {
          ctx.setLineDash([5, 5]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.stroke();
      }
    });

    ctx.setLineDash([]);

    // 绘制节点
    nodes.forEach((node) => {
      if (!node.x || !node.y) return;

      const isSelected = node.id === selectedNodeId;
      const isHovered = mouseRef.current.node?.id === node.id;
      const baseRadius = Math.max(10, Math.min(30, Math.sqrt(node.verseCount) * 2));
      const radius = isSelected || isHovered ? baseRadius * 1.3 : baseRadius;

      // 节点圆形
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = categoryColors[node.category] || '#6366f1';
      ctx.fill();

      // 选中边框
      if (isSelected) {
        ctx.strokeStyle = isDarkMode ? '#fff' : '#000';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // 悬停光晕
      if (isHovered && !isSelected) {
        ctx.strokeStyle = categoryColors[node.category] || '#6366f1';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // 节点标签
      if (radius > 15 || isSelected || isHovered) {
        ctx.fillStyle = isDarkMode ? '#fff' : '#000';
        ctx.font = `${isSelected || isHovered ? 14 : 12}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name, node.x, node.y + radius + 15);
      }
    });

    ctx.restore();

    // 继续动画
    simulate();
    animationRef.current = requestAnimationFrame(draw);
  }, [isDarkMode, selectedNodeId, simulate, scale, offset]);

  // 鼠标交互
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    // 平移
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // 检查是否悬停在节点上
    const hoveredNode = nodesRef.current.find((node) => {
      if (!node.x || !node.y) return false;
      const dx = x - node.x;
      const dy = y - node.y;
      const radius = Math.max(10, Math.min(30, Math.sqrt(node.verseCount) * 2));
      return dx * dx + dy * dy < radius * radius;
    });

    // 检查是否悬停在边上
    let hoveredEdge: Edge | null = null;
    if (!hoveredNode) {
      hoveredEdge = edgesRef.current.find((edge) => {
        const source = nodesRef.current.find(n => n.id === edge.source);
        const target = nodesRef.current.find(n => n.id === edge.target);
        if (!source?.x || !source?.y || !target?.x || !target?.y) return false;

        // 计算点到线段的距离
        const lineLen = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2));
        if (lineLen === 0) return false;

        const t = Math.max(0, Math.min(1, ((x - source.x) * (target.x - source.x) + (y - source.y) * (target.y - source.y)) / (lineLen * lineLen)));
        const nearX = source.x + t * (target.x - source.x);
        const nearY = source.y + t * (target.y - source.y);
        const dist = Math.sqrt(Math.pow(x - nearX, 2) + Math.pow(y - nearY, 2));

        return dist < 10; // 10像素内的点击容差
      }) || null;
    }

    mouseRef.current = { x, y, node: hoveredNode || null, edge: hoveredEdge };
    canvas.style.cursor = hoveredNode ? 'pointer' : (hoveredEdge ? 'pointer' : (isDraggingRef.current ? 'grabbing' : 'grab'));
  }, [scale, offset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!mouseRef.current.node && !mouseRef.current.edge) {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) {
      if (mouseRef.current.node) {
        onNodeClick?.(mouseRef.current.node);
        setSelectedEdge(null);
      } else if (mouseRef.current.edge) {
        const sourceNode = nodesRef.current.find(n => n.id === mouseRef.current.edge?.source);
        const targetNode = nodesRef.current.find(n => n.id === mouseRef.current.edge?.target);
        if (sourceNode && targetNode && mouseRef.current.edge) {
          setSelectedEdge({
            edge: mouseRef.current.edge,
            sourceNode,
            targetNode,
          });
        }
      }
    }
    isDraggingRef.current = false;
  }, [onNodeClick]);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.3, Math.min(3, prev * delta)));
  }, []);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.3, prev / 1.2));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // 初始化和动画
  useEffect(() => {
    initializePositions();
    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initializePositions, draw]);

  // 窗口大小变化时重绘
  useEffect(() => {
    const handleResize = () => {
      draw();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isDraggingRef.current = false; }}
        onWheel={handleWheel}
        className="w-full h-full"
      />

      {/* 缩放控制 */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
          title="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
          title="缩小"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
          title="重置视图"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs">
        <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">主题分类</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: categoryColors[key] }}
              />
              <span className="text-gray-600 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">关系类型</div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">关联</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-blue-500" />
              <span className="text-gray-500 dark:text-gray-400">父主题</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-green-500" />
              <span className="text-gray-500 dark:text-gray-400">成全</span>
            </div>
          </div>
        </div>
      </div>

      {/* 悬停节点信息提示 */}
      {mouseRef.current.node && !isDraggingRef.current && (
        <div
          className="absolute pointer-events-none bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 text-xs border border-gray-200 dark:border-gray-700"
          style={{
            left: '50%',
            top: '20px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: categoryColors[mouseRef.current.node.category] || '#6366f1' }}
            />
            <span className="font-medium text-gray-900 dark:text-white">
              {mouseRef.current.node.name}
            </span>
            <span className="text-gray-400">
              ({mouseRef.current.node.verseCount}处经文)
            </span>
          </div>
        </div>
      )}

      {/* 边详情面板 */}
      {selectedEdge && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">主题关系</h4>
            <button
              onClick={() => setSelectedEdge(null)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: categoryColors[selectedEdge.sourceNode.category] || '#6366f1' }}
              />
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedEdge.sourceNode.name}
              </span>
            </div>

            <div className="flex items-center gap-2 px-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex flex-col items-center">
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: edgeTypeColors[selectedEdge.edge.type] || '#9ca3af',
                    color: 'white',
                  }}
                >
                  {edgeTypeLabels[selectedEdge.edge.type] || selectedEdge.edge.type}
                </span>
                {selectedEdge.edge.description && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedEdge.edge.description}
                  </span>
                )}
              </div>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: categoryColors[selectedEdge.targetNode.category] || '#6366f1' }}
              />
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedEdge.targetNode.name}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>关联强度</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(selectedEdge.edge.strength || 0.5) * 100}%`,
                      backgroundColor: edgeTypeColors[selectedEdge.edge.type] || '#9ca3af',
                    }}
                  />
                </div>
                <span>{Math.round((selectedEdge.edge.strength || 0.5) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}