// apps/desktop/src/components/TabBar.tsx
/**
 * Browser-style tab bar for reading multiple passages
 */

import { useState, useRef, useEffect } from 'react';
import { X, Plus, BookOpen } from 'lucide-react';

export interface ReadingTab {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  title: string;
}

interface TabBarProps {
  tabs: ReadingTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabAdd: () => void;
}

export function TabBar({ tabs, activeTabId, onTabSelect, onTabClose, onTabAdd }: TabBarProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    const activeTab = tabRefs.current.get(activeTabId);
    if (activeTab && scrollContainerRef.current) {
      activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  }, [activeTabId]);

  // Handle middle-click to close
  const handleMouseDown = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) { // Middle click
      e.preventDefault();
      if (tabs.length > 1) {
        onTabClose(tabId);
      }
    }
  };

  return (
    <div className="tab-bar">
      <div className="tab-scroll-container" ref={scrollContainerRef}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            ref={el => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            className={`tab-item ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => onTabSelect(tab.id)}
            onMouseDown={(e) => handleMouseDown(e, tab.id)}
            title={`${tab.bookName} ${tab.chapter}章`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="tab-title">{tab.title}</span>
            {tabs.length > 1 && (
              <span
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </button>
        ))}
      </div>
      <button className="tab-add-btn" onClick={onTabAdd} title="新标签页">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

// Helper function to create a new tab
export function createReadingTab(bookId: string, bookName: string, chapter: number): ReadingTab {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    bookId,
    bookName,
    chapter,
    title: `${bookName} ${chapter}章`,
  };
}