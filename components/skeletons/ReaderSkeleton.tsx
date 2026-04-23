// components/skeletons/ReaderSkeleton.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ReaderSkeletonProps {
  /**
   * 预估的经文节数
   * 默认 20 节，足以填满一屏
   */
  verseCount?: number;

  /**
   * 是否显示英文经文骨架
   */
  showDualVersion?: boolean;

  /**
   * 字号缩放比例（与 Reader 保持一致）
   */
  fontSize?: number;

  /**
   * 额外的 className
   */
  className?: string;
}

/**
 * Reader 组件的骨架屏
 * 模拟经文阅读器的结构：标题 + 经文列表 + 底部按钮
 */
export function ReaderSkeleton({
  verseCount = 20,
  showDualVersion = false,
  fontSize = 20,
  className,
}: ReaderSkeletonProps) {
  return (
    <div className={cn("w-full max-w-5xl xl:max-w-6xl px-4 py-8 md:px-10 pb-32 min-h-screen", className)}>
      {/* 章节标题骨架 */}
      <div className="flex items-center justify-center mb-10 md:mb-16 mt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <span className="text-3xl opacity-30">·</span>
          <Skeleton className="h-9 w-10 rounded-lg" />
        </div>
      </div>

      {/* 经文列表骨架 */}
      <div className="space-y-1 md:space-y-2">
        {Array.from({ length: verseCount }).map((_, index) => (
          <VerseSkeleton
            key={index}
            verseNum={index + 1}
            showDualVersion={showDualVersion}
            fontSize={fontSize}
            // 随机变化最后一节或部分经文的宽度，更自然
            isLast={index === verseCount - 1}
            widthVariation={getRandomWidth(index)}
          />
        ))}
      </div>

      {/* 底部按钮骨架 */}
      <div className="mt-20 text-center pb-4">
        <Skeleton className="inline-flex h-12 w-48 rounded-full" />
      </div>
    </div>
  );
}

/**
 * 单节经文骨架
 */
function VerseSkeleton({
  verseNum,
  showDualVersion,
  fontSize,
  isLast,
  widthVariation,
}: {
  verseNum: number;
  showDualVersion: boolean;
  fontSize: number;
  isLast: boolean;
  widthVariation: number;
}) {
  // 模拟节号字体大小（为正文的 0.55 倍）
  const verseNumFontSize = fontSize * 0.55;

  return (
    <div className="relative flex items-start px-3 md:px-5 py-2.5 rounded-2xl">
      {/* 节号骨架 */}
      <Skeleton
        className="mr-4 shrink-0 mt-[0.3em]"
        style={{
          width: `${Math.max(12, verseNumFontSize * 0.8)}px`,
          height: `${verseNumFontSize}px`,
        }}
      />

      {/* 经文内容骨架 */}
      <div className="flex-1 min-w-0">
        {/* 中文经文骨架 - 模拟 1-3 行 */}
        <div className="space-y-1.5">
          {Array.from({ length: getLineCount(verseNum) }).map((_, lineIndex) => (
            <Skeleton
              key={lineIndex}
              className="rounded"
              style={{
                height: `${fontSize * 0.65}px`,
                width: lineIndex === getLineCount(verseNum) - 1
                  ? `${widthVariation}%`
                  : '100%',
              }}
            />
          ))}
        </div>

        {/* 英文经文骨架 */}
        {showDualVersion && (
          <div className="mt-3 space-y-1.5">
            {Array.from({ length: getLineCount(verseNum + 10) }).map((_, lineIndex) => (
              <Skeleton
                key={lineIndex}
                className="rounded opacity-60"
                style={{
                  height: `${fontSize * 0.85 * 0.55}px`,
                  width: lineIndex === getLineCount(verseNum + 10) - 1
                    ? `${widthVariation * 0.85}%`
                    : '100%',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 获取随机宽度变化 (60% - 95%)
 */
function getRandomWidth(index: number): number {
  // 使用 index 作为种子，生成伪随机宽度
  const widths = [75, 82, 68, 90, 73, 85, 78, 65, 88, 70, 92, 77, 83, 69, 86, 74, 80, 67, 91, 76];
  return widths[index % widths.length];
}

/**
 * 获取行数 (1-3行)
 */
function getLineCount(verseNum: number): number {
  // 使用 verseNum 作为种子，生成伪随机行数
  const lineCounts = [1, 2, 1, 2, 1, 3, 2, 1, 2, 1, 2, 3, 1, 2, 1];
  return lineCounts[verseNum % lineCounts.length];
}

/**
 * 移动端专用的精简版骨架屏
 * 只显示少量经文，节省渲染资源
 */
export function ReaderSkeletonMobile({ showDualVersion = false }: { showDualVersion?: boolean }) {
  return (
    <ReaderSkeleton
      verseCount={12}
      showDualVersion={showDualVersion}
      fontSize={18}
    />
  );
}

/**
 * 平板端骨架屏
 */
export function ReaderSkeletonTablet({ showDualVersion = false }: { showDualVersion?: boolean }) {
  return (
    <ReaderSkeleton
      verseCount={16}
      showDualVersion={showDualVersion}
      fontSize={20}
    />
  );
}

export default ReaderSkeleton;