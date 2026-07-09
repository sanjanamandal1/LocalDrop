"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import { useI18n } from "@/i18n/provider";

type HeatPoint = {
  lat: string | number;
  lng: string | number;
  weight: string | number;
};

// Mock fallback hotspots in Indore for demo purposes
const DEMO_HOTSPOTS = [
  { lat: 22.7533, lng: 75.8937, weight: 85 }, // Vijay Nagar (Very High)
  { lat: 22.7512, lng: 75.8899, weight: 65 }, // Vijay Nagar Area (High)
  { lat: 22.7485, lng: 75.8955, weight: 75 }, // C21 Mall (High)
  { lat: 22.7233, lng: 75.8787, weight: 55 }, // Palasia (Medium)
  { lat: 22.7156, lng: 75.8537, weight: 45 }, // Rajwada (Medium)
  { lat: 22.6899, lng: 75.8655, weight: 30 }, // Bhawarkua (Low)
  { lat: 22.7222, lng: 75.8611, weight: 25 }, // MG Road (Low)
];

export default function LeafletHeatmap() {
  const { t } = useI18n();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatGroupRef = useRef<L.LayerGroup | null>(null);

  const { data: heatmapData } = useQuery<HeatPoint[]>({
    queryKey: ["creator-heatmap"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<HeatPoint[]>>("/analytics/creator/heatmap");
      return res.data.data;
    },
    staleTime: 30000,
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center Indore
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
    }).setView([22.7300, 75.8800], 12.5);
    
    mapRef.current = map;

    // Use CartoDB Positron map tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);

    heatGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Heatmap Points
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !heatGroupRef.current) return;

    heatGroupRef.current.clearLayers();

    // Use fetched data, fallback to mock demo hotspots if empty
    const rawPoints = heatmapData && heatmapData.length > 0
      ? heatmapData.map(p => ({
          lat: typeof p.lat === "string" ? parseFloat(p.lat) : p.lat,
          lng: typeof p.lng === "string" ? parseFloat(p.lng) : p.lng,
          weight: typeof p.weight === "string" ? parseInt(p.weight, 10) : p.weight,
        }))
      : DEMO_HOTSPOTS;

    // Aggregate points within a ~300m grid (rounding to 3 decimals)
    const groupedPoints: Record<string, { lat: number; lng: number; weight: number }> = {};
    
    rawPoints.forEach(p => {
      const latKey = p.lat.toFixed(3);
      const lngKey = p.lng.toFixed(3);
      const key = `${latKey}_${lngKey}`;
      
      if (groupedPoints[key]) {
        groupedPoints[key].weight += p.weight;
      } else {
        groupedPoints[key] = { lat: parseFloat(latKey), lng: parseFloat(lngKey), weight: p.weight };
      }
    });

    const points = Object.values(groupedPoints);
    const maxWeight = Math.max(...points.map(p => p.weight), 1);

    points.forEach(p => {
      // Determine relative intensity percentage
      const intensity = Math.round((p.weight / maxWeight) * 100);

      // Determine glow color based on weight intensity
      let color = "#10b981"; // Emerald for low
      if (intensity > 60) {
        color = "#ef4444"; // Red for very high
      } else if (intensity > 40) {
        color = "#f97316"; // Orange for high
      } else if (intensity > 20) {
        color = "#eab308"; // Yellow for medium
      }

      // 1. Wide outer glowing aura
      L.circleMarker([p.lat, p.lng], {
        radius: (intensity * 0.25) + 12,
        color: color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 0,
      }).addTo(heatGroupRef.current!);

      // 2. High-intensity middle ring
      L.circleMarker([p.lat, p.lng], {
        radius: (intensity * 0.15) + 6,
        color: color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 0,
      }).addTo(heatGroupRef.current!);

      // 3. Hot inner core
      const tooltipTemplate = p.weight === 1 ? "chart.intensitySingle" : "chart.intensity";
      L.circleMarker([p.lat, p.lng], {
        radius: (intensity * 0.05) + 3,
        color: "#ffffff",
        fillColor: color,
        fillOpacity: 0.8,
        weight: 1.5,
      }).bindTooltip(t(tooltipTemplate as any, { intensity: String(intensity), count: String(p.weight) }), {
        permanent: false,
        direction: "top",
        className: "font-semibold text-xs text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm"
      }).addTo(heatGroupRef.current!);
    });

    // Fit bounds to points if we have real coordinates
    if (heatmapData && heatmapData.length > 0 && points.length > 0) {
      const coords = points.map(p => [p.lat, p.lng] as L.LatLngExpression);
      map.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });
    }
  }, [heatmapData, t]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  return (
    <div className="w-full h-full relative group" style={{ minHeight: "320px" }}>
      <div 
        ref={mapContainerRef} 
        className="w-full h-full" 
      />
      {/* Custom Zoom Controls */}
      <div className="absolute bottom-4 left-4 z-[999] flex flex-col gap-1 bg-card/90 backdrop-blur-sm p-1 rounded-lg border border-border shadow-md">
        <button 
          onClick={handleZoomIn}
          className="flex h-7 w-7 items-center justify-center rounded bg-card hover:bg-muted text-foreground transition border border-border/80 font-bold text-sm active:scale-95"
          title="Zoom In"
        >
          ＋
        </button>
        <button 
          onClick={handleZoomOut}
          className="flex h-7 w-7 items-center justify-center rounded bg-card hover:bg-muted text-foreground transition border border-border/80 font-bold text-sm active:scale-95"
          title="Zoom Out"
        >
          －
        </button>
      </div>
    </div>
  );
}
