'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface SearchResult {
  id: string;
  nameZh: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  region?: string;
}

interface LocationSearchProps {
  onSelectLocation?: (location: SearchResult) => void;
}

export default function LocationSearch({ onSelectLocation }: LocationSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 搜索地点
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    let mounted = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/atlas/locations/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (mounted) {
          setResults(data.locations || []);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (location: SearchResult) => {
    onSelectLocation?.(location);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7a7a]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={t('atlas.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 bg-[#f5f5f7] dark:bg-[#1d1d1f] border border-[#e0e0e0] dark:border-[#3a3a3c] rounded-full text-sm text-[#1d1d1f] dark:text-white placeholder-[#7a7a7a] focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7a7a] hover:text-[#1d1d1f]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 搜索结果下拉 */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#272729] border border-[#e0e0e0] dark:border-[#3a3a3c] rounded-lg max-h-64 overflow-y-auto z-50">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-[#0066cc] mr-2" />
              <span className="text-sm text-[#7a7a7a]">...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-4 text-center text-sm text-[#7a7a7a]">
              --
            </div>
          ) : (
            results.map((location) => (
              <button
                key={location.id}
                onClick={() => handleSelect(location)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-[#0066cc] flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#1d1d1f] dark:text-white">{location.nameZh}</div>
                  <div className="text-xs text-[#7a7a7a]">{location.nameEn}{location.region ? ` · ${location.region}` : ''}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}