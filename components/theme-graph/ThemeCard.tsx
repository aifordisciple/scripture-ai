'use client';

import { useState, useEffect } from 'react';
import { X, Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react';
import { useBibleStore } from '@/store/useBibleStore';

interface ThemeCardProps {
  theme: {
    id: string;
    nameZh: string;
    nameEn?: string;
    category: string;
    summary?: string;
    description?: string;
    verseCount: number;
  };
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave: () => void;
}

const categoryLabels: Record<string, string> = {
  THEOLOGICAL: '神学主题',
  ETHICAL: '伦理主题',
  HISTORICAL: '历史主题',
  PROPHETIC: '预言主题',
};

const categoryColors: Record<string, string> = {
  THEOLOGICAL: 'indigo',
  ETHICAL: 'emerald',
  HISTORICAL: 'amber',
  PROPHETIC: 'red',
};

export default function ThemeCard({ theme, onClose, isSaved, onToggleSave }: ThemeCardProps) {
  const { isDarkMode, tabs, activeTabId, updateActiveTab, addTab, setActiveTab } = useBibleStore();
  const color = categoryColors[theme.category] || 'indigo';

  const handleViewAllVerses = () => {
    // 找到或创建阅读标签页
    const existingReadTab = tabs.find(t => t.type === 'read');
    if (existingReadTab) {
      setActiveTab(existingReadTab.id);
    } else {
      addTab({ type: 'read', book: 'Gen', chapter: '1' });
    }
    // 触发搜索该主题的所有经文
    // 可以通过AI搜索或打开经文列表
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
          <h3 className="font-semibold text-gray-900 dark:text-white">{theme.nameZh}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSave}
            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isSaved ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
            }`}
            title={isSaved ? '取消收藏' : '收藏主题'}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4 space-y-3">
        {/* 英文名和分类 */}
        <div className="flex items-center gap-2">
          {theme.nameEn && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{theme.nameEn}</span>
          )}
          <span className={`px-2 py-0.5 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 text-xs rounded-full`}>
            {categoryLabels[theme.category] || theme.category}
          </span>
        </div>

        {/* 经文数量 */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          共 {theme.verseCount} 处经文
        </div>

        {/* 摘要 */}
        {theme.summary && (
          <p className="text-sm text-gray-600 dark:text-gray-300">{theme.summary}</p>
        )}

        {/* 描述 */}
        {theme.description && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-400 mb-1">详细说明</div>
            <p className="text-sm text-gray-700 dark:text-gray-200">{theme.description}</p>
          </div>
        )}

        {/* 相关经文 */}
        <ThemeVerses themeId={theme.id} />
      </div>

      {/* 底部操作 */}
      <div className="flex gap-2 p-4 pt-0">
        <button
          onClick={handleViewAllVerses}
          className="flex-1 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
        >
          查看相关经文
        </button>
      </div>
    </div>
  );
}

// 书卷ID转换（从数据库格式 GEN -> 阅读器格式 Gen）
function convertBookId(bookId: string): string {
  const bookMap: Record<string, string> = {
    'GEN': 'Gen', 'EXO': 'Exo', 'LEV': 'Lev', 'NUM': 'Num', 'DEU': 'Deu',
    'JOS': 'Jos', 'JDG': 'Jdg', 'RUT': 'Rut', '1SA': '1Sa', '2SA': '2Sa',
    '1KI': '1Ki', '2KI': '2Ki', '1CH': '1Ch', '2CH': '2Ch', 'EZR': 'Ezr',
    'NEH': 'Neh', 'EST': 'Est', 'JOB': 'Job', 'PSA': 'Psa', 'PRO': 'Pro',
    'ECC': 'Ecc', 'SNG': 'Sng', 'ISA': 'Isa', 'JER': 'Jer', 'LAM': 'Lam',
    'EZK': 'Ezk', 'DAN': 'Dan', 'HOS': 'Hos', 'JOL': 'Jol', 'AMO': 'Amo',
    'OBA': 'Oba', 'JON': 'Jon', 'MIC': 'Mic', 'NAM': 'Nam', 'HAB': 'Hab',
    'ZEP': 'Zep', 'HAG': 'Hag', 'ZEC': 'Zec', 'MAL': 'Mal',
    'MAT': 'Mat', 'MRK': 'Mrk', 'LUK': 'Luk', 'JHN': 'Jhn', 'ACT': 'Act',
    'ROM': 'Rom', '1CO': '1Co', '2CO': '2Co', 'GAL': 'Gal', 'EPH': 'Eph',
    'PHP': 'Php', 'COL': 'Col', '1TH': '1Th', '2TH': '2Th', '1TI': '1Ti',
    '2TI': '2Ti', 'TIT': 'Tit', 'PHM': 'Phm', 'HEB': 'Heb', 'JAS': 'Jas',
    '1PE': '1Pe', '2PE': '2Pe', '1JN': '1Jn', '2JN': '2Jn', '3JN': '3Jn',
    'JUD': 'Jud', 'REV': 'Rev'
  };
  return bookMap[bookId] || bookId;
}

// 主题相关经文组件
function ThemeVerses({ themeId }: { themeId: string }) {
  const [verseLinks, setVerseLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [verseContents, setVerseContents] = useState<Record<number, string>>({});
  const [loadingContents, setLoadingContents] = useState<Record<number, boolean>>({});
  const { tabs, activeTabId, updateActiveTab, addTab, setActiveTab, setScrollToVerse } = useBibleStore();

  useEffect(() => {
    async function fetchVerses() {
      try {
        const res = await fetch(`/api/themes/verses?themeId=${themeId}&limit=10`);
        const data = await res.json();
        setVerseLinks(data.verseLinks?.slice(0, 10) || []);
      } catch (error) {
        console.error('Failed to fetch theme verses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVerses();
  }, [themeId]);

  // 加载单节经文内容
  const loadVerseContent = async (index: number, link: any) => {
    if (verseContents[index] || loadingContents[index]) return;

    setLoadingContents(prev => ({ ...prev, [index]: true }));
    try {
      const res = await fetch(`/api/bible/${link.bookId}/${link.chapter}/${link.verseStart}`);
      if (res.ok) {
        const data = await res.json();
        setVerseContents(prev => ({ ...prev, [index]: data.content || '加载失败' }));
      }
    } catch (error) {
      console.error('Failed to load verse content:', error);
    } finally {
      setLoadingContents(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleVerseClick = (link: any) => {
    const book = convertBookId(link.bookId);
    const chapter = link.chapter.toString();
    const verse = link.verseStart;

    // 查找是否已有阅读标签页
    const existingReadTab = tabs.find(t => t.type === 'read');

    if (existingReadTab) {
      // 更新现有标签页
      if (existingReadTab.id === activeTabId) {
        updateActiveTab({ book, chapter });
      } else {
        // 切换到阅读标签页并更新
        setActiveTab(existingReadTab.id);
        // 延迟更新以确保标签切换完成
        setTimeout(() => {
          updateActiveTab({ book, chapter });
          setScrollToVerse(verse);
        }, 50);
      }
    } else {
      // 创建新的阅读标签页
      addTab({ type: 'read', book, chapter });
    }

    // 设置滚动到指定经文
    setScrollToVerse(verse);
  };

  if (loading) {
    return <div className="text-xs text-gray-400">加载相关经文...</div>;
  }

  if (verseLinks.length === 0) {
    return null;
  }

  // 获取书卷中文名用于显示
  const getBookDisplayName = (bookId: string): string => {
    const bookNames: Record<string, string> = {
      'GEN': '创', 'EXO': '出', 'LEV': '利', 'NUM': '民', 'DEU': '申',
      'JOS': '书', 'JDG': '士', 'RUT': '得', '1SA': '撒上', '2SA': '撒下',
      '1KI': '王上', '2KI': '王下', '1CH': '代上', '2CH': '代下', 'EZR': '拉',
      'NEH': '尼', 'EST': '斯', 'JOB': '伯', 'PSA': '诗', 'PRO': '箴',
      'ECC': '传', 'SNG': '歌', 'ISA': '赛', 'JER': '耶', 'LAM': '哀',
      'EZK': '结', 'DAN': '但', 'HOS': '何', 'JOL': '珥', 'AMO': '摩',
      'OBA': '俄', 'JON': '拿', 'MIC': '弥', 'NAM': '鸿', 'HAB': '哈',
      'ZEP': '番', 'HAG': '该', 'ZEC': '亚', 'MAL': '玛',
      'MAT': '太', 'MRK': '可', 'LUK': '路', 'JHN': '约', 'ACT': '徒',
      'ROM': '罗', '1CO': '林前', '2CO': '林后', 'GAL': '加', 'EPH': '弗',
      'PHP': '腓', 'COL': '西', '1TH': '帖前', '2TH': '帖后', '1TI': '提前',
      '2TI': '提后', 'TIT': '多', 'PHM': '门', 'HEB': '来', 'JAS': '雅',
      '1PE': '彼前', '2PE': '彼后', '1JN': '约壹', '2JN': '约贰', '3JN': '约叁',
      'JUD': '犹', 'REV': '启'
    };
    return bookNames[bookId] || bookId;
  };

  return (
    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
      <div className="text-xs text-gray-400 mb-2">主要经文</div>
      <div className="flex flex-wrap gap-1">
        {verseLinks.map((link, index) => (
          <div key={index} className="relative inline-block">
            <span
              onMouseEnter={() => {
                setHoveredIndex(index);
                loadVerseContent(index, link);
              }}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleVerseClick(link)}
              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
            >
              {getBookDisplayName(link.bookId)}{link.chapter}:{link.verseStart}
            </span>
            {/* 经文内容预览 Tooltip */}
            {hoveredIndex === index && (
              <div className="absolute z-50 bottom-full mb-2 left-0 min-w-[200px] max-w-[300px] p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 text-xs">
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {getBookDisplayName(link.bookId)}{link.chapter}:{link.verseStart}
                </div>
                <div className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {loadingContents[index] ? (
                    <span className="text-gray-400">加载中...</span>
                  ) : verseContents[index] ? (
                    verseContents[index].length > 100
                      ? verseContents[index].slice(0, 100) + '...'
                      : verseContents[index]
                  ) : (
                    <span className="text-gray-400">暂无内容</span>
                  )}
                </div>
                {/* 小箭头 */}
                <div className="absolute top-full left-4 -mt-px">
                  <div className="w-2 h-2 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 transform rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 mt-2">悬停查看经文内容，点击跳转阅读</div>
    </div>
  );
}