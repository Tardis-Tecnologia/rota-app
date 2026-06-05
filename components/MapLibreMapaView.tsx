import MapPointMarkerCard from '@/components/MapPointMarkerCard';
import { getMapLibreStyleUrl } from '@/constants/mapLibreStyle';
import type { Localizacao, PontoInteresse, Region } from '@/types';
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

const markerChildCollapsable = Platform.OS === 'android' ? false : undefined;

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

export type MapMarkerVariant = 'card' | 'dot';

interface MapLibreMapaViewProps {
  localizacao: Localizacao;
  pontos: PontoInteresse[];
  /** `card` = Explorar e telas com preview; `dot` = Guia (mais leve, evita crash no Fabric). */
  markerVariant?: MapMarkerVariant;
  getMarkerColor?: (tipo: PontoInteresse['tipo']) => string;
  onRegionChangeComplete?: (region: Region) => void;
  onUserDragMap?: () => void;
  onMarkerPress?: (ponto: PontoInteresse) => void;
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
    const isDotMarker = markerVariant === 'dot';
    const defaultMarkerColor = '#7C3AED';

    const dotsGeoJson = useMemo(() => {
      if (!isDotMarker || pontos.length === 0) return null;
      return {
        type: 'FeatureCollection' as const,
        features: pontos.map((ponto) => ({
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
    }, [defaultMarkerColor, getMarkerColor, isDotMarker, pontos]);

    const handleDotsPress = useCallback(
      (event: {
        features?: Array<{ properties?: Record<string, unknown> }>;
        nativeEvent?: { features?: Array<{ properties?: Record<string, unknown> }> };
      }) => {
        const features = event.features ?? event.nativeEvent?.features;
        const feature = features?.[0];
        const id = feature?.properties?.id;
        if (id == null) return;
        const ponto = pontos.find((item) => item.id === String(id));
        if (ponto) onMarkerPress?.(ponto);
      },
      [onMarkerPress, pontos],
    );
    const mapRef = useRef<MapViewRef>(null);
    const cameraRef = useRef<CameraRef>(null);
    const mapStyleUrl = useMemo(() => getMapLibreStyleUrl(), []);
    const [mapStyleJson, setMapStyleJson] = useState<string | null>(null);

   
    const initialViewAppliedRef = useRef(false);
    const lastAnchorRef = useRef<Anchor | null>(null);
    const lastZoomLevelRef = useRef<number>(zoomFromLatitudeDelta(0.05));
    const lastCenterRef = useRef<[number, number]>([
      localizacao.longitude,
      localizacao.latitude,
    ]);
    
    const lastPropLocRef = useRef<{ lat: number; lng: number } | null>(null);

    const applyCameraToAnchor = useCallback((loc: Localizacao, duration: number) => {
      const z = zoomFromLatitudeDelta(loc.latitudeDelta);
      lastZoomLevelRef.current = z;
      lastCenterRef.current = [loc.longitude, loc.latitude];
      cameraRef.current?.setCamera({
        centerCoordinate: lastCenterRef.current,
        zoomLevel: z,
        animationDuration: duration,
        animationMode: 'easeTo',
      });
    }, []);

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
    }, [applyCameraToAnchor, localizacao]);

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

    useEffect(() => {
      const isMapTiler = mapStyleUrl.startsWith('https://api.maptiler.com/');
      if (!isMapTiler) {
        setMapStyleJson(null);
        return;
      }

      const ac = new AbortController();
      (async () => {
        try {
          const res = await fetch(mapStyleUrl, { signal: ac.signal, headers: { Accept: 'application/json' } });
          if (!res.ok) return;
          const style = (await res.json()) as any;
          if (style?.sources && typeof style.sources === 'object') {
            const removed = new Set<string>();
            for (const [id, src] of Object.entries<any>(style.sources)) {
              const type = src?.type as string | undefined;
              const hasUrl = typeof src?.url === 'string' && src.url.length > 0;
              const hasTiles = Array.isArray(src?.tiles) && src.tiles.length > 0;
              const hasData = src?.data != null;

              const needsTilesOrUrl = type === 'vector' || type === 'raster' || type === 'raster-dem';
              const ok = needsTilesOrUrl ? hasUrl || hasTiles : type === 'geojson' ? hasData : true;
              if (!ok) {
                delete style.sources[id];
                removed.add(id);
              }
            }

            if (removed.size > 0 && Array.isArray(style.layers)) {
              style.layers = style.layers.filter((l: any) => !removed.has(l?.source));
            }
          }
          setMapStyleJson(JSON.stringify(style));
        } catch {
        }
      })();

      return () => ac.abort();
    }, [mapStyleUrl]);

    const emitRegionFromPayload = useCallback(
      (p: RegionPayload) => {
        if (p.isUserInteraction) {
          onUserDragMap?.();
        }
        const z = p.zoomLevel;
        if (z != null) {
          lastZoomLevelRef.current = z;
        }
        const [ne, sw] = p.visibleBounds;
        const [neLng, neLat] = ne;
        const [swLng, swLat] = sw;
        const lat = (neLat + swLat) / 2;
        const lng = (neLng + swLng) / 2;
        lastCenterRef.current = [lng, lat];
        const latDelta = latitudeDeltaFromZoom(z);
        const lngSpan = Math.abs(neLng - swLng);
        const latSpan = Math.abs(neLat - swLat);
        const lngDelta = latSpan > 1e-9 ? latDelta * (lngSpan / latSpan) : latDelta;
        onRegionChangeComplete?.({
          latitude: lat,
          longitude: lng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        });
      },
      [onRegionChangeComplete, onUserDragMap],
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
        pitchEnabled
        rotateEnabled
        logoEnabled={false}
        attributionEnabled
        onDidFinishLoadingMap={handleDidFinishLoadingMap}
        onRegionDidChange={(feature) => {
          const p = feature.properties;
          if (p?.zoomLevel != null && p?.visibleBounds) {
            emitRegionFromPayload(p);
          }
        }}
      >
        <Camera ref={cameraRef} followUserLocation={false} />
        <UserLocation visible androidRenderMode="gps" showsUserHeadingIndicator />
        {isDotMarker && dotsGeoJson ? (
          <ShapeSource id="map-dots-source" shape={dotsGeoJson} onPress={handleDotsPress}>
            <CircleLayer
              id="map-dots-layer"
              style={{
                circleRadius: 7,
                circleColor: ['get', 'markerColor'],
                circleStrokeWidth: 2,
                circleStrokeColor: '#ffffff',
              }}
            />
          </ShapeSource>
        ) : (
          pontos.map((ponto) => (
            <MapLibreGL.PointAnnotation
              key={ponto.id}
              id={ponto.id}
              coordinate={[ponto.longitude, ponto.latitude]}
              title={ponto.titulo}
              anchor={{ x: 0.5, y: 1 }}
              onSelected={() => onMarkerPress?.(ponto)}
            >
              <View collapsable={markerChildCollapsable}>
                <MapPointMarkerCard ponto={ponto} />
              </View>
            </MapLibreGL.PointAnnotation>
          ))
        )}
      </MapView>
    );
  },
);

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default MapLibreMapaView;
