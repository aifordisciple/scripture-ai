// components/bible/BibleHeatmap.tsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { BIBLE_BOOKS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n';

/**
 * Scripture AI - 圣经研读数据热力图组件
 * * 程序说明：
 * 本组件用于将用户的交互数据（如高亮次数、笔记字数、阅读时长）以矩阵热力图的形式可视化。
 * X轴代表章节 (Chapter 1-150)，Y轴代表书卷 (创世记, 出埃及记...)。
 * 颜色深浅代表该章节的数据权重（Weight）。
 * * 交互设计：
 * 1. 鼠标悬浮 (Hover) 可显示具体的章节与权重数据 (Tooltip)，包含边缘防溢出逻辑。
 * 2. 支持通过参数切换颜色主题 (蓝、绿、琥珀色)。
 * 3. 响应式滚动，适配移动端。
 */

export interface HeatmapDataPoint {
  bookId: string;
  chapter: number;
  weight: number;
}

export interface BibleHeatmapProps {
  /** 渲染的数据源 */
  data?: HeatmapDataPoint[];
  /** 热力图颜色主题，默认 'blue' */
  colorTheme?: 'blue' | 'green' | 'amber' | 'purple';
  /** 单个热力方块的尺寸 (像素)，默认 10 */
  cellSize?: number;
  /** 方块之间的间距 (像素)，默认 2 */
  cellGap?: number;
  /** 交互：点击方块的回调函数 */
  onCellClick?: (bookId: string, chapter: number) => void;
}

const COLOR_SCALES = {
  blue:   ['bg-slate-100 dark:bg-slate-800', 'bg-blue-200 dark:bg-blue-900', 'bg-blue-400 dark:bg-blue-700', 'bg-blue-600 dark:bg-blue-500', 'bg-blue-800 dark:bg-blue-400'],
  green:  ['bg-slate-100 dark:bg-slate-800', 'bg-emerald-200 dark:bg-emerald-900', 'bg-emerald-400 dark:bg-emerald-700', 'bg-emerald-600 dark:bg-emerald-500', 'bg-emerald-800 dark:bg-emerald-400'],
};

export function BibleHeatmap({
  data = [], colorTheme = 'blue', cellSize = 10, cellGap = 2, onCellClick
}: BibleHeatmapProps) {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '', isBelow: false });

  // 1. 数据映射，计算最大活跃度
  const { map: dataMap, maxWeight } = useMemo(() => {
    const map = new Map<string, number>();
    let max = 0;
    data.forEach(d => {
      const key = `${d.bookId}-${d.chapter}`;
      const prev = map.get(key) || 0;
      const current = prev + d.weight;
      map.set(key, current);
      if (current > max) max = current;
    });
    return { map, maxWeight: max > 0 ? max : 1 };
  }, [data]);

  const getColorLevel = (weight: number) => {
    if (weight === 0) return 0;
    const ratio = weight / maxWeight;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  const scaleColors = COLOR_SCALES[colorTheme as keyof typeof COLOR_SCALES] || COLOR_SCALES.blue;

  const handleMouseEnter = (e: React.MouseEvent, bookName: string, chapter: number, weight: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.closest('.heatmap-container')?.getBoundingClientRect() || { left: 0, top: 0 };

    // 计算提示框位置
    let yPos = rect.top - containerRect.top - 8;
    let isBelow = false;

    // 边缘防溢出：如果处于容器顶部（如创世记），则将提示框向下翻转显示
    if (yPos < 20) {
        yPos = rect.top - containerRect.top + cellSize + 12;
        isBelow = true;
    }

    setTooltip({
      visible: true,
      x: rect.left - containerRect.left + (cellSize / 2),
      y: yPos,
      text: `${t('bible.heatmapTooltip', { book: bookName, chapter, weight })}`,
      isBelow
    });
  };

  // 触摸设备：点击显示 tooltip，点击其他区域关闭
  const handleTouchStart = useCallback((e: React.TouchEvent, bookName: string, chapter: number, weight: number) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.closest('.heatmap-container')?.getBoundingClientRect() || { left: 0, top: 0 };

    let yPos = rect.top - containerRect.top - 8;
    let isBelow = false;
    if (yPos < 20) {
      yPos = rect.top - containerRect.top + cellSize + 12;
      isBelow = true;
    }

    setTooltip({
      visible: true,
      x: rect.left - containerRect.left + (cellSize / 2),
      y: yPos,
      text: `${t('bible.heatmapTooltip', { book: bookName, chapter, weight })}`,
      isBelow
    });
  }, [t, cellSize]);

  // 点击外部关闭 tooltip（触摸设备）
  useEffect(() => {
    if (!tooltip.visible) return;
    const dismiss = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.heatmap-cell')) {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('touchstart', dismiss, { passive: true });
    document.addEventListener('mousedown', dismiss);
    return () => {
      document.removeEventListener('touchstart', dismiss);
      document.removeEventListener('mousedown', dismiss);
    };
  }, [tooltip.visible]);

  return (
    <div className="relative w-full overflow-x-auto no-scrollbar py-4 heatmap-container">
      <div className="flex flex-col select-none" style={{ gap: `${cellGap}px` }}>
        {BIBLE_BOOKS.map((book) => (
          <div key={book.id} className="flex items-center">
            {/* 书卷中文名称 - 唯一渲染 */}
            <div 
               className="w-20 md:w-24 shrink-0 text-[10px] md:text-xs text-muted-foreground font-medium whitespace-nowrap mr-2 text-right tracking-wider hover:text-foreground transition-colors cursor-default flex items-center justify-end"
               style={{ height: `${cellSize}px` }} 
               title={book.name}
            >
              {book.name}
            </div>
            
            {/* 热力图小方块 */}
            <div className="flex" style={{ gap: `${cellGap}px` }}>
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => {
                const weight = dataMap.get(`${book.id}-${chapter}`) || 0;
                const level = getColorLevel(weight);
                const colorClass = scaleColors[level];

                return (
                  <div
                    key={`${book.id}-${chapter}`}
                    style={{ width: `${cellSize}px`, height: `${cellSize}px`, flexShrink: 0 }}
                    className={cn(
                      "heatmap-cell relative rounded-[2px] cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-foreground/50",
                      colorClass,
                      weight > 0 ? "hover:scale-125 hover:z-10 shadow-sm" : ""
                    )}
                    onMouseEnter={(e) => handleMouseEnter(e, book.name, chapter, weight)}
                    onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
                    onTouchStart={(e) => handleTouchStart(e, book.name, chapter, weight)}
                    onClick={() => onCellClick && onCellClick(book.id, chapter)}
                  >
                    {/* Invisible touch target for mobile — meets 44px minimum */}
                    <div className="md:hidden absolute inset-0 -m-[17px]" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 悬浮提示框 */}
      {tooltip.visible && (
        <div
          className={cn(
             "absolute z-50 px-2.5 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded shadow-xl pointer-events-none transform -translate-x-1/2 whitespace-nowrap animate-in fade-in zoom-in-95 duration-100",
             tooltip.isBelow ? "translate-y-0" : "-translate-y-full"
          )}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
          <div className={cn(
              "absolute left-1/2 w-2 h-2 bg-slate-900 dark:bg-white transform -translate-x-1/2 rotate-45",
              tooltip.isBelow ? "top-0 -translate-y-1/2" : "bottom-0 translate-y-1/2"
          )} />
        </div>
      )}

      {/* 颜色图例 */}
      <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-muted-foreground">
        <span>{t('bible.heatmapLess')}</span>
        {scaleColors.map((colorClass, i) => (
          <div
            key={i}
            className={cn("w-3 h-3 rounded-[1px]", colorClass)}
          />
        ))}
        <span>{t('bible.heatmapMore')}</span>
      </div>
    </div>
  );
}
