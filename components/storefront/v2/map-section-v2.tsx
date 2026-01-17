"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

interface Location {
  id: string;
  name: string;
  type: string;
  isMain: boolean;
  latitude: number;
  longitude: number;
  addressLine1: string;
  city: string;
  state?: string;
  country: string;
  phone?: string;
}

interface MapSectionV2Props {
  locations: Location[];
  height?: number;
  zoom?: number;
  interactive?: boolean;
  pinColor?: string;
}

export default function MapSectionV2({
  locations,
  height = 400,
  zoom = 13,
  interactive = true,
}: MapSectionV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isClient) return;

    // Dynamically import Leaflet only on client
    import("leaflet").then((L) => {
      // @ts-expect-error - CSS import for side effects
      import("leaflet/dist/leaflet.css");
      import("@/lib/maps/leaflet-config").then((config) => {
        if (!containerRef.current || mapRef.current) return;

        const center = config.calculateCenter(locations);
        mapRef.current = L.map(containerRef.current, {
          center: center,
          zoom: zoom,
          dragging: interactive,
          touchZoom: interactive,
          scrollWheelZoom: interactive,
          doubleClickZoom: interactive,
          zoomControl: interactive,
        });

        config.createTileLayer().addTo(mapRef.current);

        // Clear existing markers
        markersRef.current.forEach((marker) => {
          mapRef.current?.removeLayer(marker);
        });
        markersRef.current = [];

        // Add location markers
        locations.forEach((location) => {
          if (!mapRef.current) return;

          const marker = L.marker(
            L.latLng(location.latitude, location.longitude),
            {
              icon: location.isMain
                ? config.MAIN_MARKER_ICON
                : config.LOCATION_MARKER_ICON,
              title: location.name,
            }
          );

          // Create popup content
          const popupContent = `
            <div class="space-y-2">
              <h4 class="font-semibold text-sm">${location.name}</h4>
              <p class="text-xs text-gray-600">${config.formatLocationType(
                location.type
              )}</p>
              <p class="text-xs">
                ${location.addressLine1}<br/>
                ${location.city}, ${location.state || ""} ${location.country}
              </p>
              ${
                location.phone
                  ? `<p class="text-xs text-blue-600">${location.phone}</p>`
                  : ""
              }
              ${
                location.isMain
                  ? '<p class="text-xs font-semibold text-blue-600">Main Location</p>'
                  : ""
              }
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.addTo(mapRef.current);
          markersRef.current.push(marker);
        });

        // Fit bounds to all markers
        if (locations.length > 0) {
          const bounds = config.calculateBounds(locations);
          if (bounds) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      });
    });

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [locations, zoom, interactive, isClient]);

  return (
    <div
      ref={containerRef}
      style={{
        height: `${height}px`,
        width: "100%",
        borderRadius: "1rem",
      }}
      className="bg-linear-to-br from-blue-50 to-slate-100 relative overflow-hidden shadow-lg"
    >
      {!isClient && (
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-gray-500">Loading map...</div>
        </div>
      )}
    </div>
  );
}
