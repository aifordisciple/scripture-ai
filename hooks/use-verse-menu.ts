// hooks/use-verse-menu.ts
import { useState, useEffect } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { Verse } from './use-bible-data';
import { useToast } from '@/components/ui/toast';
import { getBookDisplayName } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n';

export function useVerseMenu(verses: Verse[]) {
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showAbove, setShowAbove] = useState(true); // 菜单显示在选中元素上方还是下方

  const { selectedVerses, toggleVerseSelection, clearSelection, enqueueAI, locale } = useBibleStore();
  const { addToast } = useToast();
  const { t } = useTranslation();

  // 点击空白处关闭菜单
  useEffect(() => {
    const handleClickOutside = () => setIsMenuVisible(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // 经文数据改变时(如翻页)关闭菜单
  useEffect(() => {
    setIsMenuVisible(false);
  }, [verses]);

  const handleVerseClick = (v: Verse, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation();
    toggleVerseSelection(v.verse);

    // 计算浮动菜单位置
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 280; // 估计菜单高度
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let left = rect.left + rect.width / 2;
    if (left - menuWidth / 2 < 10) left = menuWidth / 2 + 10;
    if (left + menuWidth / 2 > screenWidth - 10) left = screenWidth - menuWidth / 2 - 10;

    // 判断菜单应该显示在上方还是下方
    // 如果上方空间不足（小于菜单高度 + 20px 边距），则显示在下方
    const shouldShowAbove = rect.top >= menuHeight + 20;
    setShowAbove(shouldShowAbove);

    // 设置菜单位置
    // 如果显示在上方，top 设置为元素顶部；如果显示在下方，top 设置为元素底部
    const top = shouldShowAbove ? rect.top - 10 : rect.bottom + 10;

    setMenuPosition({ top, left });
    setIsMenuVisible(true);
  };

  const handleAIExplain = () => {
    if (selectedVerses.length === 0) return;
    const primaryVersion = locale === 'en' ? 'KJV' : 'CUV';
    const selectedVerseObjects = verses.filter(v => selectedVerses.includes(v.verse));
    const primaryVerses = selectedVerseObjects.filter(v => v.version === primaryVersion);
    if (primaryVerses.length === 0) return;

    const combinedContent = primaryVerses.map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join("\n");

    // 获取上下文 (前后各5节)
    const minVerseIdx = verses.findIndex(v => v.verse === Math.min(...selectedVerses));
    const maxVerseIdx = verses.findIndex(v => v.verse === Math.max(...selectedVerses));
    const start = Math.max(0, minVerseIdx - 5);
    const end = Math.min(verses.length, maxVerseIdx + 6);
    const contextContent = verses.slice(start, end)
        .filter(v => v.version === primaryVersion)
        .map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join("\n");

    const firstV = primaryVerses[0];
    enqueueAI(t('reader.aiInterpretPrompt'), combinedContent, contextContent, {
        bookName: getBookDisplayName(firstV.bookId, locale), chapter: firstV.chapter, verse: firstV.verse
    });

    setIsMenuVisible(false);
    clearSelection();
  };

  const handleCopy = async () => {
    const primaryVersion = locale === 'en' ? 'KJV' : 'CUV';
    const selectedContent = verses
      .filter(v => selectedVerses.includes(v.verse) && v.version === primaryVersion)
      .sort((a, b) => a.verse - b.verse)
      .map(v => `${v.content} (${getBookDisplayName(v.bookId, locale)} ${v.chapter}:${v.verse})`)
      .join("\n");

    if (!selectedContent) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
          await navigator.clipboard.writeText(selectedContent);
          addToast({ type: 'success', message: t('floatingMenu.copiedToClipboard') });
          return;
      } catch (err) {
          console.warn("Clipboard API failed, trying fallback...", err);
      }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = selectedContent;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      document.execCommand('copy');
      document.body.removeChild(textarea);
      addToast({ type: 'success', message: t('floatingMenu.copiedToClipboard') });
    } catch (e) {
      console.error("Fallback copy failed:", e);
      addToast({ type: 'error', message: t('floatingMenu.copyFailed') });
    }
  };

  return { menuPosition, isMenuVisible, setIsMenuVisible, handleVerseClick, handleAIExplain, handleCopy, showAbove };
}