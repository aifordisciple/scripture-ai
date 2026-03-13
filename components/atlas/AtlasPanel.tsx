'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useBibleStore } from '@/store/useBibleStore';
import { X, Map, Clock, Route, Search } from 'lucide-react';
import LocationCard from './LocationCard';
import TimelineSlider from './TimelineSlider';
import JourneyPlayer from './JourneyPlayer';
import LocationSearch from './LocationSearch';

// 动态导入地图组件（不支持SSR）
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-gray-500">加载地图中...</div>
    </div>
  ),
});

interface AtlasPanelProps {
  onClose?: () => void;
  initialLocationId?: string;
  initialYear?: number;
}

export default function AtlasPanel({ onClose, initialLocationId, initialYear }: AtlasPanelProps) {
  const {
    isDarkMode,
    atlasPanelTab,
    setAtlasPanelTab,
    selectedLocationId,
    setSelectedLocationId,
    selectedLocation,
    setSelectedLocation,
    timelineYear,
    setTimelineYear,
    activeJourneyId,
    isAtlasPanelOpen,
    setAtlasPanelOpen,
  } = useBibleStore();

  const [isMobile, setIsMobile] = useState(false);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 初始化
  useEffect(() => {
    if (initialLocationId) {
      setSelectedLocationId(initialLocationId);
    }
    if (initialYear) {
      setTimelineYear(initialYear);
    }
  }, [initialLocationId, initialYear]);

  const handleClose = useCallback(() => {
    setAtlasPanelOpen(false);
    onClose?.();
  }, [setAtlasPanelOpen, onClose]);

  const tabs = [
    { id: 'map', label: '地图', icon: Map },
    { id: 'timeline', label: '时间线', icon: Clock },
    { id: 'journey', label: '旅程', icon: Route },
  ] as const;

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${isDarkMode ? 'dark' : ''}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">圣经地图与时间线</h2>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <LocationSearch onSelectLocation={(loc) => {
          setSelectedLocation(loc);
          setSelectedLocationId(loc.id);
          setAtlasPanelTab('map');
        }} />
      </div>

      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAtlasPanelTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              atlasPanelTab === tab.id
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {atlasPanelTab === 'map' && (
          <div className="h-full relative">
            <MapView
              selectedLocationId={selectedLocationId}
              onLocationSelect={(loc) => {
                setSelectedLocation(loc);
                setSelectedLocationId(loc.id);
              }}
            />
            {/* 地点信息卡片 */}
            {selectedLocation && (
              <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80">
                <LocationCard
                  location={selectedLocation}
                  onClose={() => {
                    setSelectedLocation(null);
                    setSelectedLocationId(null);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {atlasPanelTab === 'timeline' && (
          <div className="h-full flex flex-col">
            <TimelineSlider
              year={timelineYear}
              onYearChange={setTimelineYear}
            />
          </div>
        )}

        {atlasPanelTab === 'journey' && (
          <div className="h-full">
            <JourneyPlayer
              journeyId={activeJourneyId}
              onSelectJourney={setSelectedLocationId}
            />
          </div>
        )}
      </div>
    </div>
  );
}