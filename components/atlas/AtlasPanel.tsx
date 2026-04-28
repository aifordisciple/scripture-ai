'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useBibleStore } from '@/store/useBibleStore';
import { useTranslation } from '@/lib/i18n';
import { Map, Clock, Route, Search, Loader2, MapPin } from 'lucide-react';
import LocationCard from './LocationCard';
import TimelineSlider from './TimelineSlider';
import JourneyPlayer from './JourneyPlayer';
import LocationSearch from './LocationSearch';
import LocationVersesView from './LocationVersesView';

// 动态导入地图组件（不支持SSR）
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-gray-500">...</div>
    </div>
  ),
});

interface AtlasPanelProps {
  onClose?: () => void;
  initialLocationId?: string;
  initialYear?: number;
  // 移除 verseContext prop，改为从 store 读取
}

export default function AtlasPanel({ onClose, initialLocationId, initialYear }: AtlasPanelProps) {
  const { t } = useTranslation();
  const {
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
    setMapCenter,
    apiConfig,
    // 从 store 读取经文上下文
    atlasVerseContext,
    // 查看地点相关经文状态
    viewingLocationVerses,
    setViewingLocationVerses,
  } = useBibleStore();

  const [isMobile, setIsMobile] = useState(false);
  const [extractingLocations, setExtractingLocations] = useState(false);
  const [extractedLocations, setExtractedLocations] = useState<any[]>([]);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // 使用 store 中的 atlasVerseContext 代替 prop
  const verseContext = atlasVerseContext;

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

  // 当有经文上下文时，调用 AI 提取地点
  useEffect(() => {
    if (!verseContext?.verseContent) return;

    console.log('AtlasPanel - verseContext:', verseContext);

    async function extractLocations() {
      setExtractingLocations(true);
      setExtractionError(null);

      // 获取完整的 apiConfig，确保包含 apiKey
      const currentApiConfig = useBibleStore.getState().apiConfig;
      console.log('AtlasPanel - apiConfig:', {
        provider: currentApiConfig.provider,
        baseUrl: currentApiConfig.baseUrl,
        hasApiKey: !!currentApiConfig.apiKey,
        model: currentApiConfig.model,
      });

      try {
        const res = await fetch('/api/atlas/ai-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: verseContext.bookId,
            chapter: verseContext.chapter,
            verseStart: verseContext.verseStart,
            verseEnd: verseContext.verseEnd,
            verseContent: verseContext.verseContent,
            apiConfig: currentApiConfig,
          }),
        });

        if (!res.ok) {
          throw new Error(t('atlas.extractFailed'));
        }

        const data = await res.json();
        console.log('AtlasPanel - extracted locations:', data.locations);
        setExtractedLocations(data.locations || []);

        // 如果提取到地点，自动选中第一个并定位地图
        if (data.locations && data.locations.length > 0) {
          const firstLocation = data.locations[0];
          console.log('AtlasPanel - setting first location:', firstLocation.nameZh, firstLocation.latitude, firstLocation.longitude);
          setSelectedLocation(firstLocation);
          setSelectedLocationId(firstLocation.id);
          // 移动地图中心到第一个地点
          setMapCenter([firstLocation.latitude, firstLocation.longitude]);
        }
      } catch (error: any) {
        console.error('Failed to extract locations:', error);
        setExtractionError(error.message || t('atlas.extractFailed'));
      } finally {
        setExtractingLocations(false);
      }
    }

    extractLocations();
  }, [verseContext, apiConfig]);

  const tabs = [
    { id: 'map', label: t('atlas.tabMap'), icon: Map },
    { id: 'timeline', label: t('atlas.tabTimeline'), icon: Clock },
    { id: 'journey', label: t('atlas.tabJourney'), icon: Route },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* 经文信息提示 */}
      {verseContext && (
        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
          <div className="text-sm text-indigo-700 dark:text-indigo-300">
            📖 {verseContext.bookName} {verseContext.chapter}:{verseContext.verseStart}
            {verseContext.verseEnd !== verseContext.verseStart && `-${verseContext.verseEnd}`}
          </div>
        </div>
      )}

      {/* AI 提取状态 */}
      {extractingLocations && (
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          <span className="text-sm text-amber-700 dark:text-amber-300">{t('atlas.extractingLocations')}</span>
        </div>
      )}

      {/* 提取错误提示 */}
      {extractionError && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
          <span className="text-sm text-red-700 dark:text-red-300">⚠️ {extractionError}</span>
        </div>
      )}

      {/* 提取到的地点列表 */}
      {extractedLocations.length > 0 && !extractingLocations && (
        <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {t('atlas.identifiedLocations', { count: extractedLocations.length })}
            {extractedLocations.map((loc, idx) => (
              <button
                key={loc.id}
                onClick={() => {
                  setSelectedLocation(loc);
                  setSelectedLocationId(loc.id);
                  setMapCenter([loc.latitude, loc.longitude]);
                }}
                className="px-2 py-0.5 bg-green-100 dark:bg-green-800 rounded text-xs hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
              >
                {loc.nameZh}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <LocationSearch onSelectLocation={(loc) => {
          setSelectedLocation(loc);
          setSelectedLocationId(loc.id);
          setMapCenter([loc.latitude, loc.longitude]);
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
      <div className="flex-1 overflow-hidden relative">
        {/* 查看地点相关经文视图 */}
        {viewingLocationVerses ? (
          <LocationVersesView
            locationId={viewingLocationVerses.locationId}
            locationName={viewingLocationVerses.locationName}
            onBack={() => setViewingLocationVerses(null)}
          />
        ) : atlasPanelTab === 'map' ? (
          <div className="h-full relative">
            <MapView
              selectedLocationId={selectedLocationId}
              onLocationSelect={(loc) => {
                setSelectedLocation(loc);
                setSelectedLocationId(loc.id);
              }}
            />
            {/* 地点信息卡片 - 确保在地图之上 */}
            {selectedLocation && (
              <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[9999]" style={{ zIndex: 9999 }}>
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
        ) : atlasPanelTab === 'timeline' ? (
          <div className="h-full flex flex-col">
            <TimelineSlider
              year={timelineYear}
              onYearChange={setTimelineYear}
            />
          </div>
        ) : atlasPanelTab === 'journey' ? (
          <div className="h-full">
            <JourneyPlayer
              journeyId={activeJourneyId}
              onSelectJourney={setSelectedLocationId}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}