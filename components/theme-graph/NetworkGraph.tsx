'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useBibleStore } from '@/store/useBibleStore';

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

export default function NetworkGraph({ data, selectedNodeId, onNodeClick }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useBibleStore();
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef<{ x: number; y: number; node: Node | null }>({ x: 0, y: 0, node: null });

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
          const force = (distance - 100) * 0.01;
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

    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    // 绘制边
    ctx.strokeStyle = isDarkMode ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;
    edges.forEach((edge) => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (source && target && source.x && source.y && target.x && target.y) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

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

      // 节点标签
      if (radius > 15 || isSelected || isHovered) {
        ctx.fillStyle = isDarkMode ? '#fff' : '#000';
        ctx.font = `${isSelected || isHovered ? 14 : 12}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name, node.x, node.y + radius + 15);
      }
    });

    // 继续动画
    simulate();
    animationRef.current = requestAnimationFrame(draw);
  }, [isDarkMode, selectedNodeId, simulate]);

  // 鼠标交互
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 检查是否悬停在节点上
    const hoveredNode = nodesRef.current.find((node) => {
      if (!node.x || !node.y) return false;
      const dx = x - node.x;
      const dy = y - node.y;
      const radius = Math.max(10, Math.min(30, Math.sqrt(node.verseCount) * 2));
      return dx * dx + dy * dy < radius * radius;
    });

    mouseRef.current = { x, y, node: hoveredNode || null };
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (mouseRef.current.node) {
      onNodeClick?.(mouseRef.current.node);
    }
  }, [onNodeClick]);

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
        onClick={handleClick}
        className="w-full h-full"
      />
    </div>
  );
}