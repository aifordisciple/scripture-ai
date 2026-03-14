'use client';

import { useState, useMemo, useEffect } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { ChevronLeft, ChevronRight, Play, Pause, MapPin } from 'lucide-react';

interface TimelineSliderProps {
  year: number;
  onYearChange: (year: number) => void;
}

interface BibleEvent {
  id: string;
  titleZh: string;
  titleEn?: string;
  description: string;
  yearStart?: number | null;
  yearEnd?: number | null;
  yearApprox: boolean;
  locationId?: string | null;
  location?: {
    id: string;
    nameZh: string;
    nameEn: string;
    latitude: number;
    longitude: number;
  } | null;
  bookId?: string | null;
  chapterStart?: number | null;
  category: string;
  testament: string;
}

// 圣经历史关键时间节点
const KEY_EVENTS = [
  { year: -2000, label: '亚伯拉罕' },
  { year: -1446, label: '出埃及' },
  { year: -1000, label: '大卫王朝' },
  { year: -586, label: '被掳巴比伦' },
  { year: -516, label: '圣殿重建' },
  { year: -4, label: '耶稣诞生' },
  { year: 30, label: '耶稣受难' },
  { year: 70, label: '耶路撒冷被毁' },
];

export default function TimelineSlider({ year, onYearChange }: TimelineSliderProps) {
  const { timelineRange } = useBibleStore();
  const [isPlaying, setIsPlaying] = useState(false);

  const [minYear, maxYear] = timelineRange;

  // 格式化年份显示
  const formatYear = (y: number) => {
    if (y < 0) return `公元前 ${Math.abs(y)} 年`;
    if (y === 0) return '公元 1 年';
    return `公元 ${y} 年`;
  };

  // 计算时间轴位置百分比
  const yearPosition = useMemo(() => {
    return ((year - minYear) / (maxYear - minYear)) * 100;
  }, [year, minYear, maxYear]);

  // 自动播放
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // 步进
  const step = (direction: 'forward' | 'backward') => {
    const stepSize = 10;
    if (direction === 'forward') {
      onYearChange(Math.min(year + stepSize, maxYear));
    } else {
      onYearChange(Math.max(year - stepSize, minYear));
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* 当前年份显示 */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatYear(year)}
        </div>
      </div>

      {/* 时间轴 */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative py-8">
          {/* 时间线 */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            {/* 当前位置指示器 */}
            <div
              className="absolute top-0 h-2 bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${yearPosition}%` }}
            />
          </div>

          {/* 年份滑块 */}
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />

          {/* 关键事件标记 */}
          {KEY_EVENTS.filter(e => e.year >= minYear && e.year <= maxYear).map((event) => {
            const position = ((event.year - minYear) / (maxYear - minYear)) * 100;
            return (
              <div
                key={event.year}
                className="absolute top-6 flex flex-col items-center"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow" />
                <span className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {event.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 该年份的事件列表 */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            该时期的事件
          </h3>
          <EventList year={year} range={50} />
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => step('backward')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={togglePlay}
          className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={() => step('forward')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

// 事件列表组件
function EventList({ year, range }: { year: number; range: number }) {
  const [events, setEvents] = useState<BibleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    setMapCenter,
    setSelectedLocation,
    setAtlasPanelTab,
    setTimelineYear,
  } = useBibleStore();

  useEffect(() => {
    let mounted = true;

    async function fetchEvents() {
      try {
        const yearStart = year - range;
        const yearEnd = year + range;
        const res = await fetch(`/api/atlas/events?yearStart=${yearStart}&yearEnd=${yearEnd}`);
        const data = await res.json();
        if (mounted) {
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    fetchEvents();

    return () => {
      mounted = false;
    };
  }, [year, range]);

  // 点击事件，跳转到地图并定位
  const handleEventClick = (event: BibleEvent) => {
    if (event.location && event.locationId) {
      // 设置地图中心
      setMapCenter([event.location.latitude, event.location.longitude]);
      // 设置选中的地点
      setSelectedLocation({
        id: event.location.id,
        nameZh: event.location.nameZh,
        nameEn: event.location.nameEn,
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      });
      // 切换到地图标签
      setAtlasPanelTab('map');
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-sm">加载中...</div>;
  }

  if (events.length === 0) {
    return <div className="text-gray-500 text-sm">该时期暂无记录的事件</div>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          onClick={() => handleEventClick(event)}
          className={`p-3 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors ${
            event.locationId
              ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
              : 'cursor-default'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                {event.titleZh}
                {event.locationId && (
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {event.yearStart && (
                  <span>
                    {event.yearStart < 0 ? '公元前' : '公元'}
                    {Math.abs(event.yearStart)}
                    {event.yearEnd && event.yearEnd !== event.yearStart && ` - ${event.yearEnd < 0 ? '公元前' : '公元'}${Math.abs(event.yearEnd)}`}
                    {event.yearApprox && ' (约)'}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                  {event.description}
                </p>
              )}
              {event.location && (
                <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  📍 {event.location.nameZh}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}