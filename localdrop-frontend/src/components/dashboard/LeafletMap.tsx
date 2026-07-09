"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface Cluster {
  name: string;
  weight: number;
  lat: number;
  lng: number;
}

interface Business {
  id: string;
  name: string;
  category: string;
  area: string;
  score: number;
  distance: string;
  lat: number;
  lng: number;
  active?: boolean;
  redemptions: number;
  reason: string;
  signals: {
    geo: number;
    content: number;
    conversion: number;
    affinity: number;
  };
}

interface LeafletMapProps {
  clusters: Cluster[];
  businesses: Business[];
  layers: {
    audience: boolean;
    businesses: boolean;
    geofence: boolean;
    heat: boolean;
    home: boolean;
  };
  selectedBusiness: Business | null;
  onSelectBusiness: (biz: Business) => void;
}

export default function LeafletMap({
  clusters,
  businesses,
  layers,
  selectedBusiness,
  onSelectBusiness
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  const audienceGroupRef = useRef<L.LayerGroup | null>(null);
  const businessGroupRef = useRef<L.LayerGroup | null>(null);
  const geofenceGroupRef = useRef<L.LayerGroup | null>(null);
  const heatGroupRef = useRef<L.LayerGroup | null>(null);
  const homeGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Indore center
    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([22.7196, 75.8577], 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);

    audienceGroupRef.current = L.layerGroup().addTo(map);
    businessGroupRef.current = L.layerGroup().addTo(map);
    geofenceGroupRef.current = L.layerGroup().addTo(map);
    heatGroupRef.current = L.layerGroup().addTo(map);
    homeGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update view when top cluster changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || clusters.length === 0) return;

    const topCluster = [...clusters].sort((a, b) => b.weight - a.weight)[0];
    if (topCluster) {
      map.flyTo([topCluster.lat, topCluster.lng], 13.5, { duration: 1.2 });
    }
  }, [clusters]);

  // Update overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    audienceGroupRef.current?.clearLayers();
    businessGroupRef.current?.clearLayers();
    geofenceGroupRef.current?.clearLayers();
    heatGroupRef.current?.clearLayers();
    homeGroupRef.current?.clearLayers();

    // 1. Home boundary
    if (layers.home && clusters.length > 0) {
      const coords = clusters.map(c => [c.lat, c.lng] as L.LatLngExpression);
      const bounds = L.latLngBounds(coords);
      L.circle(bounds.getCenter(), {
        radius: 3500,
        color: "#8b5cf6",
        fillColor: "#8b5cf6",
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: "6 6"
      }).addTo(homeGroupRef.current!);
    }

    // 2. Audience clusters
    if (layers.audience) {
      clusters.forEach(c => {
        L.circle([c.lat, c.lng], {
          radius: c.weight * 12,
          color: "#0f6e56",
          fillColor: "#5dcaa5",
          fillOpacity: 0.22,
          weight: 2
        })
        .bindTooltip(`<b>${c.name}</b>: ${c.weight}% audience`, { direction: "top" })
        .addTo(audienceGroupRef.current!);
      });
    }

    // 3. Businesses & Geofences
    businesses.forEach(b => {
      const isSelected = selectedBusiness?.id === b.id;
      const markerColor = b.score > 70 ? "#0f6e56" : b.score > 50 ? "#d85a30" : "#64748b";

      const iconHtml = `
        <div style="
          background-color: ${markerColor}; 
          width: 30px; 
          height: 30px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 3px 5px rgba(0,0,0,0.2); 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          transform: scale(${isSelected ? 1.25 : 1.0});
          transition: transform 0.15s ease-out;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.53.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.53.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.53.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.53.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 10V7"/></svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: b.active ? "animate-pulse" : "",
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      if (layers.businesses) {
        L.marker([b.lat, b.lng], { icon: customIcon })
          .on("click", () => onSelectBusiness(b))
          .addTo(businessGroupRef.current!);
      }

      if (layers.geofence && b.active) {
        // Geofence inner 200m
        L.circle([b.lat, b.lng], {
          radius: 200,
          color: "#d85a30",
          fill: false,
          weight: 1.5
        }).addTo(geofenceGroupRef.current!);

        // Geofence outer 500m
        L.circle([b.lat, b.lng], {
          radius: 500,
          color: "#d85a30",
          fill: false,
          weight: 1,
          dashArray: "5 4"
        }).addTo(geofenceGroupRef.current!);
      }

      if (layers.heat && b.redemptions > 0) {
        L.circle([b.lat, b.lng], {
          radius: b.redemptions * 25,
          color: "#ea580c",
          fillColor: "#ea580c",
          fillOpacity: 0.32,
          weight: 0
        }).addTo(heatGroupRef.current!);
      }
    });
  }, [clusters, businesses, layers, selectedBusiness]);

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
    <div className="w-full h-full relative group">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full" 
        style={{ minHeight: "620px" }}
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

