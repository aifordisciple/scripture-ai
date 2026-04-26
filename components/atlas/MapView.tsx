'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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
    activeJourneyId,
    journeyStep,
  } = useBibleStore();

  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [journeyStops, setJourneyStops] = useState<any[]>([]);
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

  // 加载旅程站点数据
  useEffect(() => {
    async function fetchJourneyStops() {
      if (!activeJourneyId) {
        setJourneyStops([]);
        return;
      }
      try {
        const res = await fetch(`/api/atlas/journeys?id=${activeJourneyId}`);
        const data = await res.json();
        setJourneyStops(data.journey?.stops || []);
      } catch (error) {
        console.error('Failed to fetch journey stops:', error);
      }
    }
    fetchJourneyStops();
  }, [activeJourneyId]);

  // 当选中地点时，移动地图中心
  const selectedLocation = useMemo(() => {
    return locations.find(l => l.id === selectedLocationId);
  }, [locations, selectedLocationId]);

  // 优先使用 mapCenter（由外部更新），其次使用选中的地点
  const currentCenter: [number, number] = mapCenter;
  const currentZoom = selectedLocation ? 12 : mapZoom;

  // 调试日志
  useEffect(() => {
    console.log('MapView - mapCenter:', mapCenter, 'selectedLocationId:', selectedLocationId, 'zoom:', currentZoom);
  }, [mapCenter, selectedLocationId, currentZoom]);

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

      {/* 根据深色模式切换地图瓦片 */}
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com">Esri</a>'
        url={isDarkMode
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        }
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

      {/* 旅程路线绘制 */}
      {journeyStops.length > 1 && (
        <Polyline
          positions={journeyStops
            .sort((a, b) => a.order - b.order)
            .map(stop => [stop.location.latitude, stop.location.longitude] as [number, number])}
          pathOptions={{
            color: '#6366f1',
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 10',
          }}
        />
      )}

      {/* 旅程站点标记 */}
      {journeyStops.map((stop, index) => {
        const isCurrentStop = index === journeyStep;
        const isVisited = index <= journeyStep;

        return (
          <Marker
            key={`journey-${stop.id}`}
            position={[stop.location.latitude, stop.location.longitude]}
            icon={L.divIcon({
              className: 'journey-marker',
              html: `<div class="w-8 h-8 rounded-full ${
                isCurrentStop
                  ? 'bg-indigo-600 ring-4 ring-indigo-300'
                  : isVisited
                    ? 'bg-indigo-500'
                    : 'bg-gray-400'
              } border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
                ${stop.order}
              </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="text-xs text-indigo-600 font-medium">第 {stop.order} 站</div>
                <h3 className="font-semibold text-gray-900">{stop.location.nameZh}</h3>
                <p className="text-sm text-gray-500">{stop.location.nameEn}</p>
                {stop.verseRef && (
                  <p className="text-xs text-gray-400 mt-1">📖 {stop.verseRef}</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}