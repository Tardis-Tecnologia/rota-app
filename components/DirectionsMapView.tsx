import MapWebViewBridge, { type MapWebViewBridgeRef } from '@/components/map/MapWebViewBridge';
import { getMapLibreStyleUrl } from '@/constants/mapLibreStyle';
import type { Localizacao } from '@/types';
import type { RouteCoordinate } from '@/types/directions';
import { zoomFromLatitudeDelta } from '@/utils/mapCoordinates';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

interface DirectionsMapViewProps {
  localizacao: Localizacao;
  routeCoordinates: RouteCoordinate[];
  destination: { latitude: number; longitude: number; title?: string };
  origin?: { latitude: number; longitude: number } | null;
}

export default function DirectionsMapView({
  localizacao,
  routeCoordinates,
  destination,
  origin,
}: DirectionsMapViewProps) {
  const bridgeRef = useRef<MapWebViewBridgeRef>(null);
  const mapStyleUrl = getMapLibreStyleUrl();
  const [mapReady, setMapReady] = useState(false);
  const initSentRef = useRef(false);
  const initialViewAppliedRef = useRef(false);

  const applyCameraToRegion = useCallback((loc: Localizacao, duration: number) => {
    const z = zoomFromLatitudeDelta(loc.latitudeDelta);
    bridgeRef.current?.sendCommand({
      type: 'setCamera',
      center: [loc.longitude, loc.latitude],
      zoom: z,
      pitch: 0,
      duration,
    });
  }, []);

  const sendInit = useCallback(() => {
    if (initSentRef.current) return;
    initSentRef.current = true;
    const z = zoomFromLatitudeDelta(localizacao.latitudeDelta);
    bridgeRef.current?.sendCommand({
      type: 'init',
      styleUrl: mapStyleUrl,
      center: [localizacao.longitude, localizacao.latitude],
      zoom: z,
      is3d: false,
    });
  }, [localizacao.latitude, localizacao.longitude, localizacao.latitudeDelta, mapStyleUrl]);

  const syncRoute = useCallback(() => {
    if (!mapReady) return;
    bridgeRef.current?.sendCommand({
      type: 'setRoute',
      coordinates: routeCoordinates,
      origin: origin ?? null,
      destination,
    });
  }, [destination, mapReady, origin, routeCoordinates]);

  useEffect(() => {
    syncRoute();
  }, [syncRoute]);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
    if (initialViewAppliedRef.current) return;
    initialViewAppliedRef.current = true;
    applyCameraToRegion(localizacao, 0);
    setTimeout(() => applyCameraToRegion(localizacao, 400), 50);
    syncRoute();
  }, [applyCameraToRegion, localizacao, syncRoute]);

  useEffect(() => {
    if (!mapReady || !initialViewAppliedRef.current) return;
    applyCameraToRegion(localizacao, 450);
  }, [applyCameraToRegion, localizacao, mapReady]);

  return (
    <MapWebViewBridge
      ref={bridgeRef}
      style={styles.map}
      onBridgeReady={sendInit}
      onReady={handleMapReady}
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
