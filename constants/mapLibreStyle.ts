const DEMO_STYLE = 'https://demotiles.maplibre.org/style.json';

const DEFAULT_MAP_STYLE = 'basic-v2';
/** Ruas completas + vetor maptiler_planet (prédios 3D via FillExtrusionLayer). */
const DEFAULT_3D_MAP_STYLE = 'streets-v2';

type MapLibreStyleOptions = {
  /** Usa estilo com camadas 3D (prédios extrudados). */
  threeD?: boolean;
};

export function getMapLibreStyleUrl(options?: MapLibreStyleOptions): string {
  const key = process.env.EXPO_PUBLIC_MAPTILER_KEY?.trim();
  if (!key) return DEMO_STYLE;
  const mapId = options?.threeD
    ? process.env.EXPO_PUBLIC_MAPTILER_STYLE_3D?.trim() || DEFAULT_3D_MAP_STYLE
    : process.env.EXPO_PUBLIC_MAPTILER_STYLE?.trim() || DEFAULT_MAP_STYLE;
  return `https://api.maptiler.com/maps/${encodeURIComponent(mapId)}/style.json?key=${encodeURIComponent(key)}`;
}