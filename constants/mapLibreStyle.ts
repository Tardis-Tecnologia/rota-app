const DEMO_STYLE = 'https://demotiles.maplibre.org/style.json';

const DEFAULT_MAP_STYLE = 'basic-v2';

export function getMapLibreStyleUrl(): string {
  const key = process.env.EXPO_PUBLIC_MAPTILER_KEY?.trim();
  if (!key) return DEMO_STYLE;
  const mapId = process.env.EXPO_PUBLIC_MAPTILER_STYLE?.trim() || DEFAULT_MAP_STYLE;
  return `https://api.maptiler.com/maps/${encodeURIComponent(mapId)}/style.json?key=${encodeURIComponent(key)}`;
}