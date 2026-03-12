// components/ui/skeleton.tsx
"use client";

import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 骨架屏形状变体
   * - text: 文本行 (默认圆角)
   * - circular: 圆形 (头像等)
   * - rectangular: 矩形 (卡片封面)
   * - rounded: 圆角矩形 (按钮、标签)
   */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';

  /**
   * 动画类型
   * - pulse: 脉冲闪烁 (默认)
   * - shimmer: 流光效果 (更高级)
   * - none: 无动画
   */
  animation?: 'pulse' | 'shimmer' | 'none';

  /**
   * 宽度，支持数字(px)或字符串(如 '100%', '10rem')
   */
  width?: string | number;

  /**
   * 高度，支持数字(px)或字符串(如 '100%', '10rem')
   */
  height?: string | number;
}

/**
 * 通用骨架屏组件
 *
 * @example
 * // 基础文本行
 * <Skeleton className="h-4 w-full" />
 *
 * @example
 * // 头像
 * <Skeleton variant="circular" width={40} height={40} />
 *
 * @example
 * // 卡片封面
 * <Skeleton variant="rectangular" className="h-32 w-full" />
 *
 * @example
 * // 流光动画
 * <Skeleton animation="shimmer" className="h-4 w-3/4" />
 */
export function Skeleton({
  variant = 'text',
  animation = 'pulse',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  // 处理宽高转换
  const dimensionStyle = {
    ...(width !== undefined && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height !== undefined && { height: typeof height === 'number' ? `${height}px` : height }),
    ...style,
  };

  // 变体样式
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  // 动画样式
  const animationStyles = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={cn(
        // 基础样式
        'bg-slate-200 dark:bg-slate-700',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={dimensionStyle}
      {...props}
    />
  );
}

/**
 * 骨架屏组合组件 - 用于快速创建常见骨架布局
 */

// 单行文本骨架
export function SkeletonText({
  lines = 1,
  className,
  lastLineWidth = '75%',
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string | number;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1
              ? typeof lastLineWidth === 'number' ? `${lastLineWidth}px` : lastLineWidth
              : '100%'
          }}
        />
      ))}
    </div>
  );
}

// 头像+文本组合骨架
export function SkeletonAvatarText({
  avatarSize = 40,
  lines = 2,
  className,
}: {
  avatarSize?: number;
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Skeleton variant="circular" width={avatarSize} height={avatarSize} />
      <div className="flex-1 space-y-2 pt-1">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: i === lines - 1 ? '60%' : '100%' }} />
        ))}
      </div>
    </div>
  );
}

// 卡片骨架
export function SkeletonCard({
  hasImage = true,
  imageHeight = 120,
  lines = 3,
  className,
}: {
  hasImage?: boolean;
  imageHeight?: number;
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/50 overflow-hidden", className)}>
      {hasImage && (
        <Skeleton variant="rectangular" className="w-full" height={imageHeight} />
      )}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <SkeletonText lines={lines} lastLineWidth="50%" />
      </div>
    </div>
  );
}