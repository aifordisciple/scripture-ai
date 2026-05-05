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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={t('atlas.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 bg-secondary dark:bg-background border border-border dark:border-border rounded-full text-sm text-foreground dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 搜索结果下拉 */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card dark:bg-card border border-border dark:border-border rounded-lg max-h-64 overflow-y-auto z-50">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              --
            </div>
          ) : (
            results.map((location) => (
              <button
                key={location.id}
                onClick={() => handleSelect(location)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent dark:hover:bg-apple-tile3 transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-foreground dark:text-foreground">{location.nameZh}</div>
                  <div className="text-xs text-muted-foreground">{location.nameEn}{location.region ? ` · ${location.region}` : ''}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}