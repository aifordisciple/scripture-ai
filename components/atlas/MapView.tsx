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
  const [map, setMap] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);

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

  // 加载 Leaflet 地图
  useEffect(() => {
    if (!mapRef.current || map) return;

    let mapInstance: any;
    let markerGroup: any;

    async function initMap() {
      try {
        // 动态导入 Leaflet
        const L = (await import('leaflet')).default;

        // 修复 Leaflet 默认图标问题
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // 需要 CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(link);
        }

        // 初始化地图
        const center = mapCenter || [31.7683, 35.2137]; // 默认中心：耶路撒冷
        mapInstance = L.map(mapRef.current!, {
          center: center as [number, number],
          zoom: 7,
          zoomControl: false,
        });

        // 添加图层
        const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        });

        standardLayer.addTo(mapInstance);
        setMap(mapInstance);

        // 创建标记组
        markerGroup = L.layerGroup().addTo(mapInstance);

        // 添加标记
        if (locations.length > 0) {
          addMarkers(L, mapInstance, markerGroup);
        }

        // 地图点击事件
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
      }
    };
  }, [locations]);

  // 添加标记
  const addMarkers = (L: any, mapInstance: any, markerGroup: any) => {
    markerGroup.clearLayers();

    locations.forEach((location) => {
      // 检查地点的时间范围是否与当前时间线年份匹配
      if (timelineYear && location.yearStart && location.yearEnd) {
        if (timelineYear < location.yearStart || timelineYear > location.yearEnd) {
          return;
        }
      }

      const marker = L.marker([location.latitude, location.longitude]);

      // 弹出窗口
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-sm">${location.nameZh}</h3>
          <p class="text-xs text-gray-500">${location.nameEn || ''}</p>
          ${location.yearStart ? `<p class="text-xs text-gray-400">${location.yearStart < 0 ? t('atlas.eventYearBc', { year: Math.abs(location.yearStart) }) : t('atlas.eventYearAd', { year: location.yearStart })}</p>` : ''}
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

  // 更新地图中心
  useEffect(() => {
    if (map && mapCenter) {
      map.flyTo(mapCenter, 10, { duration: 1.5 });
    }
  }, [map, mapCenter]);

  // 选中地点高亮
  useEffect(() => {
    if (!map || !selectedLocationId) return;
    // 找到选中的地点并打开 popup
    const loc = locations.find((l: any) => l.id === selectedLocationId);
    if (loc) {
      map.flyTo([loc.latitude, loc.longitude], 12, { duration: 1 });
    }
  }, [map, selectedLocationId, locations]);

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (map) {
      setTimeout(() => map.invalidateSize(), 300);
    }
  };

  // 图层切换
  const handleLayerChange = async (layer: string) => {
    setSelectedLayer(layer);
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

      L.tileLayer(tileUrl, options).addTo(map);
    } catch (error) {
      console.error('Failed to switch layer:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
        <span className="text-gray-500">{t('atlas.loadingLocationData')}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'}`}>
      <div ref={mapRef} className="w-full h-full" />

      {/* 地图控件 */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        <button
          onClick={() => map?.zoomIn()}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={() => map?.zoomOut()}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Minus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {isFullscreen ? <Minimize className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Maximize className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowLayers(!showLayers)}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Layers className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          {showLayers && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 min-w-[120px] border border-gray-200 dark:border-gray-700">
              {['standard', 'satellite', 'terrain'].map((layer) => (
                <button
                  key={layer}
                  onClick={() => {
                    handleLayerChange(layer);
                    setShowLayers(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded ${
                    selectedLayer === layer
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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