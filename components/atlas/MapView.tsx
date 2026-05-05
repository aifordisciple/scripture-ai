'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Maximize, Minimize, Plus, Minus, Layers, MapPin } from 'lucide-react';
import { useBibleStore } from '@/store/useBibleStore';
import { useTranslation } from '@/lib/i18n';

interface MapViewProps {
  selectedLocationId?: string | null;
  onLocationSelect?: (location: any) => void;
}

export default function MapView({ selectedLocationId, onLocationSelect }: MapViewProps) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);

  const {
    mapCenter,
    setMapCenter,
    selectedLocation,
    setSelectedLocation,
    setSelectedLocationId,
    timelineYear,
  } = useBibleStore();

  // 加载地点数据
  useEffect(() => {
    let mounted = true;

    async function fetchLocations() {
      try {
        const res = await fetch('/api/atlas/locations');
        const data = await res.json();
        if (mounted) {
          setLocations(data.locations || []);
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    fetchLocations();

    return () => {
      mounted = false;
    };
  }, []);

  // 加载 Leaflet 地图（仅初始化一次）
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let mapInstance: any;
    let markerGroup: any;

    async function initMap() {
      try {
        const L = (await import('leaflet')).default;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(link);
        }

        const center = mapCenter || [31.7683, 35.2137];
        mapInstance = L.map(mapRef.current!, {
          center: center as [number, number],
          zoom: 7,
          zoomControl: false,
        });

        const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        });
        standardLayer.addTo(mapInstance);

        markerGroup = L.layerGroup().addTo(mapInstance);
        markerGroupRef.current = markerGroup;
        mapInstanceRef.current = mapInstance;

        mapInstance.on('click', () => {
          setSelectedLocation(null);
          setSelectedLocationId(null);
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to load map:', error);
        setLoading(false);
      }
    }

    initMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        mapInstanceRef.current = null;
        markerGroupRef.current = null;
      }
    };
  }, []); // 仅初始化一次

  // 增量更新标记（locations 或 timelineYear 变化时）
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup || locations.length === 0) return;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      markerGroup.clearLayers();

      locations.forEach((location) => {
        if (timelineYear && location.yearStart && location.yearEnd) {
          if (timelineYear < location.yearStart || timelineYear > location.yearEnd) {
            return;
          }
        }

        const marker = L.marker([location.latitude, location.longitude]);
        const popupContent = `
          <div class="p-2">
            <h3 class="font-semibold text-sm">${location.nameZh}</h3>
            <p class="text-xs" style="color: #7a7a7a">${location.nameEn || ''}</p>
            ${location.yearStart ? `<p class="text-xs" style="color: #7a7a7a">${location.yearStart < 0 ? t('atlas.eventYearBc', { year: Math.abs(location.yearStart) }) : t('atlas.eventYearAd', { year: location.yearStart })}</p>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);
        marker.on('click', () => {
          onLocationSelect?.(location);
          setSelectedLocation(location);
          setSelectedLocationId(location.id);
        });
        markerGroup.addLayer(marker);
      });
    };

    updateMarkers();
  }, [locations, timelineYear, onLocationSelect, t, setSelectedLocation, setSelectedLocationId]);

  // 更新地图中心
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && mapCenter) {
      map.flyTo(mapCenter, 10, { duration: 1.5 });
    }
  }, [mapCenter]);

  // 选中地点高亮
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocationId) return;
    const loc = locations.find((l: any) => l.id === selectedLocationId);
    if (loc) {
      map.flyTo([loc.latitude, loc.longitude], 12, { duration: 1 });
    }
  }, [selectedLocationId, locations]);

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    const map = mapInstanceRef.current;
    if (map) {
      setTimeout(() => map.invalidateSize(), 300);
    }
  };

  // 图层切换
  const handleLayerChange = async (layer: string) => {
    setSelectedLayer(layer);
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      const L = (await import('leaflet')).default;
      map.eachLayer((l: any) => {
        if (l instanceof L.TileLayer) {
          map.removeLayer(l);
        }
      });

      let tileUrl: string;
      let options: any = {};

      switch (layer) {
        case 'satellite':
          tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
          break;
        case 'terrain':
          tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
          break;
        default:
          tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
          options.attribution = '&copy; OpenStreetMap contributors';
      }

      L.tileLayer(tileUrl, options).addTo(mapInstanceRef.current!);
    } catch (error) {
      console.error('Failed to switch layer:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f5f5f7] dark:bg-[#1d1d1f]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0066cc] mr-2" />
        <span className="text-[#7a7a7a]">{t('atlas.loadingLocationData')}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'}`}>
      <div ref={mapRef} className="w-full h-full" />

      {/* 地图控件 */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-2 bg-white dark:bg-[#272729] rounded-lg hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] active:scale-95"
        >
          <Plus className="w-5 h-5 text-[#1d1d1f] dark:text-[#e0e0e0]" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-2 bg-white dark:bg-[#272729] rounded-lg hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] active:scale-95"
        >
          <Minus className="w-5 h-5 text-[#1d1d1f] dark:text-[#e0e0e0]" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white dark:bg-[#272729] rounded-lg hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] active:scale-95"
        >
          {isFullscreen ? <Minimize className="w-5 h-5 text-[#1d1d1f] dark:text-[#e0e0e0]" /> : <Maximize className="w-5 h-5 text-[#1d1d1f] dark:text-[#e0e0e0]" />}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowLayers(!showLayers)}
            className="p-2 bg-white dark:bg-[#272729] rounded-lg hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] active:scale-95"
          >
            <Layers className="w-5 h-5 text-[#1d1d1f] dark:text-[#e0e0e0]" />
          </button>
          {showLayers && (
            <div className="absolute right-0 top-10 bg-white dark:bg-[#272729] rounded-lg p-2 min-w-[120px] border border-[#e0e0e0] dark:border-[#3a3a3c]">
              {['standard', 'satellite', 'terrain'].map((layer) => (
                <button
                  key={layer}
                  onClick={() => {
                    handleLayerChange(layer);
                    setShowLayers(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded ${
                    selectedLayer === layer
                      ? 'bg-[#0066cc]/10 dark:bg-[#0066cc]/20 text-[#0066cc] dark:text-[#4d9fe0]'
                      : 'text-[#1d1d1f] dark:text-[#e0e0e0] hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c]'
                  }`}
                >
                  {layer === 'standard' ? t('atlas.tabMap') : layer === 'satellite' ? 'Satellite' : 'Terrain'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}