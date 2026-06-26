type MapStyleLayer = {
  id?: string;
  type?: string;
  source?: string;
  'source-layer'?: string;
  minzoom?: number;
  maxzoom?: number;
  filter?: unknown;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
};

type MapStyleJson = {
  name?: string;
  layers?: MapStyleLayer[];
  sources?: Record<string, unknown>;
};

export type Explore3DStyleMeta = {
  labelLayerId?: string;
};

/** Paleta neutra/fria — sem tons amarelados. */
const EXPLORE_BG = '#f1f5f9';
const EXPLORE_WATER = '#d4e3f0';
const EXPLORE_LAND = '#eef2f6';
const EXPLORE_ROAD = '#ffffff';
const EXPLORE_LABEL = '#334155';
const EXPLORE_LABEL_HALO = 'rgba(255,255,255,0.92)';

const WARM_LAYER_IDS = new Set([
  'Meadow',
  'Scrub',
  'Crop',
  'Forest',
  'Wood',
  'Grass',
  'Sand',
]);

function isWarmHue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const match = value.match(/hsl\(\s*(\d+)/i);
  if (!match) return false;
  const hue = Number(match[1]);
  return hue >= 35 && hue <= 95;
}

function findLabelLayerId(layers: MapStyleLayer[]): string | undefined {
  const roadLabel = layers.find(
    (layer) =>
      layer.type === 'symbol' &&
      typeof layer.id === 'string' &&
      /road/i.test(layer.id),
  );
  if (roadLabel?.id) return roadLabel.id;

  const placeLabel = layers.find(
    (layer) =>
      layer.type === 'symbol' &&
      typeof layer.id === 'string' &&
      /place|city|town/i.test(layer.id),
  );
  if (placeLabel?.id) return placeLabel.id;

  return layers.find((layer) => layer.type === 'symbol')?.id;
}

function applyModernExplorePalette(layers: MapStyleLayer[]): MapStyleLayer[] {
  return layers.map((layer) => {
    const id = layer.id ?? '';
    const next: MapStyleLayer = {
      ...layer,
      paint: layer.paint ? { ...layer.paint } : undefined,
      layout: layer.layout ? { ...layer.layout } : undefined,
    };

    if (layer.type === 'background') {
      next.paint = { ...next.paint, 'background-color': EXPLORE_BG };
      return next;
    }

    if (layer.type === 'fill' && (id === 'Water' || id === 'Water shadow')) {
      next.paint = { ...next.paint, 'fill-color': EXPLORE_WATER };
      return next;
    }

    if (layer.type === 'line' && id === 'River') {
      next.paint = { ...next.paint, 'line-color': EXPLORE_WATER };
      return next;
    }

    if (layer.type === 'fill' && (id === 'Residential' || id === 'Landcover' || id === 'Land')) {
      next.paint = { ...next.paint, 'fill-color': EXPLORE_LAND, 'fill-opacity': 0.85 };
      return next;
    }

    if (WARM_LAYER_IDS.has(id) && layer.type === 'fill') {
      next.layout = { ...next.layout, visibility: 'none' };
      return next;
    }

    if (layer.type === 'fill' && next.paint?.['fill-color'] && isWarmHue(next.paint['fill-color'])) {
      next.paint['fill-color'] = EXPLORE_LAND;
      next.paint['fill-opacity'] = 0.55;
    }

    if (layer.type === 'line' && (id.includes('Road') || id.includes('road') || id === 'Road network')) {
      next.paint = { ...next.paint, 'line-color': EXPLORE_ROAD };
    }

    // Footprints 2D — a extrusão nativa (FillExtrusionLayer) assume o 3D.
    if (layer.type === 'fill' && (id === 'Building' || id === 'Building top')) {
      next.layout = { ...next.layout, visibility: 'none' };
      return next;
    }

    // Oculta camadas 3D do JSON (evita conflito com ExploreMap3DBuildings).
    if (layer.type === 'fill-extrusion' && layer['source-layer'] === 'building') {
      next.layout = { ...next.layout, visibility: 'none' };
      return next;
    }

    if (layer.type === 'symbol' && next.paint) {
      if ('text-color' in next.paint) {
        next.paint['text-color'] = EXPLORE_LABEL;
      }
      if ('text-halo-color' in next.paint) {
        next.paint['text-halo-color'] = EXPLORE_LABEL_HALO;
      }
    }

    return next;
  });
}

/** Paleta moderna + metadados para camada 3D nativa. */
export function enhanceExplore3DMapStyle(style: MapStyleJson): {
  style: MapStyleJson;
  meta: Explore3DStyleMeta;
} {
  const layers = applyModernExplorePalette(
    Array.isArray(style.layers) ? style.layers.map((layer) => ({ ...layer })) : [],
  );

  return {
    style: {
      ...style,
      name: style.name ? `${style.name} · ROTA Explore` : 'ROTA Explore',
      layers,
    },
    meta: {
      labelLayerId: findLabelLayerId(layers),
    },
  };
}
