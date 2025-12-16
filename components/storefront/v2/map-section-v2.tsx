"use client";

import { useEffect, useRef } from "react";
import L, { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  createTileLayer,
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
  LOCATION_MARKER_ICON,
  MAIN_MARKER_ICON,
  calculateBounds,
  calculateCenter,
  formatLocationType,
  getMapHeight,
} from "@/lib/maps/leaflet-config";

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
  height = getMapHeight("desktop"),
  zoom = DEFAULT_ZOOM,
  interactive = true,
  pinColor = "red",
}: MapSectionV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize map
    if (!mapRef.current) {
      const center = calculateCenter(locations);
      mapRef.current = L.map(containerRef.current, {
        center: center,
        zoom: zoom,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        zoomControl: interactive,
      });

      createTileLayer().addTo(mapRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add location markers
    locations.forEach((location) => {
      if (!mapRef.current) return;

      const marker = L.marker(L.latLng(location.latitude, location.longitude), {
        icon: location.isMain ? MAIN_MARKER_ICON : LOCATION_MARKER_ICON,
        title: location.name,
      });

      // Create popup content
      const popupContent = `
        <div class="space-y-2">
          <h4 class="font-semibold text-sm">${location.name}</h4>
          <p class="text-xs text-gray-600">${formatLocationType(
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
      const bounds = calculateBounds(locations);
      if (bounds) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.off();
      }
    };
  }, [locations, zoom, interactive]);

  return (
    <div
      ref={containerRef}
      style={{
        height: `${height}px`,
        width: "100%",
        borderRadius: "0.5rem",
      }}
      className="bg-gray-100"
    />
  );
}
