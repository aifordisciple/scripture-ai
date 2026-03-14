// components/theme-graph/ThemeTimeline.tsx
'use client';

import { useState, useEffect } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { BIBLE_PERIODS, getBookPeriod, formatYear, BiblePeriod } from '@/lib/bible-periods';
import { ChevronLeft, ChevronRight, Book } from 'lucide-react';

interface ThemeTimelineProps {
  selectedThemeId?: string | null;
  onVerseClick?: (bookId: string, chapter: number, verse: number) => void;
}

interface VerseLink {
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  relevance: number;
}

export default function ThemeTimeline({ selectedThemeId, onVerseClick }: ThemeTimelineProps) {
  const [verseLinks, setVerseLinks] = useState<VerseLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const { tabs, activeTabId, updateActiveTab, addTab, setActiveTab, setScrollToVerse } = useBibleStore();

  // 加载主题相关经文
  useEffect(() => {
    if (!selectedThemeId) {
      setVerseLinks([]);
      return;
    }

    async function fetchVerses() {
      setLoading(true);
      try {
        const res = await fetch(`/api/themes/verses?themeId=${selectedThemeId}&limit=100`);
        const data = await res.json();
        setVerseLinks(data.verseLinks || []);
      } catch (error) {
        console.error('Failed to fetch theme verses:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVerses();
  }, [selectedThemeId]);

  // 按时期分组
  const groupedByPeriod = verseLinks.reduce((acc, link) => {
    const period = getBookPeriod(link.bookId);
    const periodId = period?.id || 'unknown';
    if (!acc[periodId]) {
      acc[periodId] = {
        period: period,
        verses: [],
      };
    }
    acc[periodId].verses.push(link);
    return acc;
  }, {} as Record<string, { period?: BiblePeriod; verses: VerseLink[] }>);

  // 排序时期（按时间顺序）
  const sortedPeriods = Object.entries(groupedByPeriod).sort((a, b) => {
    const periodA = a[1].period;
    const periodB = b[1].period;
    if (!periodA || !periodB) return 0;
    return periodA.yearStart - periodB.yearStart;
  });

  // 书卷中文名映射
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

  // 书卷ID转换（从数据库格式 GEN -> 阅读器格式 Gen）
  const convertBookId = (bookId: string): string => {
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
  };

  const handleVerseClick = (link: VerseLink) => {
    const book = convertBookId(link.bookId);
    const chapter = link.chapter.toString();
    const verse = link.verseStart;

    const existingReadTab = tabs.find(t => t.type === 'read');
    if (existingReadTab) {
      if (existingReadTab.id === activeTabId) {
        updateActiveTab({ book, chapter });
      } else {
        setActiveTab(existingReadTab.id);
        setTimeout(() => {
          updateActiveTab({ book, chapter });
          setScrollToVerse(verse);
        }, 50);
      }
    } else {
      addTab({ type: 'read', book, chapter });
    }
    setScrollToVerse(verse);
  };

  if (!selectedThemeId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Book className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>请先选择一个主题</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            选择主题后将按历史时期展示相关经文
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-2 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-2 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <p className="text-sm text-gray-400">加载时间线...</p>
        </div>
      </div>
    );
  }

  if (sortedPeriods.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p>该主题暂无相关经文</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* 时间轴头部 */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">主题发展时间线</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          按圣经历史时期排列 · 共 {verseLinks.length} 处经文
        </p>
      </div>

      {/* 时期导航 */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {sortedPeriods.map(([periodId, data]) => (
          <button
            key={periodId}
            onClick={() => setSelectedPeriod(selectedPeriod === periodId ? null : periodId)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedPeriod === periodId
                ? 'text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            style={selectedPeriod === periodId ? { backgroundColor: data.period?.color } : {}}
          >
            {data.period?.name || '其他'}
            <span className="ml-1 opacity-70">({data.verses.length})</span>
          </button>
        ))}
      </div>

      {/* 时间线 */}
      <div className="relative">
        {/* 主时间轴线 */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {/* 时期节点 */}
        <div className="space-y-4">
          {sortedPeriods
            .filter(([periodId]) => !selectedPeriod || selectedPeriod === periodId)
            .map(([periodId, data]) => (
              <div key={periodId} className="relative pl-10">
                {/* 时间节点 */}
                <div
                  className="absolute left-2 top-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center"
                  style={{ backgroundColor: data.period?.color }}
                >
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>

                {/* 时期卡片 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* 时期标题 */}
                  <div
                    className="px-3 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: data.period?.color }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{data.period?.name || '其他'}</span>
                      <span className="text-xs opacity-80">
                        {data.period ? `${formatYear(data.period.yearStart)} - ${formatYear(data.period.yearEnd)}` : ''}
                      </span>
                    </div>
                    {data.period?.description && (
                      <div className="text-xs opacity-80 mt-0.5">{data.period.description}</div>
                    )}
                  </div>

                  {/* 经文列表 */}
                  <div className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {data.verses.slice(0, 10).map((link, index) => (
                        <button
                          key={index}
                          onClick={() => handleVerseClick(link)}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                        >
                          {bookNames[link.bookId] || link.bookId}{link.chapter}:{link.verseStart}
                        </button>
                      ))}
                      {data.verses.length > 10 && (
                        <span className="px-2 py-1 text-xs text-gray-400">
                          +{data.verses.length - 10} 更多
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          点击经文引用跳转到阅读器
        </p>
      </div>
    </div>
  );
}