import MapWebViewBridge, { type MapWebViewBridgeRef } from '@/components/map/MapWebViewBridge';
import { EXPLORE_MAP_3D_PITCH } from '@/constants/exploreMap';
import { getMapLibreStyleUrl } from '@/constants/mapLibreStyle';
import type { Localizacao, PontoInteresse, Region } from '@/types';
import {
  clampZoom,
  latitudeDeltaFromZoom,
  zoomFromLatitudeDelta,
} from '@/utils/mapCoordinates';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet } from 'react-native';

export interface MapLibreMapaViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  zoomBy: (deltaLevels: number, duration?: number) => void;
  setRoute: (payload: {
    coordinates: [number, number][];
    origin?: { latitude: number; longitude: number } | null;
    destination?: { latitude: number; longitude: number; title?: string };
  }) => void;
  clearRoute: () => void;
}

export type MapMarkerVariant = 'card' | 'dot';
export type MapViewMode = '2d' | '3d';

interface MapLibreMapaViewProps {
  localizacao: Localizacao;
  pontos: PontoInteresse[];
  viewMode?: MapViewMode;
  markerVariant?: MapMarkerVariant;
  markersLayerKey?: string | number;
  getMarkerColor?: (tipo: PontoInteresse['tipo']) => string;
  onRegionChangeComplete?: (region: Region) => void;
  onUserDragMap?: () => void;
  onUserGestureStart?: () => void;
  onMarkerPress?: (ponto: PontoInteresse) => void;
  boundary?: unknown | null;
}

const MapLibreMapaView = forwardRef<MapLibreMapaViewRef, MapLibreMapaViewProps>(
  function MapLibreMapaView(
    {
      localizacao,
      pontos,
      viewMode = '2d',
      markerVariant = 'card',
      markersLayerKey = 'default',
      getMarkerColor,
      onRegionChangeComplete,
      onUserDragMap,
      onUserGestureStart,
      onMarkerPress,
      boundary = null,
    },
    ref,
  ) {
    const bridgeRef = useRef<MapWebViewBridgeRef>(null);
    const is3dView = viewMode === '3d';
    const defaultMarkerColor = '#7C3AED';
    const defaultPitch = is3dView ? EXPLORE_MAP_3D_PITCH : 0;
    const mapStyleUrl = useMemo(() => getMapLibreStyleUrl({ threeD: is3dView }), [is3dView]);
    const [mapReady, setMapReady] = useState(false);
    const initSentRef = useRef(false);
    const lastZoomLevelRef = useRef(zoomFromLatitudeDelta(localizacao.latitudeDelta));
    const lastCenterRef = useRef<[number, number]>([
      localizacao.longitude,
      localizacao.latitude,
    ]);
    const lastPitchRef = useRef(defaultPitch);
    const initialViewAppliedRef = useRef(false);
    const lastPropLocRef = useRef<{ lat: number; lng: number } | null>(null);
    const pontosRef = useRef(pontos);
    pontosRef.current = pontos;

    useEffect(() => {
      lastPitchRef.current = defaultPitch;
    }, [defaultPitch]);

    const pontosPayload = useMemo(
      () =>
        pontos.map((ponto) => ({
          id: ponto.id,
          titulo: ponto.titulo,
          latitude: ponto.latitude,
          longitude: ponto.longitude,
          markerColor: ponto.markerColor ?? getMarkerColor?.(ponto.tipo) ?? defaultMarkerColor,
          photoUrl: ponto.photoUrl,
          partner: ponto.placeType === 'partner_stores',
        })),
      [defaultMarkerColor, getMarkerColor, pontos],
    );

    const sendCamera = useCallback(
      (center: [number, number], zoom: number, duration: number, pitch?: number) => {
        bridgeRef.current?.sendCommand({
          type: 'setCamera',
          center,
          zoom,
          pitch: pitch ?? (is3dView ? lastPitchRef.current : 0),
          duration,
        });
      },
      [is3dView],
    );

    const applyInitialView = useCallback(() => {
      const z = zoomFromLatitudeDelta(localizacao.latitudeDelta);
      lastZoomLevelRef.current = z;
      lastCenterRef.current = [localizacao.longitude, localizacao.latitude];
      if (is3dView) {
        lastPitchRef.current = defaultPitch;
      }
      sendCamera(lastCenterRef.current, z, 0, is3dView ? defaultPitch : 0);
    }, [defaultPitch, is3dView, localizacao, sendCamera]);

    const sendInit = useCallback(() => {
      if (initSentRef.current) return;
      initSentRef.current = true;
      const zoom = zoomFromLatitudeDelta(localizacao.latitudeDelta);
      bridgeRef.current?.sendCommand({
        type: 'init',
        styleUrl: mapStyleUrl,
        center: [localizacao.longitude, localizacao.latitude],
        zoom,
        is3d: is3dView,
        defaultPitch,
      });
    }, [
      defaultPitch,
      is3dView,
      localizacao.latitude,
      localizacao.longitude,
      localizacao.latitudeDelta,
      mapStyleUrl,
    ]);

    useEffect(() => {
      if (!mapReady) return;
      bridgeRef.current?.sendCommand({
        type: 'setPontos',
        pontos: pontosPayload,
        variant: markerVariant,
        layerKey: markersLayerKey,
      });
    }, [mapReady, markerVariant, markersLayerKey, pontosPayload]);

    useEffect(() => {
      if (!mapReady) return;
      bridgeRef.current?.sendCommand({
        type: 'setBoundary',
        geojson: boundary ?? null,
      });
    }, [boundary, mapReady]);

    useEffect(() => {
      if (!mapReady) return;
      bridgeRef.current?.sendCommand({
        type: 'set3d',
        enabled: is3dView,
        defaultPitch,
      });
    }, [defaultPitch, is3dView, mapReady]);

    const handleBridgeReady = useCallback(() => {
      sendInit();
    }, [sendInit]);

    const handleMapReady = useCallback(() => {
      setMapReady(true);
      if (initialViewAppliedRef.current) {
        applyInitialView();
        return;
      }
      initialViewAppliedRef.current = true;
      applyInitialView();
      lastPropLocRef.current = {
        lat: localizacao.latitude,
        lng: localizacao.longitude,
      };
    }, [applyInitialView, localizacao.latitude, localizacao.longitude]);

    useEffect(() => {
      if (!mapReady || !initialViewAppliedRef.current) return;
      const lat = localizacao.latitude;
      const lng = localizacao.longitude;
      const prev = lastPropLocRef.current;
      if (!prev) {
        lastPropLocRef.current = { lat, lng };
        return;
      }
      const eps = 1e-4;
      if (Math.abs(prev.lat - lat) < eps && Math.abs(prev.lng - lng) < eps) return;
      lastPropLocRef.current = { lat, lng };
      const z = zoomFromLatitudeDelta(localizacao.latitudeDelta);
      lastZoomLevelRef.current = z;
      lastCenterRef.current = [lng, lat];
      sendCamera(lastCenterRef.current, z, 450);
    }, [localizacao, mapReady, sendCamera]);

    useImperativeHandle(
      ref,
      () => ({
        animateToRegion: (region: Region, duration = 300) => {
          const z = zoomFromLatitudeDelta(region.latitudeDelta);
          lastZoomLevelRef.current = z;
          lastCenterRef.current = [region.longitude, region.latitude];
          sendCamera(lastCenterRef.current, z, duration);
        },
        zoomBy: (deltaLevels: number, duration = 220) => {
          const next = clampZoom(lastZoomLevelRef.current + deltaLevels);
          lastZoomLevelRef.current = next;
          sendCamera(lastCenterRef.current, next, duration);
        },
        setRoute: (payload) => {
          bridgeRef.current?.sendCommand({
            type: 'setRoute',
            coordinates: payload.coordinates,
            origin: payload.origin ?? null,
            destination: payload.destination,
          });
        },
        clearRoute: () => {
          bridgeRef.current?.sendCommand({
            type: 'setRoute',
            coordinates: [],
            origin: null,
          });
        },
      }),
      [sendCamera],
    );

    const handleRegionChange = useCallback(
      (region: Region, isUserInteraction: boolean) => {
        if (isUserInteraction) {
          onUserDragMap?.();
        }
        const z = zoomFromLatitudeDelta(region.latitudeDelta);
        lastZoomLevelRef.current = z;
        lastCenterRef.current = [region.longitude, region.latitude];
        onRegionChangeComplete?.({
          ...region,
          latitudeDelta: latitudeDeltaFromZoom(z),
        });
      },
      [onRegionChangeComplete, onUserDragMap],
    );

    const handleMarkerPress = useCallback(
      (id: string) => {
        const ponto = pontosRef.current.find((item) => item.id === id);
        if (ponto) onMarkerPress?.(ponto);
      },
      [onMarkerPress],
    );

    return (
      <MapWebViewBridge
        ref={bridgeRef}
        style={styles.map}
        onBridgeReady={handleBridgeReady}
        onReady={handleMapReady}
        onRegionChangeComplete={handleRegionChange}
        onUserDragMap={onUserDragMap}
        onUserGestureStart={onUserGestureStart}
        onMarkerPress={handleMarkerPress}
      />
    );
  },
);

const styles = StyleSheet.create({
  map: { flex: 1 },
});

export default MapLibreMapaView;
