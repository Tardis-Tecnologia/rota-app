const DEMO_STYLE = 'https://demotiles.maplibre.org/style.json';

const DEFAULT_MAP_STYLE = 'dataviz';

export const MAP_DEFAULT_ZOOM = 16;
export const MAP_CAMERA_PITCH = 0;
export const MAP_CAMERA_HEADING = 0;

export const EXPLORE_LATITUDE_DELTA = 360 / Math.pow(2, MAP_DEFAULT_ZOOM + 1);

export function getMapLibreStyleUrl(): string {
  const key = process.env.EXPO_PUBLIC_MAPTILER_KEY?.trim();
  if (!key) return DEMO_STYLE;
  const mapId = process.env.EXPO_PUBLIC_MAPTILER_STYLE?.trim() || DEFAULT_MAP_STYLE;
  return `https://api.maptiler.com/maps/${encodeURIComponent(mapId)}/style.json?key=${encodeURIComponent(key)}`;
}