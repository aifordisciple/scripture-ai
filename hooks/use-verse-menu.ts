// hooks/use-verse-menu.ts
import { useState, useEffect } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { Verse } from './use-bible-data';

export function useVerseMenu(verses: Verse[]) {
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const { selectedVerses, toggleVerseSelection, clearSelection, enqueueAI } = useBibleStore();

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
    const screenWidth = window.innerWidth;
    
    let left = rect.left + rect.width / 2;
    if (left - menuWidth / 2 < 10) left = menuWidth / 2 + 10;
    if (left + menuWidth / 2 > screenWidth - 10) left = screenWidth - menuWidth / 2 - 10;

    setMenuPosition({ top: rect.top - 10, left });
    setIsMenuVisible(true);
  };

  const handleAIExplain = () => {
    if (selectedVerses.length === 0) return;
    const selectedVerseObjects = verses.filter(v => selectedVerses.includes(v.verse));
    if (selectedVerseObjects.length === 0) return;
    const cuvVerses = selectedVerseObjects.filter(v => v.version === 'CUV');
    if (cuvVerses.length === 0) return; 

    const combinedContent = cuvVerses.map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join("\n");
    
    // 获取上下文 (前后各5节)
    const minVerseIdx = verses.findIndex(v => v.verse === Math.min(...selectedVerses));
    const maxVerseIdx = verses.findIndex(v => v.verse === Math.max(...selectedVerses));
    const start = Math.max(0, minVerseIdx - 5);
    const end = Math.min(verses.length, maxVerseIdx + 6);
    const contextContent = verses.slice(start, end)
        .filter(v => v.version === 'CUV')
        .map(v => `[${v.chapter}:${v.verse}] ${v.content}`).join("\n");
        
    const firstV = cuvVerses[0];
    enqueueAI("请详细解读这段经文，包含背景、逐节释经和现代应用。", combinedContent, contextContent, {
        bookName: firstV.bookName, chapter: firstV.chapter, verse: firstV.verse
    });
    
    setIsMenuVisible(false);
    clearSelection();
  };

  const handleCopy = async () => {
    const selectedContent = verses
      .filter(v => selectedVerses.includes(v.verse))
      .sort((a, b) => a.verse - b.verse)
      .reduce((acc, curr) => {
        const existing = acc.find(item => item.verse === curr.verse);
        if (!existing) { acc.push(curr); } 
        else if (curr.version === 'CUV') { const index = acc.indexOf(existing); acc[index] = curr; }
        return acc;
      }, [] as Verse[])
      .map(v => `${v.content} (${v.bookName} ${v.chapter}:${v.verse})`)
      .join("\n");

    if (!selectedContent) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { 
          await navigator.clipboard.writeText(selectedContent); 
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
    } catch (e) {
      console.error("Fallback copy failed:", e);
      alert("复制失败，请手动复制");
    }
  };

  return { menuPosition, isMenuVisible, setIsMenuVisible, handleVerseClick, handleAIExplain, handleCopy };
}