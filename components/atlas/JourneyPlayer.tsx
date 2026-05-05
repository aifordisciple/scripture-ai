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
      <div className="h-full flex items-center justify-center text-muted-foreground">
        {t('atlas.loadingJourneyData')}
      </div>
    );
  }

  // 旅程选择列表
  if (!selectedJourney) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-4">
          {t('atlas.selectJourney')}
        </h3>
        <div className="space-y-3">
          {journeys.map((journey) => (
            <button
              key={journey.id}
              onClick={() => handleSelectJourney(journey)}
              className="w-full p-4 bg-secondary dark:bg-background rounded-lg text-left hover:bg-accent dark:hover:bg-apple-tile3 transition-colors active:scale-95"
            >
              <div className="font-semibold text-foreground dark:text-foreground">
                {journey.titleZh}
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
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
          <div className="text-center text-muted-foreground dark:text-muted-foreground py-8">
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
      <div className="p-4 border-b border-border dark:border-border">
        <button
          onClick={() => setSelectedJourney(null)}
          className="text-sm text-primary dark:text-primary hover:underline mb-2 active:scale-95"
        >
          {t('atlas.returnToList')}
        </button>
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
          {selectedJourney.titleZh}
        </h3>
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">
          {t('atlas.journeyStep', { current: journeyStep + 1, total: selectedJourney.stops.length })}
        </div>
      </div>

      {/* 当前站点信息 */}
      <div className="flex-1 p-4">
        {selectedJourney.stops[journeyStep] && (
          <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {journeyStep + 1}
              </div>
              <div>
                <div className="font-semibold text-foreground dark:text-foreground">
                  {selectedJourney.stops[journeyStep].location.nameZh}
                </div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {selectedJourney.stops[journeyStep].location.nameEn}
                </div>
              </div>
            </div>
            {selectedJourney.stops[journeyStep].verseRef && (
              <div className="text-sm text-foreground dark:text-muted-foreground mt-2">
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
                  ? 'bg-primary/10 dark:bg-primary/20'
                  : 'hover:bg-accent dark:hover:bg-apple-tile3'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                index === journeyStep
                  ? 'bg-primary text-white'
                  : 'bg-accent dark:bg-apple-tile3 text-foreground dark:text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-foreground dark:text-foreground">
                  {stop.location.nameZh}
                </div>
              </div>
              {index === journeyStep && (
                <ChevronRight className="w-4 h-4 text-primary dark:text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 播放控制 */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-border dark:border-border">
        <button
          onClick={() => handleStepChange('prev')}
          disabled={journeyStep === 0}
          className="p-2 rounded-lg hover:bg-accent dark:hover:bg-apple-tile3 text-foreground dark:text-muted-foreground disabled:opacity-50 active:scale-95"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsPlayingJourney(!isPlayingJourney)}
          className="p-3 rounded-full bg-primary text-white hover:bg-apple-focus active:scale-95"
        >
          {isPlayingJourney ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={() => handleStepChange('next')}
          disabled={journeyStep === selectedJourney.stops.length - 1}
          className="p-2 rounded-lg hover:bg-accent dark:hover:bg-apple-tile3 text-foreground dark:text-muted-foreground disabled:opacity-50 active:scale-95"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}