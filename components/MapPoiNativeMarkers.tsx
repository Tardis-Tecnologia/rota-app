import MapPoiOverlayCard from '@/components/MapPoiOverlayCard';
import type { PontoInteresse } from '@/types';
import { poiCategoryLabel } from '@/utils/mapViewport';
import { MarkerView } from '@maplibre/maplibre-react-native';
import React, { memo } from 'react';
import { Platform, View } from 'react-native';

type MapPoiNativeMarkersProps = {
  pontos: PontoInteresse[];
  onMarkerPress?: (ponto: PontoInteresse) => void;
};

const markerChildCollapsable = Platform.OS === 'android' ? false : undefined;

const MapPoiNativeMarker = memo(function MapPoiNativeMarker({
  ponto,
  onMarkerPress,
}: {
  ponto: PontoInteresse;
  onMarkerPress?: (ponto: PontoInteresse) => void;
}) {
  const categoryLabel = poiCategoryLabel(ponto);

  return (
    <MarkerView
      coordinate={[ponto.longitude, ponto.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      allowOverlap
    >
      <View collapsable={markerChildCollapsable}>
        <MapPoiOverlayCard
          ponto={ponto}
          categoryLabel={categoryLabel}
          onPress={(item) => onMarkerPress?.(item)}
        />
      </View>
    </MarkerView>
  );
}, (prev, next) => prev.ponto.id === next.ponto.id && prev.ponto.photoUrl === next.ponto.photoUrl && prev.ponto.titulo === next.ponto.titulo);

function MapPoiNativeMarkers({ pontos, onMarkerPress }: MapPoiNativeMarkersProps) {
  return (
    <>
      {pontos.map((ponto) => (
        <MapPoiNativeMarker key={ponto.id} ponto={ponto} onMarkerPress={onMarkerPress} />
      ))}
    </>
  );
}

export default memo(MapPoiNativeMarkers);
