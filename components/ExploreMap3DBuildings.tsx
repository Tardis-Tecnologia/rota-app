import MapLibreGL from '@maplibre/maplibre-react-native';
import React from 'react';

const BUILDING_SOURCE_ID = 'maptiler_planet';
const BUILDING_SOURCE_LAYER = 'building';

type ExploreMap3DBuildingsProps = {
  /** Insere prédios abaixo dos rótulos (ex.: "Road labels"). */
  belowLayerID?: string;
};

/**
 * Prédios 3D suaves: cor única clara, luz difusa e fade por zoom (sem sumiço brusco).
 */
export default function ExploreMap3DBuildings({ belowLayerID }: ExploreMap3DBuildingsProps) {
  return (
    <>
      <MapLibreGL.Light
        style={{
          anchor: 'viewport',
          color: '#ffffff',
          intensity: 0.28,
          position: [1.5, 90, 80],
        }}
      />
      <MapLibreGL.FillExtrusionLayer
        id="rota-explore-3d-buildings"
        sourceID={BUILDING_SOURCE_ID}
        sourceLayerID={BUILDING_SOURCE_LAYER}
        minZoomLevel={10}
        filter={['!', ['has', 'hide_3d']]}
        {...(belowLayerID ? { belowLayerID } : {})}
        style={{
          fillExtrusionColor: '#e8ecf1',
          fillExtrusionHeight: [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            0,
            11.5,
            ['*', 0.35, ['get', 'render_height']],
            12.5,
            ['*', 0.6, ['get', 'render_height']],
            13.5,
            ['*', 0.82, ['get', 'render_height']],
            14.5,
            ['get', 'render_height'],
          ],
          fillExtrusionBase: ['get', 'render_min_height'],
          fillExtrusionOpacity: [
            'interpolate',
            ['linear'],
            ['zoom'],
            10,
            0,
            11,
            0.28,
            12,
            0.45,
            13,
            0.58,
            14,
            0.68,
            15,
            0.74,
          ],
        }}
      />
    </>
  );
}
