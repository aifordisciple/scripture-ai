'use client';

import { useState, useEffect } from 'react';
import { useBibleStore } from '@/store/useBibleStore';
import { useTranslation } from '@/lib/i18n';
import { Play, Pause, SkipBack, SkipForward, ChevronRight } from 'lucide-react';

interface JourneyPlayerProps {
  journeyId?: string | null;
  onSelectJourney?: (locationId: string) => void;
}

interface Journey {
  id: string;
  titleZh: string;
  yearStart?: number;
  yearEnd?: number;
  journeyType: string;
  stops: Array<{
    id: string;
    order: number;
    verseRef?: string;
    location: {
      id: string;
      nameZh: string;
      nameEn: string;
      latitude: number;
      longitude: number;
    };
  }>;
}

export default function JourneyPlayer({ journeyId, onSelectJourney }: JourneyPlayerProps) {
  const { t } = useTranslation();
  const { journeyStep, setJourneyStep, isPlayingJourney, setIsPlayingJourney, setMapCenter, setMapZoom } = useBibleStore();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载旅程列表
  useEffect(() => {
    async function fetchJourneys() {
      try {
        const res = await fetch('/api/atlas/journeys');
        const data = await res.json();
        setJourneys(data.journeys || []);
      } catch (error) {
        console.error('Failed to fetch journeys:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchJourneys();
  }, []);

  // 选择旅程
  useEffect(() => {
    if (journeyId) {
      const journey = journeys.find(j => j.id === journeyId);
      if (journey) {
        setSelectedJourney(journey);
      }
    }
  }, [journeyId, journeys]);

  // 自动播放
  useEffect(() => {
    if (!isPlayingJourney || !selectedJourney) return;

    const interval = setInterval(() => {
      setJourneyStep((prev) => {
        if (prev >= selectedJourney.stops.length - 1) {
          setIsPlayingJourney(false);
          return prev;
        }
        const nextStep = prev + 1;
        const stop = selectedJourney.stops[nextStep];
        if (stop) {
          setMapCenter([stop.location.latitude, stop.location.longitude]);
          onSelectJourney?.(stop.location.id);
        }
        return nextStep;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlayingJourney, selectedJourney, setJourneyStep, setIsPlayingJourney, setMapCenter, onSelectJourney]);

  const handleSelectJourney = (journey: Journey) => {
    setSelectedJourney(journey);
    setJourneyStep(0);
    setIsPlayingJourney(false);
    if (journey.stops[0]) {
      setMapCenter([journey.stops[0].location.latitude, journey.stops[0].location.longitude]);
      onSelectJourney?.(journey.stops[0].location.id);
    }
  };

  const handleStepChange = (direction: 'prev' | 'next') => {
    if (!selectedJourney) return;

    const newStep = direction === 'next'
      ? Math.min(journeyStep + 1, selectedJourney.stops.length - 1)
      : Math.max(journeyStep - 1, 0);

    setJourneyStep(newStep);
    const stop = selectedJourney.stops[newStep];
    if (stop) {
      setMapCenter([stop.location.latitude, stop.location.longitude]);
      onSelectJourney?.(stop.location.id);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        {t('atlas.loadingJourneyData')}
      </div>
    );
  }

  // 旅程选择列表
  if (!selectedJourney) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('atlas.selectJourney')}
        </h3>
        <div className="space-y-3">
          {journeys.map((journey) => (
            <button
              key={journey.id}
              onClick={() => handleSelectJourney(journey)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {journey.titleZh}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('atlas.stopsCount', { count: journey.stops.length })}
                {journey.yearStart && (
                  <span className="ml-2">
                    ({journey.yearStart < 0 ? t('atlas.bc') : t('atlas.ad')}{Math.abs(journey.yearStart)})
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {journeys.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            {t('atlas.noJourneyData')}
          </div>
        )}
      </div>
    );
  }

  // 旅程播放界面
  return (
    <div className="h-full flex flex-col">
      {/* 旅程标题 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setSelectedJourney(null)}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
        >
          {t('atlas.returnToList')}
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {selectedJourney.titleZh}
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('atlas.journeyStep', { current: journeyStep + 1, total: selectedJourney.stops.length })}
        </div>
      </div>

      {/* 当前站点信息 */}
      <div className="flex-1 p-4">
        {selectedJourney.stops[journeyStep] && (
          <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                {journeyStep + 1}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {selectedJourney.stops[journeyStep].location.nameZh}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedJourney.stops[journeyStep].location.nameEn}
                </div>
              </div>
            </div>
            {selectedJourney.stops[journeyStep].verseRef && (
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                📖 {selectedJourney.stops[journeyStep].verseRef}
              </div>
            )}
          </div>
        )}

        {/* 站点列表 */}
        <div className="mt-4 space-y-2">
          {selectedJourney.stops.map((stop, index) => (
            <button
              key={stop.id}
              onClick={() => {
                setJourneyStep(index);
                setMapCenter([stop.location.latitude, stop.location.longitude]);
                onSelectJourney?.(stop.location.id);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                index === journeyStep
                  ? 'bg-indigo-100 dark:bg-indigo-900/50'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                index === journeyStep
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {stop.location.nameZh}
                </div>
              </div>
              {index === journeyStep && (
                <ChevronRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 播放控制 */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleStepChange('prev')}
          disabled={journeyStep === 0}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsPlayingJourney(!isPlayingJourney)}
          className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {isPlayingJourney ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={() => handleStepChange('next')}
          disabled={journeyStep === selectedJourney.stops.length - 1}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-50"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}