import MapPoiOverlayCard, { MAP_POI_CARD_HEIGHT, MAP_POI_CARD_WIDTH } from '@/components/MapPoiOverlayCard';
import type { PontoInteresse } from '@/types';
import { poiCategoryLabel, projectLatLngToScreen, type MapVisibleBounds } from '@/utils/mapViewport';
import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

type PositionedPonto = {
  ponto: PontoInteresse;
  x: number;
  y: number;
};

type MapPoiCardOverlayProps = {
  pontos: PontoInteresse[];
  bounds: MapVisibleBounds;
  width: number;
  height: number;
  onMarkerPress?: (ponto: PontoInteresse) => void;
};

function MapPoiCardOverlay({
  pontos,
  bounds,
  width,
  height,
  onMarkerPress,
}: MapPoiCardOverlayProps) {
  const positioned = useMemo(() => {
    const items: PositionedPonto[] = [];
    for (const ponto of pontos) {
      const screen = projectLatLngToScreen(ponto.latitude, ponto.longitude, bounds, width, height);
      if (!screen) continue;
      items.push({ ponto, x: screen.x, y: screen.y });
    }
    return items;
  }, [pontos, bounds, width, height]);

  if (positioned.length === 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {positioned.map(({ ponto, x, y }) => (
        <View
          key={ponto.id}
          pointerEvents="box-none"
          style={[
            styles.markerWrap,
            {
              left: x - MAP_POI_CARD_WIDTH / 2,
              top: y - MAP_POI_CARD_HEIGHT,
            },
          ]}
        >
          <MapPoiOverlayCard
            ponto={ponto}
            categoryLabel={poiCategoryLabel(ponto)}
            onPress={(item) => onMarkerPress?.(item)}
          />
        </View>
      ))}
    </View>
  );
}

export default memo(MapPoiCardOverlay);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  markerWrap: {
    position: 'absolute',
    width: MAP_POI_CARD_WIDTH,
    height: MAP_POI_CARD_HEIGHT,
  },
});
