import MapaView from '@/components/MapaView';
import TransportSearchCard from '@/components/TransportSearchCard';
import { useWhitelabelMapCenter } from '@/hooks/useWhitelabelCity';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function PublicTransportation() {
  const cityMapCenter = useWhitelabelMapCenter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <View style={styles.container}>
      <MapaView
        localizacao={{ ...cityMapCenter, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        tipoMapa="standard"
        pontos={[]}
        getMarkerColor={() => '#000'}
      />
      <View pointerEvents="box-none" style={styles.overlay}>
        <TransportSearchCard
          origin={origin}
          destination={destination}
          onChangeOrigin={setOrigin}
          onChangeDestination={setDestination}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
});