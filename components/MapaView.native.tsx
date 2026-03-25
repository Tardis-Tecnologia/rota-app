import mapStyle from '@/styles/mapStyle.json';
import { Localizacao, PontoInteresse } from '@/types';
import React from 'react';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

interface MapaViewProps {
  localizacao: Localizacao;
  tipoMapa: 'standard' | 'satellite' | 'hybrid';
  pontos: PontoInteresse[];
  getMarkerColor: (tipo: PontoInteresse['tipo']) => string;
  mapRef?: React.RefObject<MapView | null>;
  onRegionChangeComplete?: (region: Region) => void;
  onMarkerPress?: (ponto: PontoInteresse) => void;
}

export default function MapaView({
  localizacao,
  tipoMapa,
  pontos,
  getMarkerColor,
  mapRef,
  onRegionChangeComplete,
  onMarkerPress,
}: MapaViewProps) {
  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialRegion={localizacao}
      mapType={tipoMapa}
      customMapStyle={mapStyle}
      showsUserLocation={true}
      showsMyLocationButton={false}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {pontos.map((ponto) => (
        <Marker
          key={ponto.id}
          coordinate={{
            latitude: ponto.latitude,
            longitude: ponto.longitude,
          }}
          title={ponto.titulo}
          description={ponto.descricao}
          pinColor={getMarkerColor(ponto.tipo)}
          onPress={() => onMarkerPress?.(ponto)}
        />
      ))}
    </MapView>
  );
}

