import MapPoiNativeMarkers from '@/components/MapPoiNativeMarkers';
import {
  getMapLibreStyleUrl,
  MAP_CAMERA_HEADING,
  MAP_CAMERA_PITCH,
  MAP_DEFAULT_ZOOM,
} from '@/constants/mapLibreStyle';
import {
  EXPLORE_MAP_CARD_MIN_ZOOM,
  EXPLORE_MAP_MAX_VISIBLE_CARDS,
  EXPLORE_MAP_VIEWPORT_DEBOUNCE_MS,
} from '@/constants/exploreMap';
import type { Localizacao, PontoInteresse, Region } from '@/types';
import {
  boundsFromRegionPayload,
  filterPontosInBounds,
  shouldUseCardOverlay,
  type MapViewport,
} from '@/utils/mapViewport';
import MapLibreGL, {
  Camera,
  CircleLayer,
  MapView,
  ShapeSource,
  UserLocation,
  type CameraRef,
  type MapViewRef,
  type RegionPayload,
} from '@maplibre/maplibre-react-native';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

function zoomFromLatitudeDelta(latitudeDelta: number): number {
  const span = Math.max(latitudeDelta, 1e-6);
  const z = Math.log2(360 / span) - 1;
  return Math.min(20, Math.max(2, z));
}

function clampZoom(z: number): number {
  return Math.min(20, Math.max(2, z));
}

function latitudeDeltaFromZoom(zoomLevel: number): number {
  return 360 / Math.pow(2, zoomLevel + 1);
}

type Anchor = { lat: number; lng: number; d: number };

export interface MapLibreMapaViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  zoomBy: (deltaLevels: number, duration?: number) => void;
}

/** `dot` = círculos; `hybrid`/`card` = cards no viewport + dots como fallback */
export type MapMarkerVariant = 'card' | 'dot' | 'hybrid';

interface MapLibreMapaViewProps {
  localizacao: Localizacao;
  pontos: PontoInteresse[];
  markerVariant?: MapMarkerVariant;
  getMarkerColor?: (tipo: PontoInteresse['tipo']) => string;
  onRegionChangeComplete?: (region: Region) => void;
  onUserDragMap?: () => void;
  onMarkerPress?: (ponto: PontoInteresse) => void;
}

function regionFromPayload(p: RegionPayload): Region | null {
  if (p.zoomLevel == null || !p.visibleBounds) return null;
  const z = p.zoomLevel;
  const [ne, sw] = p.visibleBounds;
  const [neLng, neLat] = ne;
  const [swLng, swLat] = sw;
  const lat = (neLat + swLat) / 2;
  const lng = (neLng + swLng) / 2;
  const latDelta = latitudeDeltaFromZoom(z);
  const lngSpan = Math.abs(neLng - swLng);
  const latSpan = Math.abs(neLat - swLat);
  const lngDelta = latSpan > 1e-9 ? latDelta * (lngSpan / latSpan) : latDelta;
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

const MapLibreMapaView = forwardRef<MapLibreMapaViewRef, MapLibreMapaViewProps>(
  function MapLibreMapaView(
    {
      localizacao,
      pontos,
      markerVariant = 'card',
      getMarkerColor,
      onRegionChangeComplete,
      onUserDragMap,
      onMarkerPress,
    },
    ref,
  ) {
    const isDotOnly = markerVariant === 'dot';
    const usesOverlay = markerVariant === 'card' || markerVariant === 'hybrid';
    const defaultMarkerColor = '#7C3AED';

    const mapRef = useRef<MapViewRef>(null);
    const cameraRef = useRef<CameraRef>(null);
    const mapStyleUrl = useMemo(() => getMapLibreStyleUrl(), []);

    const initialViewAppliedRef = useRef(false);
    const lastAnchorRef = useRef<Anchor | null>(null);
    const lastZoomLevelRef = useRef<number>(zoomFromLatitudeDelta(0.05));
    const lastCenterRef = useRef<[number, number]>([
      localizacao.longitude,
      localizacao.latitude,
    ]);
    const lastPropLocRef = useRef<{ lat: number; lng: number } | null>(null);
    const regionNotifyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pontosRef = useRef(pontos);
    pontosRef.current = pontos;

    const [viewport, setViewport] = useState<MapViewport | null>(null);

    const overlayBounds = useMemo(() => {
      if (viewport?.bounds) return viewport.bounds;
      if (!usesOverlay) return null;
      const halfLat = localizacao.latitudeDelta / 2;
      const halfLng = localizacao.longitudeDelta / 2;
      return {
        neLat: localizacao.latitude + halfLat,
        swLat: localizacao.latitude - halfLat,
        neLng: localizacao.longitude + halfLng,
        swLng: localizacao.longitude - halfLng,
      };
    }, [
      localizacao.latitude,
      localizacao.latitudeDelta,
      localizacao.longitude,
      localizacao.longitudeDelta,
      usesOverlay,
      viewport?.bounds,
    ]);
    const effectiveZoom = viewport?.zoom ?? lastZoomLevelRef.current;

    const cardPontos = useMemo(() => {
      if (!usesOverlay || pontos.length === 0) return [];
      if (pontos.length <= EXPLORE_MAP_MAX_VISIBLE_CARDS) return pontos;
      if (!overlayBounds) return pontos.slice(0, EXPLORE_MAP_MAX_VISIBLE_CARDS);
      return filterPontosInBounds(pontos, overlayBounds, EXPLORE_MAP_MAX_VISIBLE_CARDS);
    }, [overlayBounds, pontos, usesOverlay]);

    const showCardOverlay = useMemo(() => {
      if (!usesOverlay || cardPontos.length === 0) return false;
      return shouldUseCardOverlay(
        effectiveZoom,
        cardPontos.length,
        EXPLORE_MAP_CARD_MIN_ZOOM,
        EXPLORE_MAP_MAX_VISIBLE_CARDS,
      );
    }, [cardPontos.length, effectiveZoom, usesOverlay]);

    const dotPontos = useMemo(() => {
      if (isDotOnly) return pontos;
      if (!usesOverlay) return pontos;
      if (showCardOverlay) return [];
      if (!overlayBounds) return [];
      return filterPontosInBounds(pontos, overlayBounds, EXPLORE_MAP_MAX_VISIBLE_CARDS);
    }, [isDotOnly, usesOverlay, showCardOverlay, pontos, overlayBounds]);

    const dotsGeoJson = useMemo(() => {
      if (dotPontos.length === 0) return null;
      return {
        type: 'FeatureCollection' as const,
        features: dotPontos.map((ponto) => ({
          type: 'Feature' as const,
          id: ponto.id,
          geometry: {
            type: 'Point' as const,
            coordinates: [ponto.longitude, ponto.latitude] as [number, number],
          },
          properties: {
            id: ponto.id,
            titulo: ponto.titulo,
            tipo: ponto.tipo,
            markerColor: getMarkerColor?.(ponto.tipo) ?? defaultMarkerColor,
          },
        })),
      };
    }, [defaultMarkerColor, dotPontos, getMarkerColor]);

    const handleDotsPress = useCallback(
      (event: { features?: Array<{ properties?: { id?: string | number } | null }> }) => {
        const feature = event.features?.[0];
        const id = feature?.properties?.id;
        if (id == null) return;
        const ponto = pontosRef.current.find((item) => item.id === String(id));
        if (ponto) onMarkerPress?.(ponto);
      },
      [onMarkerPress],
    );

    const applyCameraToAnchor = useCallback(
      (loc: Localizacao, duration: number, zoomLevel = MAP_DEFAULT_ZOOM) => {
        lastZoomLevelRef.current = zoomLevel;
        lastCenterRef.current = [loc.longitude, loc.latitude];
        cameraRef.current?.setCamera({
          centerCoordinate: lastCenterRef.current,
          zoomLevel,
          pitch: MAP_CAMERA_PITCH,
          heading: MAP_CAMERA_HEADING,
          animationDuration: duration,
          animationMode: duration > 0 ? 'easeTo' : 'moveTo',
        });
      },
      [],
    );

    const handleDidFinishLoadingMap = useCallback(() => {
      if (initialViewAppliedRef.current) return;
      initialViewAppliedRef.current = true;
      const anchor: Anchor = {
        lat: localizacao.latitude,
        lng: localizacao.longitude,
        d: localizacao.latitudeDelta,
      };
      lastAnchorRef.current = anchor;
      const apply = () => applyCameraToAnchor(localizacao, 0);
      apply();
      requestAnimationFrame(apply);
      setTimeout(apply, 150);
      lastPropLocRef.current = {
        lat: localizacao.latitude,
        lng: localizacao.longitude,
      };

      if (usesOverlay) {
        const halfLat = localizacao.latitudeDelta / 2;
        const halfLng = localizacao.longitudeDelta / 2;
        setViewport({
          bounds: {
            neLat: localizacao.latitude + halfLat,
            swLat: localizacao.latitude - halfLat,
            neLng: localizacao.longitude + halfLng,
            swLng: localizacao.longitude - halfLng,
          },
          zoom: MAP_DEFAULT_ZOOM,
          centerLat: localizacao.latitude,
          centerLng: localizacao.longitude,
        });
      }
    }, [applyCameraToAnchor, localizacao, usesOverlay]);

    useEffect(() => {
      if (!initialViewAppliedRef.current) return;
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
      applyCameraToAnchor(localizacao, 450);
    }, [localizacao, applyCameraToAnchor]);

    const scheduleViewportUpdate = useCallback((p: RegionPayload) => {
      if (p.zoomLevel == null || !p.visibleBounds) return;

      const z = p.zoomLevel;
      lastZoomLevelRef.current = z;
      const [ne, sw] = p.visibleBounds;
      const [neLng, neLat] = ne;
      const [swLng, swLat] = sw;
      lastCenterRef.current = [(neLng + swLng) / 2, (neLat + swLat) / 2];

      const nextViewport: MapViewport = {
        bounds: boundsFromRegionPayload(p.visibleBounds as unknown as [number, number][]),
        zoom: z,
        centerLat: (neLat + swLat) / 2,
        centerLng: (neLng + swLng) / 2,
      };

      setViewport(nextViewport);

      if (onRegionChangeComplete) {
        const region = regionFromPayload(p);
        if (!region) return;
        if (regionNotifyDebounceRef.current) clearTimeout(regionNotifyDebounceRef.current);
        regionNotifyDebounceRef.current = setTimeout(() => {
          onRegionChangeComplete(region);
        }, EXPLORE_MAP_VIEWPORT_DEBOUNCE_MS);
      }
    }, [onRegionChangeComplete]);

    useEffect(() => {
      return () => {
        if (regionNotifyDebounceRef.current) clearTimeout(regionNotifyDebounceRef.current);
      };
    }, []);

    const handleRegionDidChange = useCallback(
      (feature: { properties?: RegionPayload }) => {
        const p = feature.properties;
        if (!p) return;
        if (p.isUserInteraction) onUserDragMap?.();
        scheduleViewportUpdate(p);
      },
      [onUserDragMap, scheduleViewportUpdate],
    );

    useImperativeHandle(
      ref,
      () => ({
        animateToRegion: (region: Region, duration = 300) => {
          const z = zoomFromLatitudeDelta(region.latitudeDelta);
          lastZoomLevelRef.current = z;
          lastCenterRef.current = [region.longitude, region.latitude];
          cameraRef.current?.setCamera({
            centerCoordinate: lastCenterRef.current,
            zoomLevel: z,
            pitch: MAP_CAMERA_PITCH,
            heading: MAP_CAMERA_HEADING,
            animationDuration: duration,
            animationMode: 'easeTo',
          });
        },
        zoomBy: (deltaLevels: number, duration = 220) => {
          const next = clampZoom(lastZoomLevelRef.current + deltaLevels);
          lastZoomLevelRef.current = next;
          cameraRef.current?.setCamera({
            centerCoordinate: lastCenterRef.current,
            zoomLevel: next,
            pitch: MAP_CAMERA_PITCH,
            heading: MAP_CAMERA_HEADING,
            animationDuration: duration,
            animationMode: 'easeTo',
          });
        },
      }),
      [],
    );

    const mapViewStyle = useMemo((): ViewStyle | ViewStyle[] => {
      if (Platform.OS === 'web') {
        return [styles.map, { cursor: 'grab' } as unknown as ViewStyle];
      }
      return styles.map;
    }, []);

    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={mapViewStyle}
          mapStyle={mapStyleUrl}
          scrollEnabled
          pitchEnabled={false}
          rotateEnabled={false}
          logoEnabled={false}
          attributionEnabled
          onDidFinishLoadingMap={handleDidFinishLoadingMap}
          onRegionDidChange={handleRegionDidChange}
        >
          <Camera
            ref={cameraRef}
            followUserLocation={false}
            defaultSettings={{
              pitch: MAP_CAMERA_PITCH,
              heading: MAP_CAMERA_HEADING,
            }}
          />
          <UserLocation visible androidRenderMode="gps" showsUserHeadingIndicator />
          {dotsGeoJson ? (
            <ShapeSource id="map-dots-source" shape={dotsGeoJson} onPress={handleDotsPress}>
              <CircleLayer
                id="map-dots-layer"
                style={{
                  circleRadius: ['interpolate', ['linear'], ['zoom'], 12, 7, 15, 11, 17, 13],
                  circleColor: ['get', 'markerColor'],
                  circleStrokeWidth: 3,
                  circleStrokeColor: '#ffffff',
                  circleOpacity: 0.95,
                }}
              />
            </ShapeSource>
          ) : null}
          {showCardOverlay ? (
            <MapPoiNativeMarkers pontos={cardPontos} onMarkerPress={onMarkerPress} />
          ) : null}
        </MapView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapLibreMapaView;
