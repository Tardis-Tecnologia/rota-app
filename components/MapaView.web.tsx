import React from 'react';
import { View } from 'react-native';

interface MapaViewProps {
  localizacao: any;
  tipoMapa: 'standard' | 'satellite' | 'hybrid';
  pontos: any[];
  getMarkerColor: (tipo: any) => string;
}

export default function MapaView(_props: MapaViewProps) {
  // Na web, não renderizar nada (a lista já é mostrada no componente principal)
  return <View style={{ flex: 1 }} />;
}

