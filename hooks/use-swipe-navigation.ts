// hooks/use-swipe-navigation.ts
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BIBLE_BOOKS } from '@/lib/constants';
import { useBibleStore } from '@/store/useBibleStore';

const NAV_COOLDOWN_MS = 300; // 冷却期：防止快速连续滑动触发多次导航

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
    // 检查触摸是否发生在可滚动容器内，如果是则不触发导航
    const target = e.target as HTMLElement;
    const scrollableParent = target.closest('[data-scroll-area], .overflow-y-auto, .overflow-auto, [role="dialog"], textarea, [contenteditable]');
    if (scrollableParent) {
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const diffX = touchStartRef.current.x - e.changedTouches[0].clientX;
    const diffY = touchStartRef.current.y - e.changedTouches[0].clientY;

    // 判断滑动阈值：水平移动大于80px，垂直移动小于60px 才算翻页
    if (Math.abs(diffX) > 80 && Math.abs(diffY) < 60) {
        if (diffX > 0) handleNextChapter(); else handlePrevChapter();
    }
    touchStartRef.current = null;
  };

  return { direction, handleNextChapter, handlePrevChapter, handleTouchStart, handleTouchEnd };
}
