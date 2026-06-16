import ExploreMap3DBuildings from '@/components/ExploreMap3DBuildings';
import MapPointMarkerCard from '@/components/MapPointMarkerCard';
import { EXPLORE_MAP_3D_PITCH } from '@/constants/exploreMap';
import { getMapLibreStyleUrl } from '@/constants/mapLibreStyle';
import type { Localizacao, PontoInteresse, Region } from '@/types';
import { enhanceExplore3DMapStyle } from '@/utils/mapLibre3dStyle';
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

/** Fabric precisa de um ciclo de desmontagem antes de remontar PointAnnotation com views React. */
const CARD_MARKER_MOUNT_DELAY_MS = Platform.OS === 'ios' ? 160 : 80;

type MapCardMarkersLayerProps = {
  layerKey: string | number;
  pontos: PontoInteresse[];
  onMarkerPress?: (ponto: PontoInteresse) => void;
};

function MapCardMarkersLayer({ layerKey, pontos, onMarkerPress }: MapCardMarkersLayerProps) {
  return (
    <>
      {pontos.map((ponto) => {
        const annotationId = `${layerKey}-${ponto.id}`;
        return (
          <MapLibreGL.PointAnnotation
            key={annotationId}
            id={annotationId}
            coordinate={[ponto.longitude, ponto.latitude]}
            title={ponto.titulo}
            anchor={{ x: 0.5, y: 1 }}
            onSelected={() => onMarkerPress?.(ponto)}
          >
            <View collapsable={false}>
              <MapPointMarkerCard ponto={ponto} />
            </View>
          </MapLibreGL.PointAnnotation>
        );
      })}
    </>
  );
}

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
export type MapViewMode = '2d' | '3d';

interface MapLibreMapaViewProps {
  localizacao: Localizacao;
  pontos: PontoInteresse[];
  /** `2d` = visão plana; `3d` = inclinação + prédios extrudados (Explorar). */
  viewMode?: MapViewMode;
  /** `card` = preview com card; `dot` = leve e estável no Fabric (recomendado no Explorar). */
  markerVariant?: MapMarkerVariant;
  /** Troca a camada de dots ao mudar filtro/categoria (evita reciclagem de views no Fabric). */
  markersLayerKey?: string | number;
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
      viewMode = '2d',
      markerVariant = 'card',
      markersLayerKey = 'default',
      getMarkerColor,
      onRegionChangeComplete,
      onUserDragMap,
      onMarkerPress,
    },
    ref,
  ) {
    const is3dView = viewMode === '3d';
    const isDotMarker = markerVariant === 'dot';
    const defaultMarkerColor = '#7C3AED';
    const defaultPitch = is3dView ? EXPLORE_MAP_3D_PITCH : 0;
    const [cardPontos, setCardPontos] = useState<PontoInteresse[]>([]);
    const [cardLayerKey, setCardLayerKey] = useState(markersLayerKey);
    const cardMountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pontosRef = useRef(pontos);
    pontosRef.current = pontos;
    const cardPontosSignature = useMemo(
      () => pontos.map((ponto) => ponto.id).join('\u0001'),
      [pontos],
    );

    useEffect(() => {
      if (cardMountTimerRef.current) {
        clearTimeout(cardMountTimerRef.current);
        cardMountTimerRef.current = null;
      }

      if (isDotMarker) {
        setCardPontos([]);
        return;
      }

      setCardPontos([]);

      if (pontosRef.current.length === 0) {
        setCardLayerKey(markersLayerKey);
        return;
      }

      cardMountTimerRef.current = setTimeout(() => {
        cardMountTimerRef.current = null;
        setCardLayerKey(markersLayerKey);
        setCardPontos(pontosRef.current);
      }, CARD_MARKER_MOUNT_DELAY_MS);

      return () => {
        if (cardMountTimerRef.current) {
          clearTimeout(cardMountTimerRef.current);
          cardMountTimerRef.current = null;
        }
      };
    }, [isDotMarker, markersLayerKey, cardPontosSignature]);

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
    const mapStyleUrl = useMemo(() => getMapLibreStyleUrl({ threeD: is3dView }), [is3dView]);
    const [mapStyleJson, setMapStyleJson] = useState<string | null>(null);
    const [buildingsBelowLayerId, setBuildingsBelowLayerId] = useState<string | undefined>();
    const [mapLoaded, setMapLoaded] = useState(false);

   
    const initialViewAppliedRef = useRef(false);
    const lastAnchorRef = useRef<Anchor | null>(null);
    const lastZoomLevelRef = useRef<number>(zoomFromLatitudeDelta(0.05));
    const lastPitchRef = useRef<number>(defaultPitch);
    const lastCenterRef = useRef<[number, number]>([
      localizacao.longitude,
      localizacao.latitude,
    ]);
    
    const lastPropLocRef = useRef<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
      lastPitchRef.current = defaultPitch;
    }, [defaultPitch]);

    const applyCameraToAnchor = useCallback((loc: Localizacao, duration: number) => {
      const z = zoomFromLatitudeDelta(loc.latitudeDelta);
      lastZoomLevelRef.current = z;
      lastCenterRef.current = [loc.longitude, loc.latitude];
      if (is3dView && lastPitchRef.current < 20) {
        lastPitchRef.current = defaultPitch;
      }
      cameraRef.current?.setCamera({
        centerCoordinate: lastCenterRef.current,
        zoomLevel: z,
        pitch: is3dView ? lastPitchRef.current : 0,
        animationDuration: duration,
        animationMode: 'easeTo',
      });
    }, [defaultPitch, is3dView]);

    const applyInitial3DView = useCallback(() => {
      const z = zoomFromLatitudeDelta(localizacao.latitudeDelta);
      lastZoomLevelRef.current = z;
      lastCenterRef.current = [localizacao.longitude, localizacao.latitude];
      if (is3dView) {
        lastPitchRef.current = defaultPitch;
      }
      cameraRef.current?.setCamera({
        centerCoordinate: lastCenterRef.current,
        zoomLevel: z,
        pitch: is3dView ? defaultPitch : 0,
        animationDuration: 0,
        animationMode: 'easeTo',
      });
    }, [defaultPitch, is3dView, localizacao]);

    useEffect(() => {
      setMapLoaded(false);
    }, [mapStyleJson, is3dView]);

    const handleDidFinishLoadingMap = useCallback(() => {
      setMapLoaded(true);
      if (initialViewAppliedRef.current) {
        applyInitial3DView();
        return;
      }
      initialViewAppliedRef.current = true;
      const anchor: Anchor = {
        lat: localizacao.latitude,
        lng: localizacao.longitude,
        d: localizacao.latitudeDelta,
      };
      lastAnchorRef.current = anchor;
      const apply = () => applyInitial3DView();
      apply();
      requestAnimationFrame(apply);
      setTimeout(apply, 150);
      lastPropLocRef.current = {
        lat: localizacao.latitude,
        lng: localizacao.longitude,
      };
    }, [applyInitial3DView, localizacao]);

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
          const prepared = is3dView
            ? enhanceExplore3DMapStyle(style)
            : { style, meta: { labelLayerId: undefined } };
          setBuildingsBelowLayerId(prepared.meta.labelLayerId);
          setMapStyleJson(JSON.stringify(prepared.style));
        } catch {
        }
      })();

      return () => ac.abort();
    }, [is3dView, mapStyleUrl]);

    const emitRegionFromPayload = useCallback(
      (p: RegionPayload) => {
        if (p.isUserInteraction) {
          onUserDragMap?.();
        }
        const z = p.zoomLevel;
        if (z != null) {
          lastZoomLevelRef.current = z;
        }
        if (p.pitch != null) {
          lastPitchRef.current = p.pitch;
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
            pitch: is3dView ? lastPitchRef.current : 0,
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
            pitch: is3dView ? lastPitchRef.current : 0,
            animationDuration: duration,
            animationMode: 'easeTo',
          });
        },
      }),
      [is3dView],
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
        <Camera
          ref={cameraRef}
          followUserLocation={false}
          pitch={is3dView ? defaultPitch : 0}
          defaultSettings={{
            pitch: defaultPitch,
            zoomLevel: zoomFromLatitudeDelta(localizacao.latitudeDelta),
            centerCoordinate: [localizacao.longitude, localizacao.latitude],
          }}
        />
        <UserLocation visible androidRenderMode="gps" showsUserHeadingIndicator />
        {is3dView && mapLoaded ? (
          <ExploreMap3DBuildings belowLayerID={buildingsBelowLayerId} />
        ) : null}
        {isDotMarker && dotsGeoJson ? (
          <ShapeSource
            key={`map-dots-${markersLayerKey}`}
            id={`map-dots-${markersLayerKey}`}
            shape={dotsGeoJson}
            onPress={handleDotsPress}
          >
            <CircleLayer
              id={`map-dots-layer-${markersLayerKey}`}
              style={{
                circleRadius: 7,
                circleColor: ['get', 'markerColor'],
                circleStrokeWidth: 2,
                circleStrokeColor: '#ffffff',
              }}
            />
          </ShapeSource>
        ) : cardPontos.length > 0 ? (
          <MapCardMarkersLayer
            key={`card-layer-${cardLayerKey}`}
            layerKey={cardLayerKey}
            pontos={cardPontos}
            onMarkerPress={onMarkerPress}
          />
        ) : null}
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
