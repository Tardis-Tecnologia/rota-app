import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { PontoInteresse, Localizacao } from '@/types';

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
      initialRegion={localizacao}
      mapType={tipoMapa}
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

