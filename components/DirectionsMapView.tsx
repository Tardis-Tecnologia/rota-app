import { getMapLibreStyleUrl } from '@/constants/mapLibreStyle';
import { AppColors } from '@/constants/theme';
import type { RouteCoordinate } from '@/types/directions';
import type { Localizacao } from '@/types';
import {
  Camera,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  UserLocation,
  type CameraRef,
  type MapViewRef,
} from '@maplibre/maplibre-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

function zoomFromLatitudeDelta(latitudeDelta: number): number {
  const span = Math.max(latitudeDelta, 1e-6);
  const z = Math.log2(360 / span) - 1;
  return Math.min(20, Math.max(2, z));
}

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
  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const mapStyleUrl = useMemo(() => getMapLibreStyleUrl(), []);
  const [mapStyleJson, setMapStyleJson] = useState<string | null>(null);
  const initialViewAppliedRef = useRef(false);

  const routeGeoJson = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: routeCoordinates,
      },
    }),
    [routeCoordinates],
  );

  const applyCameraToRegion = useCallback((loc: Localizacao, duration: number) => {
    const z = zoomFromLatitudeDelta(loc.latitudeDelta);
    cameraRef.current?.setCamera({
      centerCoordinate: [loc.longitude, loc.latitude],
      zoomLevel: z,
      animationDuration: duration,
      animationMode: 'easeTo',
    });
  }, []);

  useEffect(() => {
    const isMapTiler = mapStyleUrl.startsWith('https://api.maptiler.com/');
    if (!isMapTiler) {
      setMapStyleJson(null);
      return;
    }

    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch(mapStyleUrl, {
          signal: ac.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const style = (await res.json()) as Record<string, unknown>;
        setMapStyleJson(JSON.stringify(style));
      } catch {
        // ignore
      }
    })();

    return () => ac.abort();
  }, [mapStyleUrl]);

  const handleDidFinishLoadingMap = useCallback(() => {
    if (initialViewAppliedRef.current) return;
    initialViewAppliedRef.current = true;
    applyCameraToRegion(localizacao, 0);
    requestAnimationFrame(() => applyCameraToRegion(localizacao, 400));
  }, [applyCameraToRegion, localizacao]);

  useEffect(() => {
    if (!initialViewAppliedRef.current) return;
    applyCameraToRegion(localizacao, 450);
  }, [localizacao, applyCameraToRegion]);

  const mapViewStyle = useMemo((): ViewStyle | ViewStyle[] => {
    if (Platform.OS === 'web') {
      return [styles.map, { cursor: 'grab' } as unknown as ViewStyle];
    }
    return styles.map;
  }, []);

  const isMapTiler = mapStyleUrl.startsWith('https://api.maptiler.com/');
  if (isMapTiler && mapStyleJson == null) {
    return <View style={mapViewStyle} />;
  }

  return (
    <MapView
      ref={mapRef}
      style={mapViewStyle}
      mapStyle={mapStyleJson ?? mapStyleUrl}
      scrollEnabled
      pitchEnabled={false}
      rotateEnabled
      logoEnabled={false}
      attributionEnabled
      onDidFinishLoadingMap={handleDidFinishLoadingMap}
    >
      <Camera ref={cameraRef} followUserLocation={false} />
      <UserLocation visible androidRenderMode="gps" showsUserHeadingIndicator />

      {routeCoordinates.length >= 2 ? (
        <ShapeSource id="route-source" shape={routeGeoJson}>
          <LineLayer
            id="route-line"
            style={{
              lineColor: '#7C3AED',
              lineWidth: 5,
              lineOpacity: 0.92,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>
      ) : null}

      {origin ? (
        <PointAnnotation
          id="route-origin"
          coordinate={[origin.longitude, origin.latitude]}
          title="Origem"
        >
          <View style={[styles.markerDot, styles.markerOrigin]} />
        </PointAnnotation>
      ) : null}

      <PointAnnotation
        id="route-destination"
        coordinate={[destination.longitude, destination.latitude]}
        title={destination.title ?? 'Destino'}
      >
        <View style={[styles.markerDot, styles.markerDestination]} />
      </PointAnnotation>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: AppColors.text.white,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  markerOrigin: {
    backgroundColor: '#2563eb',
  },
  markerDestination: {
    backgroundColor: '#dc2626',
  },
});
