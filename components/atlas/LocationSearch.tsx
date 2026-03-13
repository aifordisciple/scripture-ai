'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useBibleStore } from '@/store/useBibleStore';

interface Location {
  id: string;
  nameZh: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  region?: string;
}

interface LocationSearchProps {
  onSelectLocation: (location: Location) => void;
}

export default function LocationSearch({ onSelectLocation }: LocationSearchProps) {
  const { locationSearchQuery, setLocationSearchQuery, isDarkMode } = useBibleStore();
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 搜索地点
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/atlas/locations?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setResults(data.locations || []);
    } catch (error) {
      console.error('Failed to search locations:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationSearchQuery) {
        searchLocations(locationSearchQuery);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationSearchQuery, searchLocations]);

  const handleSelect = (location: Location) => {
    onSelectLocation(location);
    setLocationSearchQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={locationSearchQuery}
          onChange={(e) => {
            setLocationSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="搜索地点..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* 搜索结果下拉 */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((location) => (
            <button
              key={location.id}
              onClick={() => handleSelect(location)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
            >
              <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {location.nameZh}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {location.nameEn}
                  {location.region && ` · ${location.region}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 点击外部关闭 */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}