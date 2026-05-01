// hooks/use-swipe-navigation.ts
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BIBLE_BOOKS } from '@/lib/constants';
import { useBibleStore } from '@/store/useBibleStore';

const NAV_COOLDOWN_MS = 300; // 冷却期：防止快速连续滑动触发多次导航

// 检测是否在 PWA standalone 模式下运行
function isPWAStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

// 自适应滑动阈值：基于屏幕尺寸和 PWA 模式
function getSwipeThresholds() {
  const isStandalone = isPWAStandalone();
  const vw = typeof window !== 'undefined' ? window.innerWidth : 375;

  // PWA standalone 模式无浏览器返回手势，可使用较低阈值
  // 浏览器模式使用较高阈值避免与 iOS 返回手势冲突
  const horizontalMin = isStandalone ? 60 : Math.max(80, Math.min(120, vw * 0.15));
  const verticalTolerance = Math.min(80, (typeof window !== 'undefined' ? window.innerHeight : 667) * 0.1);

  return { horizontalMin, verticalTolerance, isStandalone };
}

export function useSwipeNavigation(book: string, chapter: string) {
  const router = useRouter();
  const [direction, setDirection] = useState(0);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const lastNavTimeRef = useRef(0);

  const navigateTo = (newBook: string, newChapter: number) => {
    router.push(`/?book=${newBook}&chapter=${newChapter}`);
  };

  const handleNextChapter = () => {
    // 冷却期检查：防止快速连续导航
    const now = Date.now();
    if (now - lastNavTimeRef.current < NAV_COOLDOWN_MS) return;
    lastNavTimeRef.current = now;

    setDirection(1);

    // [新增] 拦截：如果处于计划流中，按照计划步骤前进
    const { readingPlanContext, advancePlanStep } = useBibleStore.getState();
    if (readingPlanContext) {
        advancePlanStep();
        return;
    }

    const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === book);
    if (currentBookIndex === -1) return;
    const currentBookConfig = BIBLE_BOOKS[currentBookIndex];
    const currentChapterInt = parseInt(chapter);

    if (currentChapterInt < currentBookConfig.chapters) {
        navigateTo(book, currentChapterInt + 1);
    } else if (currentBookIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentBookIndex + 1];
        navigateTo(nextBook.id, 1);
    }
  };

  const handlePrevChapter = () => {
    // 冷却期检查：防止快速连续导航
    const now = Date.now();
    if (now - lastNavTimeRef.current < NAV_COOLDOWN_MS) return;
    lastNavTimeRef.current = now;

    setDirection(-1);

    // [新增] 拦截：如果处于计划流中，按照计划步骤后退
    const { readingPlanContext, previousPlanStep } = useBibleStore.getState();
    if (readingPlanContext) {
        previousPlanStep();
        return;
    }

    const currentBookIndex = BIBLE_BOOKS.findIndex(b => b.id === book);
    if (currentBookIndex === -1) return;
    const currentChapterInt = parseInt(chapter);

    if (currentChapterInt > 1) {
        navigateTo(book, currentChapterInt - 1);
    } else if (currentBookIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentBookIndex - 1];
        navigateTo(prevBook.id, prevBook.chapters);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // 检查触摸是否发生在需要独占滑动的容器内
    const target = e.target as HTMLElement;

    // 水平可滚动容器、对话框、输入框：完全禁止滑动导航
    const horizontalScrollable = target.closest('[data-scroll-area], .overflow-x-auto, .overflow-x-scroll, [role="dialog"], textarea, [contenteditable]');
    if (horizontalScrollable) {
      touchStartRef.current = null;
      return;
    }

    // 垂直可滚动容器：不阻止，因为用户意图是水平滑动翻页
    // 仅在垂直滚动容器中记录起始位置，在 touchEnd 时根据实际滑动方向判断

    // iOS 浏览器返回手势保护：左边缘 30px 内不拦截
    const touchX = e.touches[0].clientX;
    const thresholds = getSwipeThresholds();
    if (!thresholds.isStandalone && touchX < 30) {
      touchStartRef.current = null;
      return;
    }

    touchStartRef.current = { x: touchX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const diffX = touchStartRef.current.x - e.changedTouches[0].clientX;
    const diffY = touchStartRef.current.y - e.changedTouches[0].clientY;

    const thresholds = getSwipeThresholds();

    // 判断滑动阈值：水平移动超过自适应阈值，垂直移动在容差内才算翻页
    if (Math.abs(diffX) > thresholds.horizontalMin && Math.abs(diffY) < thresholds.verticalTolerance) {
        if (diffX > 0) handleNextChapter(); else handlePrevChapter();
    }
    touchStartRef.current = null;
  };

  return { direction, handleNextChapter, handlePrevChapter, handleTouchStart, handleTouchEnd };
}
