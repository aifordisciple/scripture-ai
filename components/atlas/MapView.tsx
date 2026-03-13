'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBibleStore } from '@/store/useBibleStore';

// 修复 Leaflet 默认图标问题
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface Location {
  id: string;
  nameZh: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  region?: string;
  description?: string;
}

interface MapViewProps {
  selectedLocationId?: string | null;
  onLocationSelect?: (location: Location) => void;
}

// 地图控制器组件
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

export default function MapView({ selectedLocationId, onLocationSelect }: MapViewProps) {
  const {
    isDarkMode,
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    timelineYear,
  } = useBibleStore();

  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载地点数据
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/atlas/locations?limit=200');
        const data = await res.json();
        setLocations(data.locations || []);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, []);

  // 加载事件数据（根据时间线年份筛选）
  useEffect(() => {
    async function fetchEvents() {
      if (!timelineYear) return;
      try {
        const yearStart = timelineYear - 50;
        const yearEnd = timelineYear + 50;
        const res = await fetch(`/api/atlas/events?yearStart=${yearStart}&yearEnd=${yearEnd}`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    }
    fetchEvents();
  }, [timelineYear]);

  // 当选中地点时，移动地图中心
  const selectedLocation = useMemo(() => {
    return locations.find(l => l.id === selectedLocationId);
  }, [locations, selectedLocationId]);

  // 优先使用 mapCenter（由外部更新），其次使用选中的地点
  const currentCenter: [number, number] = mapCenter;

  const currentZoom = selectedLocation ? 12 : mapZoom;

  // 创建自定义图标
  const createIcon = (isSelected: boolean) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="w-6 h-6 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-red-500'} border-2 border-white shadow-lg flex items-center justify-center">
        <div class="w-2 h-2 rounded-full bg-white"></div>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-gray-500 dark:text-gray-400">加载地点数据中...</div>
      </div>
    );
  }

  return (
    <MapContainer
      center={currentCenter}
      zoom={currentZoom}
      className="w-full h-full"
      style={{ background: isDarkMode ? '#1f2937' : '#f3f4f6' }}
    >
      <MapController center={currentCenter} zoom={currentZoom} />

      {/* 使用高德地图瓦片 - 中国可用 */}
      <TileLayer
        attribution='&copy; <a href="https://www.amap.com">高德地图</a>'
        url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
        subdomains={['1', '2', '3', '4']}
      />

      {/* 地点标记 */}
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.latitude, location.longitude]}
          icon={createIcon(location.id === selectedLocationId)}
          eventHandlers={{
            click: () => {
              onLocationSelect?.(location);
              setMapCenter([location.latitude, location.longitude]);
            },
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-semibold text-gray-900">{location.nameZh}</h3>
              <p className="text-sm text-gray-500">{location.nameEn}</p>
              {location.region && (
                <p className="text-xs text-gray-400 mt-1">{location.region}</p>
              )}
              {location.description && (
                <p className="text-sm text-gray-600 mt-2">{location.description}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* 事件标记（带时间线筛选） */}
      {events.filter(e => e.locationId).map((event) => {
        const location = locations.find(l => l.id === event.locationId);
        if (!location) return null;

        return (
          <Marker
            key={event.id}
            position={[location.latitude, location.longitude]}
            icon={L.divIcon({
              className: 'event-marker',
              html: `<div class="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-lg animate-pulse"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-gray-900">{event.titleZh}</h3>
                <p className="text-sm text-gray-500">
                  {event.yearStart ? `${event.yearStart < 0 ? '公元前' : '公元'}${Math.abs(event.yearStart)}年` : ''}
                </p>
                {event.description && (
                  <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}