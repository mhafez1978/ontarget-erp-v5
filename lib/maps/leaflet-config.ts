import L from "leaflet";

// Default map center (USA geographic center)
export const DEFAULT_MAP_CENTER: [number, number] = [39.8283, -98.5795];

// Default zoom levels
export const DEFAULT_ZOOM = 4;
export const DETAIL_ZOOM = 15;

// OpenStreetMap tile layer URL
export const TILE_LAYER_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_LAYER_ATTRIBUTION = "© OpenStreetMap contributors";

// Create default tile layer
export function createTileLayer() {
  return L.tileLayer(TILE_LAYER_URL, {
    attribution: TILE_LAYER_ATTRIBUTION,
    maxZoom: 19,
    minZoom: 2,
  });
}

// Default marker icon (Leaflet default pin)
export const DEFAULT_MARKER_ICON = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red marker icon for locations
export const LOCATION_MARKER_ICON = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj48cGF0aCBmaWxsPSIjZWYwMTAwIiBkPSJNMTIuNSAwQzUuNTk2IDAgMCA1LjU5NiAwIDEyLjVjMCAyLjcwNi43MzIgNS4yNCAxLjI1IDcuMDMxbDExLjI1IDIxLjQ2OWwxMS4yNS0yMS40NjljLjUxOC0xLjc5IDEuMjUtNC4zMjUgMS4yNS03LjAzMUM1IDUuNTk2IDE5LjQwNCAwIDEyLjUgMHptMCAxNi4wNjJjLTEuOTgyIDAtMy41OTMtMS42MjUtMy41OTMtMy42MzcgMC0yLjAyIDEuNjExLTMuNjQ2IDMuNTkzLTMuNjQ2YzEuOTgyIDAgMy41OTMgMS42MjUgMy41OTMgMy42NDYgMCAyLjAxMi0xLjYxMSAzLjYzNy0zLjU5MyAzLjYzN3oiLz48L3N2Zz4=",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Main location marker (gold/star)
export const MAIN_MARKER_ICON = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj48cGF0aCBmaWxsPSIjZjU5ZTBiIiBkPSJNMTIuNSAwQzUuNTk2IDAgMCA1LjU5NiAwIDEyLjVjMCAyLjcwNi43MzIgNS4yNCAxLjI1IDcuMDMxbDExLjI1IDIxLjQ2OWwxMS4yNS0yMS40NjljLjUxOC0xLjc5IDEuMjUtNC4zMjUgMS4yNS03LjAzMUM1IDUuNTk2IDE5LjQwNCAwIDEyLjUgMHptMCAxNi4wNjJjLTEuOTgyIDAtMy41OTMtMS42MjUtMy41OTMtMy42MzcgMC0yLjAyIDEuNjExLTMuNjQ2IDMuNTkzLTMuNjQ2YzEuOTgyIDAgMy41OTMgMS42MjUgMy41OTMgMy42NDYgMCAyLjAxMi0xLjYxMSAzLjYzNy0zLjU5MyAzLjYzN3oiLz48L3N2Zz4=",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Calculate responsive map height
export function getMapHeight(
  viewport: "mobile" | "tablet" | "desktop" = "desktop"
): number {
  switch (viewport) {
    case "mobile":
      return 250;
    case "tablet":
      return 300;
    case "desktop":
      return 400;
    default:
      return 400;
  }
}

// Calculate bounds to fit all markers
export function calculateBounds(
  locations: Array<{ latitude: number; longitude: number }>
): L.LatLngBounds | null {
  if (locations.length === 0) return null;

  const bounds = L.latLngBounds(
    locations.map((loc) => L.latLng(loc.latitude, loc.longitude))
  );

  return bounds;
}

// Calculate center point from locations
export function calculateCenter(
  locations: Array<{ latitude: number; longitude: number }>
): [number, number] {
  if (locations.length === 0) return DEFAULT_MAP_CENTER;

  const avgLat =
    locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
  const avgLng =
    locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;

  return [avgLat, avgLng];
}

// Format location type for display
export function formatLocationType(type: string): string {
  const labels: Record<string, string> = {
    HEADQUARTERS: "Headquarters",
    BRANCH: "Branch",
    OFFICE: "Office",
    WAREHOUSE: "Warehouse",
  };
  return labels[type] || type;
}
