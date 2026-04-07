import MapLibreMapaView, { type MapLibreMapaViewRef } from '@/components/MapLibreMapaView';
import type { Localizacao, PontoInteresse, Region } from '@/types';
import React from 'react';

interface MapaViewProps {
  localizacao: Localizacao;
  tipoMapa: 'standard' | 'satellite' | 'hybrid';
  pontos: PontoInteresse[];
  getMarkerColor: (tipo: PontoInteresse['tipo']) => string;
  mapRef?: React.RefObject<MapLibreMapaViewRef | null>;
  onRegionChangeComplete?: (region: Region) => void;
  onMarkerPress?: (ponto: PontoInteresse) => void;
}

export default function MapaView({
  localizacao,
  pontos,
  getMarkerColor,
  mapRef,
  onRegionChangeComplete,
  onMarkerPress,
}: MapaViewProps) {
  return (
    <MapLibreMapaView
      ref={mapRef}
      localizacao={localizacao}
      pontos={pontos}
      getMarkerColor={getMarkerColor}
      onRegionChangeComplete={onRegionChangeComplete}
      onMarkerPress={onMarkerPress}
    />
  );
}

