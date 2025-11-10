import mapStyle from '@/styles/mapStyle.json';
import { Localizacao, PontoInteresse } from '@/types';
import React from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface MapaViewProps {
  localizacao: Localizacao;
  tipoMapa: 'standard' | 'satellite' | 'hybrid';
  pontos: PontoInteresse[];
  getMarkerColor: (tipo: PontoInteresse['tipo']) => string;
}

export default function MapaView({ localizacao, tipoMapa, pontos, getMarkerColor }: MapaViewProps) {
  return (
    <MapView
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      initialRegion={localizacao}
      mapType={tipoMapa}
      customMapStyle={mapStyle}
      showsUserLocation={true}
      showsMyLocationButton={false}
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
        />
      ))}
    </MapView>
  );
}

