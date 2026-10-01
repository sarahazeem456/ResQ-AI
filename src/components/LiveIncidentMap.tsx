import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Incident, Responder, SeverityLevel } from '../types';

interface LiveIncidentMapProps {
  incidents: Incident[];
  responders?: Responder[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: Incident) => void;
  heightClass?: string;
  zoom?: number;
  center?: [number, number];
  allowDropPin?: boolean;
  onPinDropped?: (lat: number, lng: number, addressName?: string) => void;
}

type MapLayerType = 'streets' | 'satellite' | 'dark' | 'topo';

const TILE_LAYERS: Record<MapLayerType, { name: string; url: string; attribution: string; maxZoom: number }> = {
  dark: {
    name: 'Tactical Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    maxZoom: 19
  },
  streets: {
    name: 'Real Streets (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  satellite: {
    name: 'Satellite Aerial (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri & Maxar Earthstar Geographics',
    maxZoom: 18
  },
  topo: {
    name: 'Topographic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
    maxZoom: 17
  }
};

const SEVERITY_COLORS: Record<SeverityLevel, { dot: string; glow: string; text: string }> = {
  CRITICAL: { dot: '#ef4444', glow: 'rgba(239, 68, 68, 0.55)', text: 'Critical' },
  HIGH: { dot: '#f97316', glow: 'rgba(249, 115, 22, 0.45)', text: 'High' },
  MEDIUM: { dot: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', text: 'Medium' },
  LOW: { dot: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)', text: 'Low' },
};

export const LiveIncidentMap: React.FC<LiveIncidentMapProps> = ({
  incidents,
  responders = [],
  selectedIncidentId,
  onSelectIncident,
  heightClass = 'h-[460px]',
  zoom = 13,
  center = [37.7749, -122.4194],
  allowDropPin = true,
  onPinDropped
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true
    });

    // Add Initial Tile Layer
    const tileConfig = TILE_LAYERS[activeLayer];
    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      attribution: tileConfig.attribution
    }).addTo(map);
    currentTileLayerRef.current = tileLayer;

    // Zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    // Track mouse coordinates for tactical precision
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setHoveredCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // Optional click to drop emergency pinpoint
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (allowDropPin && onPinDropped) {
        onPinDropped(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
      currentTileLayerRef.current = null;
    };
  }, []);

  // Switch Tile Layers dynamically (Dark, Real Streets OSM, Satellite Imagery)
  const handleSwitchLayer = (type: MapLayerType) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setActiveLayer(type);

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const tileConfig = TILE_LAYERS[type];
    const newLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      attribution: tileConfig.attribution
    }).addTo(map);

    currentTileLayerRef.current = newLayer;
  };

  // Real-world Geocoding Search using OpenStreetMap Nominatim API
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const displayName = data[0].display_name;

        mapInstanceRef.current.flyTo([lat, lon], 15, { duration: 1.5 });

        // Flash temporary search marker
        const searchMarker = L.circleMarker([lat, lon], {
          radius: 10,
          color: '#38bdf8',
          fillColor: '#38bdf8',
          fillOpacity: 0.8
        }).addTo(mapInstanceRef.current);

        searchMarker.bindPopup(`
          <div style="font-size: 12px; font-weight: bold; color: #f8fafc;">
            📍 ${displayName}
          </div>
        `).openPopup();

        setTimeout(() => {
          mapInstanceRef.current?.removeLayer(searchMarker);
        }, 8000);
      } else {
        setSearchError('Location not found.');
      }
    } catch {
      setSearchError('Search service unavailable.');
    } finally {
      setIsSearching(false);
    }
  };

  // Locate Current User GPS
  const handleLocateMe = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation([lat, lng]);
          map.flyTo([lat, lng], 15, { duration: 1.2 });
        },
        () => {
          // fallback
          map.flyTo([center[0], center[1]], 14);
        }
      );
    }
  };

  // Render Markers, Active Routes, Danger Zones, and Responders
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw User Location Beacon if active
    if (userLocation) {
      const userDot = L.circleMarker(userLocation, {
        radius: 8,
        color: '#ffffff',
        fillColor: '#0284c7',
        fillOpacity: 0.9,
        weight: 2
      });
      const userRing = L.circle(userLocation, {
        radius: 120,
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.15,
        weight: 1
      });
      userDot.bindPopup('<b>📍 Your Current GPS Location</b>');
      layerGroup.addLayer(userDot);
      layerGroup.addLayer(userRing);
    }

    // 2. Render Incident Danger & Buffer Perimeters
    incidents.forEach(inc => {
      if (inc.status !== 'RESOLVED' && inc.status !== 'CANCELLED') {
        const radiusMeters = inc.severity === 'CRITICAL' ? 220 : inc.severity === 'HIGH' ? 140 : 80;
        const color = inc.severity === 'CRITICAL' ? '#ef4444' : inc.severity === 'HIGH' ? '#f97316' : '#eab308';

        const bufferCircle = L.circle([inc.latitude, inc.longitude], {
          radius: radiusMeters,
          color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 1.2,
          dashArray: '4, 6'
        });
        layerGroup.addLayer(bufferCircle);
      }
    });

    // 3. Render Active Dispatch Route Polylines
    responders.forEach(resp => {
      if ((resp.status === 'DISPATCHED' || resp.status === 'ON_SCENE') && resp.assigned_incident_id) {
        const targetInc = incidents.find(i => i.id === resp.assigned_incident_id);
        if (targetInc && targetInc.status !== 'RESOLVED' && targetInc.status !== 'CANCELLED') {
          const polyline = L.polyline(
            [
              [resp.latitude, resp.longitude],
              [targetInc.latitude, targetInc.longitude]
            ],
            {
              color: resp.status === 'ON_SCENE' ? '#10b981' : '#38bdf8',
              weight: 3.5,
              opacity: 0.85,
              dashArray: '6, 8',
              lineCap: 'round'
            }
          );
          layerGroup.addLayer(polyline);
        }
      }
    });

    // 4. Render Responders
    responders.forEach(resp => {
      const typeIcon =
        resp.type === 'AMBULANCE' ? '🚑' :
        resp.type === 'POLICE' ? '🚓' :
        resp.type === 'FIRE' ? '🚒' : '🛟';

      const isDispatched = resp.status === 'DISPATCHED';
      const isOnScene = resp.status === 'ON_SCENE';

      const respIconHtml = `
        <div style="position: relative;">
          <div style="
            width: 32px;
            height: 32px;
            background: #090d16;
            border: 2px solid ${isOnScene ? '#10b981' : isDispatched ? '#f59e0b' : '#38bdf8'};
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            box-shadow: 0 0 12px ${isOnScene ? 'rgba(16, 185, 129, 0.7)' : isDispatched ? 'rgba(245, 158, 11, 0.7)' : 'rgba(56, 189, 248, 0.5)'};
            cursor: pointer;
            transition: all 0.4s ease;
          ">
            ${typeIcon}
          </div>
          ${isDispatched ? `
            <div style="
              position: absolute;
              bottom: -15px;
              left: 50%;
              transform: translateX(-50%);
              background: #0f172a;
              color: #f59e0b;
              border: 1px solid #f59e0b;
              border-radius: 4px;
              padding: 0 4px;
              font-size: 9px;
              font-weight: 700;
              font-family: monospace;
              white-space: nowrap;
            ">
              ${resp.eta_minutes !== undefined ? `${resp.eta_minutes.toFixed(1)}m` : 'Transit'}
            </div>
          ` : ''}
          ${isOnScene ? `
            <div style="
              position: absolute;
              bottom: -15px;
              left: 50%;
              transform: translateX(-50%);
              background: #064e3b;
              color: #34d399;
              border: 1px solid #10b981;
              border-radius: 4px;
              padding: 0 4px;
              font-size: 8px;
              font-weight: 800;
              white-space: nowrap;
            ">
              ON SCENE
            </div>
          ` : ''}
        </div>
      `;

      const respIcon = L.divIcon({
        html: respIconHtml,
        className: 'custom-resp-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([resp.latitude, resp.longitude], { icon: respIcon });
      marker.bindPopup(`
        <div style="font-size: 12px; line-height: 1.4;">
          <div style="font-weight: 700; color: #38bdf8; font-size: 13px;">${resp.callsign} · ${resp.name}</div>
          <div style="color: #94a3b8; margin-top: 2px;">Type: ${resp.type} · Status: <span style="color: ${isOnScene ? '#34d399' : '#4ade80'}; font-weight: 700;">${resp.status}</span></div>
          ${resp.assigned_incident_id ? `<div style="color: #fbbf24; margin-top: 2px;">Assigned to Incident #${resp.assigned_incident_id}</div>` : ''}
          <div style="color: #cbd5e1; margin-top: 4px;">ETA: ${resp.eta_minutes !== undefined ? `${resp.eta_minutes.toFixed(1)} mins` : 'Available'} · Phone: ${resp.phone}</div>
        </div>
      `);
      layerGroup.addLayer(marker);
    });

    // 5. Render Incidents
    incidents.forEach(inc => {
      const isSelected = inc.id === selectedIncidentId;
      const isResolved = inc.status === 'RESOLVED';
      const colors = isResolved
        ? { dot: '#64748b', glow: 'rgba(100, 116, 139, 0.2)', text: 'Resolved' }
        : SEVERITY_COLORS[inc.severity];

      const pulseAnimation = !isResolved && (inc.severity === 'CRITICAL' || inc.is_sos)
        ? `box-shadow: 0 0 0 0 ${colors.glow}; animation: pulse-fast 1.4s infinite;`
        : `box-shadow: 0 0 12px ${colors.glow};`;

      const markerHtml = `
        <div style="
          width: ${isSelected ? '30px' : '22px'};
          height: ${isSelected ? '30px' : '22px'};
          border-radius: 50%;
          background: ${colors.dot};
          border: 2.5px solid ${isSelected ? '#ffffff' : '#0a0e17'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 10px;
          cursor: pointer;
          transition: transform 0.15s ease;
          ${pulseAnimation}
        ">
          ${inc.is_sos ? '!' : ''}
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-incident-marker',
        iconSize: [isSelected ? 30 : 22, isSelected ? 30 : 22],
        iconAnchor: [isSelected ? 15 : 11, isSelected ? 15 : 11]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon });

      marker.on('click', () => {
        if (onSelectIncident) {
          onSelectIncident(inc);
        }
      });

      const popupHtml = `
        <div style="font-size: 12px; line-height: 1.4; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 700; color: #f8fafc; font-size: 13px;">#${inc.id} · ${inc.type}</span>
            <span style="font-size: 10px; font-weight: 700; color: ${colors.dot}; letter-spacing: 0.05em;">${inc.severity}</span>
          </div>
          <p style="color: #cbd5e1; margin-bottom: 6px; font-size: 11px;">📍 ${inc.address}</p>
          <div style="background: rgba(15, 23, 42, 0.85); padding: 6px; border-radius: 4px; border: 1px solid #1e293b; margin-bottom: 8px;">
            <div style="font-size: 10px; color: #94a3b8; font-weight: bold;">AI TRIAGE ASSESSMENT</div>
            <div style="color: #e2e8f0; font-size: 11px;">${inc.ai_summary.slice(0, 110)}...</div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
            <span style="color: #94a3b8;">Status: <strong style="color: #38bdf8;">${inc.status}</strong></span>
            <span style="color: #94a3b8;">Casualties: <strong style="color: #f1f5f9;">${inc.people_affected}</strong></span>
          </div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace;">
            GPS: ${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      layerGroup.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [incidents, responders, selectedIncidentId, onSelectIncident, userLocation]);

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col`}>
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 max-w-[calc(100%-120px)]">
        {/* Real Geocoding Search Box */}
        <form onSubmit={handleSearchLocation} className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 shadow-lg">
          <input
            type="text"
            placeholder="Search real city, street, or address..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-44 sm:w-60"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="text-xs text-cyan-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
          >
            {isSearching ? '...' : '🔍'}
          </button>
        </form>

        {/* Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 shadow-lg cursor-pointer"
          title="Locate my GPS position"
        >
          <span>🎯</span>
          <span className="hidden sm:inline">GPS Me</span>
        </button>

        {/* Real Map Layer Switcher */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-lg text-xs">
          {(['dark', 'streets', 'satellite'] as MapLayerType[]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => handleSwitchLayer(type)}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer text-[11px] ${
                activeLayer === type
                  ? 'bg-slate-800 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type === 'dark' ? 'Dark' : type === 'streets' ? 'Real Streets' : 'Satellite'}
            </button>
          ))}
        </div>
      </div>

      {/* Map Legend & Active Telemetry at Top Right */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2.5 shadow-lg">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span>Crit</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Low</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="text-cyan-400 font-mono text-[10px]">
          {incidents.filter(i => i.status !== 'RESOLVED').length} Active
        </div>
      </div>

      {/* Real-time Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Bottom Coordinates & Precision Readout Bar */}
      <div className="bg-slate-950/90 border-t border-slate-800 px-3 py-1 flex items-center justify-between text-[10px] text-slate-400 font-mono z-[1000]">
        <div>
          Layer: <strong className="text-slate-200">{TILE_LAYERS[activeLayer].name}</strong> · Real Precision GIS
        </div>
        <div className="flex items-center gap-3">
          {hoveredCoords && (
            <span>
              Lat: {hoveredCoords.lat.toFixed(5)}, Lng: {hoveredCoords.lng.toFixed(5)}
            </span>
          )}
          <span className="text-emerald-400">● GPS LOCK</span>
        </div>
      </div>

      {searchError && (
        <div className="absolute bottom-8 left-3 z-[1000] bg-red-950/90 text-red-200 text-xs px-2.5 py-1 rounded border border-red-700">
          {searchError}
        </div>
      )}
    </div>
  );
};
