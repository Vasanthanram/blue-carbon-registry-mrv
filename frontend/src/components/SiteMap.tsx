import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { Site } from "../types";
import { Layers } from "lucide-react";

interface SiteMapProps {
  sites: Site[];
  selectedSiteId: string | null;
  onSelectSite: (siteId: string) => void;
}

export const SiteMap: React.FC<SiteMapProps> = ({ sites, selectedSiteId, onSelectSite }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const [tileType, setTileType] = useState<"satellite" | "streets">("satellite");
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [11.428, 79.780],
      zoom: 14,
      zoomControl: true,
      attributionControl: false
    });

    const initialTiles = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = initialTiles;
    geojsonLayerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Tile Switching
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (tileType === "satellite") {
      tileLayerRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
    } else {
      tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
    }
  }, [tileType]);

  // Render Site Polygons
  useEffect(() => {
    if (!mapInstanceRef.current || !geojsonLayerGroupRef.current) return;

    geojsonLayerGroupRef.current.clearLayers();
    let selectedLayerBounds: L.LatLngBounds | null = null;

    sites.forEach((site) => {
      try {
        const geojson = JSON.parse(site.boundary_geojson);
        const isSelected = site.site_id === selectedSiteId;

        let strokeColor = "#15803d"; // soft green
        let fillColor = "#15803d";

        if (site.status === "UNDER_REVIEW") {
          strokeColor = "#b91c1c"; // soft red
          fillColor = "#b91c1c";
        } else if (site.status === "PENDING_BASELINE") {
          strokeColor = "#0284c7"; // calm sky blue
          fillColor = "#0284c7";
        }

        const layer = L.geoJSON(geojson, {
          style: {
            color: isSelected ? "#0f766e" : strokeColor,
            weight: isSelected ? 3.5 : 2,
            fillColor: fillColor,
            fillOpacity: isSelected ? 0.5 : 0.25,
            dashArray: isSelected ? undefined : "3, 3",
          }
        });

        layer.bindTooltip(
          `<div class="text-xs p-1">
            <strong>${site.name}</strong><br/>
            ID: ${site.site_id}<br/>
            Area: ${site.geodesic_area_ha} ha<br/>
            Status: ${site.status}
          </div>`,
          { sticky: true, opacity: 0.95 }
        );

        layer.on("click", () => {
          onSelectSite(site.site_id);
        });

        layer.addTo(geojsonLayerGroupRef.current!);

        if (isSelected) {
          selectedLayerBounds = layer.getBounds();
        }
      } catch (err) {
        console.error("Failed to parse GeoJSON for site", site.site_id, err);
      }
    });

    if (selectedLayerBounds && mapInstanceRef.current) {
      mapInstanceRef.current.flyToBounds(selectedLayerBounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [sites, selectedSiteId, onSelectSite]);

  return (
    <div className="relative w-full h-[380px] bg-slate-100 border border-slate-200 rounded overflow-hidden">
      
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Layer Toggle overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center bg-white border border-slate-300 rounded text-xs overflow-hidden">
        <button
          onClick={() => setTileType("satellite")}
          className={`flex items-center gap-1 px-2.5 py-1.5 cursor-pointer font-medium ${
            tileType === "satellite" ? "bg-teal-700 text-white" : "text-slate-700 bg-white hover:bg-slate-50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>
        <button
          onClick={() => setTileType("streets")}
          className={`px-2.5 py-1.5 cursor-pointer font-medium border-l border-slate-200 ${
            tileType === "streets" ? "bg-teal-700 text-white" : "text-slate-700 bg-white hover:bg-slate-50"
          }`}
        >
          <span>Map</span>
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 border border-slate-300 rounded px-3 py-2 text-[11px] text-slate-700 flex flex-wrap gap-4 items-center">
        <span className="font-semibold text-slate-800">Map Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
          <span>Active / Monitored</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
          <span>Under Review (Alert)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block"></span>
          <span>Pending Baseline</span>
        </div>
      </div>

    </div>
  );
};
