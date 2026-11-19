import ExploreFloatingCard from '@/components/ExploreFloatingCard';
import ExploreMapControls from '@/components/ExploreMapControls';
import MapLibreMapaView, {
  type MapLibreMapaViewRef,
  type MapMarkerVariant,
} from '@/components/MapLibreMapaView';
import { ModalReportPrefeitura } from '@/components/ModalReportPrefeitura';
import PlaceDetailsSheet from '@/components/PlaceDetailsSheet';
import ReportButton, { REPORT_SUBJECT_BY_TYPE, type ReportType } from '@/components/ReportButton';
import Toast from '@/components/Toast';
import { EXPLORE_MAP_MAX_MARKERS, EXPLORE_MAP_3D_ZOOM_DELTA } from '@/constants/exploreMap';
import { AppColors } from '@/constants/theme';
import { useWhitelabelCity, useWhitelabelMapCenter } from '@/hooks/useWhitelabelCity';
import { useNotificationUnreadCount } from '@/hooks/useNotificationUnreadCount';
import {
    communityToExplorePonto,
    EXPLORE_COMMUNITIES_CHIP_ID,
    listForumCommunities,
} from '@/services/forumCommunityApi';
import {
    ensureForegroundLocationPermission,
    getCurrentPositionWithRetry,
} from '@/services/locationPermission';
import { placeToPonto } from '@/services/mapPlaceToPonto';
import { NEARBY_PLACES_RADIUS_METERS, searchNearbyPlaces } from '@/services/placesService';
import { enrichPontosWithPhotos } from '@/services/placePhotoService';
import { cnesMarkerColor, getCnesEstablishments, type CnesEstablishment } from '@/services/cnesApi';
import { listPublicServiceProviders } from '@/services/serviceProvidersApi';
import { getEvents, type EventItem } from '@/services/eventsService';
import type { ServiceProviderListItem } from '@/types/serviceProvider';
import { distanceMeters } from '@/utils/guiaGeo';
import {
  formatRouteDistance,
  formatRouteDuration,
  getDirectionsRoute,
} from '@/services/directionsService';
import type { Region } from '@/types';
import { Localizacao, PontoInteresse } from '@/types';
import type { DirectionsRoute } from '@/types/directions';
import { EXPLORE_GPS_STALE_MS } from '@/utils/appRefreshPolicy';
import {
    EXPLORE_PARTNER_STORES_CHIP_ID,
    loadPartnerStoresForMap,
} from '@/utils/commercialStoreMap';
import { regionFromRouteCoordinates } from '@/utils/routeBounds';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAP_LOCATION_WATCH_DISTANCE_METERS = 15;
const MAP_LOCATION_WATCH_TIME_MS = 5000;
/** Cards até zoom de bairro/rua; acima disso usa dots leves (estáveis no Fabric). */
const EXPLORE_CARD_MAX_LAT_DELTA = 0.058;

const FILTER_CHIP_TO_PLACE_TYPE: Record<string, string> = {
  restaurant: 'restaurant',
  bakery: 'bakery',
  pharmacy: 'pharmacy',
  market: 'market',
  school: 'school',
  hospital: 'hospital',
  gas_station: 'gas_station',
};

const CHIP_LABELS: Record<string, string> = {
  restaurant: 'Restaurantes',
  bakery: 'Padarias',
  pharmacy: 'Farmácias',
  market: 'Mercados',
  prestador: 'Prestadores',
  school: 'Escolas',
  hospital: 'Hospitais',
  gas_station: 'Postos',
  communities: 'Comunidades',
  partner_stores: 'Parceiros',
  events: 'Eventos',
};

const CHIP_MARKER_COLOR: Record<string, string> = {
  restaurant: '#dc2626',
  bakery: '#a16207',
  pharmacy: '#16a34a',
  market: '#d97706',
  school: '#1e40af',
  hospital: '#db2777',
  gas_station: '#6b7280',
  prestador: '#0d9488',
  communities: '#0891b2',
  partner_stores: '#b45309',
  events: '#7c3aed',
};

const ALL_MAP_PER_CATEGORY = 10;

function serviceProviderToMapPonto(item: ServiceProviderListItem): PontoInteresse | null {
  if (item.status !== 'APPROVED' || item.type === 'COMPANY') return null;
  const latitude = Number.parseFloat(String(item.latitude ?? ''));
  const longitude = Number.parseFloat(String(item.longitude ?? ''));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const address = item.locationName?.trim() || '';
  return {
    id: item.id,
    titulo: item.name,
    descricao: address || 'Prestador de serviço',
    latitude,
    longitude,
    placeType: 'prestador',
    formattedAddress: address || undefined,
    photoUrl: item.imagePublicUrl?.trim() || undefined,
    markerColor: CHIP_MARKER_COLOR.prestador,
  };
}

function eventToMapPonto(event: EventItem): PontoInteresse | null {
  if (event.status && event.status !== 'published') return null;
  const latitude = Number.parseFloat(String(event.latitude ?? ''));
  const longitude = Number.parseFloat(String(event.longitude ?? ''));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    id: `event-${event.id}`,
    titulo: event.title,
    descricao: event.locationName?.trim() || event.locationAddress?.trim() || 'Evento',
    latitude,
    longitude,
    tipo: 'cultura',
    placeType: 'events',
    formattedAddress: event.locationAddress?.trim() || undefined,
    photoUrl: event.image?.publicUrl?.trim() || undefined,
    markerColor: CHIP_MARKER_COLOR.events,
  };
}

function paintMarker(ponto: PontoInteresse, chipId: string): PontoInteresse {
  return { ...ponto, markerColor: ponto.markerColor ?? CHIP_MARKER_COLOR[chipId] };
}

function nearestMapPontos(
  items: PontoInteresse[],
  origin: { latitude: number; longitude: number },
  radiusMeters: number,
  limit: number,
  fallback = true,
): PontoInteresse[] {
  const ranked = items
    .map((ponto) => ({
      ponto,
      distance: distanceMeters(origin.latitude, origin.longitude, ponto.latitude, ponto.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);
  const near = ranked.filter((item) => item.distance <= radiusMeters).map((item) => item.ponto);
  const picked = near.length > 0 || !fallback ? near : ranked.map((item) => item.ponto);
  return picked.slice(0, limit);
}

function dedupePontos(items: PontoInteresse[]): PontoInteresse[] {
  const seen = new Set<string>();
  const out: PontoInteresse[] = [];
  for (const ponto of items) {
    if (seen.has(ponto.id)) continue;
    seen.add(ponto.id);
    out.push(ponto);
  }
  return out;
}

function routeParamToChipId(raw: string): string | undefined {
  const chip = raw;
  if (chip === EXPLORE_COMMUNITIES_CHIP_ID) return chip;
  if (chip === EXPLORE_PARTNER_STORES_CHIP_ID) return chip;
  if (chip === 'prestador' || chip === 'events') return chip;
  return FILTER_CHIP_TO_PLACE_TYPE[chip] ? chip : undefined;
}

export default function MapScreen() {
  const { unreadCount } = useNotificationUnreadCount();
  const city = useWhitelabelCity();
  const cityMapCenter = useWhitelabelMapCenter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const mapRef = useRef<MapLibreMapaViewRef | null>(null);
  const [localizacao, setLocalizacao] = useState<Localizacao>(() => ({
    ...cityMapCenter,
    latitudeDelta: city.fixedMapCenter ? EXPLORE_MAP_3D_ZOOM_DELTA : cityMapCenter.latitudeDelta,
    longitudeDelta: city.fixedMapCenter ? EXPLORE_MAP_3D_ZOOM_DELTA : cityMapCenter.longitudeDelta,
  }));
  const [mapRegion, setMapRegion] = useState<Region>(() => ({
    ...cityMapCenter,
    latitudeDelta: city.fixedMapCenter ? EXPLORE_MAP_3D_ZOOM_DELTA : cityMapCenter.latitudeDelta,
    longitudeDelta: city.fixedMapCenter ? EXPLORE_MAP_3D_ZOOM_DELTA : cityMapCenter.longitudeDelta,
  }));
  const [loading, setLoading] = useState<boolean>(true);
  const [locationReady, setLocationReady] = useState(false);
  const [locationError, setLocationError] = useState<'denied' | 'error' | null>(null);
  const [pontos, setPontos] = useState<PontoInteresse[]>([]);
  const [catalogPontos, setCatalogPontos] = useState<PontoInteresse[]>([]);
  const [mapPontosForView, setMapPontosForView] = useState<PontoInteresse[]>([]);
  const [healthLayerOn, setHealthLayerOn] = useState(false);
  const [healthPontos, setHealthPontos] = useState<PontoInteresse[]>([]);
  const [markersLayerKey, setMarkersLayerKey] = useState(0);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | undefined>(undefined);
  const [filterLoading, setFilterLoading] = useState(false);
  const [selectedPontoDetail, setSelectedPontoDetail] = useState<PontoInteresse | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info' | 'error' | 'warning'>('success');
  const [showDragHint, setShowDragHint] = useState(true);
  const [prefeituraModalVisible, setPrefeituraModalVisible] = useState(false);
  const [prefeituraAssuntoInicial, setPrefeituraAssuntoInicial] = useState<string | undefined>();
  const [activeRoute, setActiveRoute] = useState<DirectionsRoute | null>(null);
  const [routeDestName, setRouteDestName] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const { category, focusLat, focusLng, focusLabel, focusAddress, traceRoute, routeKey, healthLayer } =
    useLocalSearchParams<{
      category?: string;
      focusLat?: string;
      focusLng?: string;
      focusLabel?: string;
      focusAddress?: string;
      traceRoute?: string;
      routeKey?: string;
      healthLayer?: string;
    }>();
  const appliedCategoryFromRoute = useRef<string | null>(null);
  const appliedFocusKeyRef = useRef<string | null>(null);
  const appliedRouteKeyRef = useRef<string | null>(null);
  const pendingInitialGpsCenterRef = useRef(false);
  const lastGpsAtRef = useRef(0);
  const locationReadyRef = useRef(false);
  const hadLocationErrorRef = useRef(false);
  const filterRequestSeqRef = useRef(0);
  const catalogStartedRef = useRef(false);

  const searchOrigin = useMemo(
    (): Localizacao =>
      city.fixedMapCenter
        ? {
            latitude: city.latitude,
            longitude: city.longitude,
            latitudeDelta: localizacao.latitudeDelta,
            longitudeDelta: localizacao.longitudeDelta,
          }
        : localizacao,
    [
      city.fixedMapCenter,
      city.latitude,
      city.longitude,
      localizacao.latitudeDelta,
      localizacao.longitudeDelta,
      localizacao.latitude,
      localizacao.longitude,
    ],
  );

  const applyCityAnchor = useCallback(() => {
    const next: Localizacao = {
      latitude: city.latitude,
      longitude: city.longitude,
      latitudeDelta: EXPLORE_MAP_3D_ZOOM_DELTA,
      longitudeDelta: EXPLORE_MAP_3D_ZOOM_DELTA,
    };
    setLocalizacao(next);
    setMapRegion(next);
    pendingInitialGpsCenterRef.current = true;
    setLocationReady(true);
    setLocationError(null);
    hadLocationErrorRef.current = false;
    setLoading(false);
  }, [city.latitude, city.longitude]);

  useEffect(() => {
    locationReadyRef.current = locationReady;
  }, [locationReady]);

  useEffect(() => {
    if (!city.fixedMapCenter) return;
    applyCityAnchor();
  }, [applyCityAnchor, city.fixedMapCenter, city.hostId]);

  const shouldSkipGpsRefresh = useCallback((force: boolean): boolean => {
    if (force) return false;
    if (hadLocationErrorRef.current) return false;
    if (!locationReadyRef.current) return false;
    if (lastGpsAtRef.current === 0) return false;
    return Date.now() - lastGpsAtRef.current < EXPLORE_GPS_STALE_MS;
  }, []);

  const applyGpsCoords = useCallback(
    (latitude: number, longitude: number, options?: { centerMap?: boolean }) => {
      const centerMap = options?.centerMap ?? false;
      setLocalizacao((prev) => {
        const next: Localizacao = centerMap
          ? {
              latitude,
              longitude,
              latitudeDelta: EXPLORE_MAP_3D_ZOOM_DELTA,
              longitudeDelta: EXPLORE_MAP_3D_ZOOM_DELTA,
            }
          : {
              ...prev,
              latitude,
              longitude,
            };
        if (centerMap) {
          pendingInitialGpsCenterRef.current = true;
          setMapRegion(next);
        }
        return next;
      });
      setLocationReady(true);
      setLocationError(null);
      hadLocationErrorRef.current = false;
      lastGpsAtRef.current = Date.now();
    },
    [],
  );

  const solicitarPermissaoLocalizacao = useCallback(
    async (options?: { force?: boolean }): Promise<void> => {
      if (city.fixedMapCenter) {
        applyCityAnchor();
        return;
      }

      const force = options?.force ?? false;
      if (shouldSkipGpsRefresh(force)) {
        setLoading(false);
        return;
      }

      setLocationError(null);
      const showBlockingLoader = !locationReadyRef.current;
      if (showBlockingLoader) {
        setLocationReady(false);
        setLoading(true);
      }

      try {
        const ok = await ensureForegroundLocationPermission();
        if (!ok) {
          hadLocationErrorRef.current = true;
          setLocationError('denied');
          return;
        }

        const location = await getCurrentPositionWithRetry({
          accuracy: Location.Accuracy.Balanced,
        });
        applyGpsCoords(location.coords.latitude, location.coords.longitude, { centerMap: true });
      } catch {
        hadLocationErrorRef.current = true;
        setLocationError('error');
      } finally {
        setLoading(false);
      }
    },
    [applyCityAnchor, applyGpsCoords, city.fixedMapCenter, shouldSkipGpsRefresh],
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        setLoading(false);
        return;
      }

      if (city.fixedMapCenter) {
        applyCityAnchor();
        return;
      }

      let cancelled = false;
      let watchSub: Location.LocationSubscription | null = null;

      async function startLocationWatch(): Promise<void> {
        await solicitarPermissaoLocalizacao({ force: false });
        if (cancelled) return;

        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (cancelled || status !== 'granted') return;

          watchSub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: MAP_LOCATION_WATCH_DISTANCE_METERS,
              timeInterval: MAP_LOCATION_WATCH_TIME_MS,
            },
            ({ coords }) => {
              if (cancelled) return;
              applyGpsCoords(coords.latitude, coords.longitude);
            },
          );
        } catch {
          // Leitura inicial segue válida se o watch falhar (comum no emulador).
        }
      }

      void startLocationWatch();

      return () => {
        cancelled = true;
        watchSub?.remove();
      };
    }, [applyCityAnchor, applyGpsCoords, city.fixedMapCenter, solicitarPermissaoLocalizacao]),
  );

  const publishMapPontos = useCallback((items: PontoInteresse[]) => {
    setMapPontosForView(items.slice(0, EXPLORE_MAP_MAX_MARKERS));
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setShowDragHint(false);
      return;
    }
    const t = setTimeout(() => setShowDragHint(false), 12000);
    return () => clearTimeout(t);
  }, []);

  const applyFilterChip = useCallback(
    async (chipId: string) => {
      const requestId = ++filterRequestSeqRef.current;
      const isStale = () => requestId !== filterRequestSeqRef.current;

      if (chipId === categoriaSelecionada) {
        setMarkersLayerKey((k) => k + 1);
        setCategoriaSelecionada(undefined);
        setPontos([]);
        setMapPontosForView([]);
        setSelectedPontoDetail(null);
        return;
      }

      setMarkersLayerKey((k) => k + 1);
      setMapPontosForView([]);
      setSelectedPontoDetail(null);

      if (chipId === EXPLORE_COMMUNITIES_CHIP_ID) {
        setFilterLoading(true);
        try {
          const rows = await listForumCommunities(undefined, { init: 0, end: 200 });
          if (isStale()) return;
          const mapped = rows
            .map(communityToExplorePonto)
            .filter((p): p is PontoInteresse => p != null)
            .slice(0, EXPLORE_MAP_MAX_MARKERS);
          setPontos(mapped);
          publishMapPontos(mapped);
          setCategoriaSelecionada(chipId);
          setToastType(mapped.length > 0 ? 'success' : 'info');
          setToastMessage(
            mapped.length > 0
              ? `${mapped.length} comunidade${mapped.length === 1 ? '' : 's'} com local no mapa.`
              : 'Nenhuma comunidade com localização cadastrada.',
          );
          setToastKey((k) => k + 1);
          setShowToast(true);
        } catch {
          if (!isStale()) {
            Alert.alert('Erro', 'Não foi possível carregar as comunidades.');
          }
        } finally {
          if (!isStale()) {
            setFilterLoading(false);
          }
        }
        return;
      }

      if (chipId === 'prestador') {
        setFilterLoading(true);
        try {
          const rows = await listPublicServiceProviders({ init: 0, end: 200 });
          if (isStale()) return;
          const mapped = nearestMapPontos(
            rows
              .map(serviceProviderToMapPonto)
              .filter((ponto): ponto is PontoInteresse => ponto != null),
            searchOrigin,
            city.placesSearchRadiusMeters || NEARBY_PLACES_RADIUS_METERS,
            EXPLORE_MAP_MAX_MARKERS,
          );
          setPontos(mapped);
          publishMapPontos(mapped);
          setCategoriaSelecionada(chipId);
          setToastType(mapped.length > 0 ? 'success' : 'info');
          setToastMessage(
            mapped.length > 0
              ? `${mapped.length} prestador${mapped.length === 1 ? '' : 'es'} no mapa.`
              : 'Nenhum prestador com localização cadastrada.',
          );
          setToastKey((k) => k + 1);
          setShowToast(true);
        } catch {
          if (!isStale()) {
            Alert.alert('Erro', 'Não foi possível carregar os prestadores.');
          }
        } finally {
          if (!isStale()) {
            setFilterLoading(false);
          }
        }
        return;
      }

      if (chipId === 'events') {
        setFilterLoading(true);
        try {
          const rows = await getEvents({ status: 'published', init: 0, end: 100 });
          if (isStale()) return;
          const mapped = nearestMapPontos(
            rows
              .map(eventToMapPonto)
              .filter((ponto): ponto is PontoInteresse => ponto != null),
            searchOrigin,
            city.placesSearchRadiusMeters || NEARBY_PLACES_RADIUS_METERS,
            EXPLORE_MAP_MAX_MARKERS,
          );
          setPontos(mapped);
          publishMapPontos(mapped);
          setCategoriaSelecionada(chipId);
          setToastType(mapped.length > 0 ? 'success' : 'info');
          setToastMessage(
            mapped.length > 0
              ? `${mapped.length} evento${mapped.length === 1 ? '' : 's'} no mapa.`
              : 'Nenhum evento com localização cadastrada.',
          );
          setToastKey((k) => k + 1);
          setShowToast(true);
        } catch {
          if (!isStale()) {
            Alert.alert('Erro', 'Não foi possível carregar os eventos.');
          }
        } finally {
          if (!isStale()) {
            setFilterLoading(false);
          }
        }
        return;
      }

      if (chipId === EXPLORE_PARTNER_STORES_CHIP_ID) {
        setFilterLoading(true);
        try {
          const mapped = (await loadPartnerStoresForMap()).slice(0, EXPLORE_MAP_MAX_MARKERS);
          if (isStale()) return;
          setPontos(mapped);
          publishMapPontos(mapped);
          setCategoriaSelecionada(chipId);
          setToastType(mapped.length > 0 ? 'success' : 'info');
          setToastMessage(
            mapped.length > 0
              ? `${mapped.length} loja${mapped.length === 1 ? '' : 's'} parceira${mapped.length === 1 ? '' : 's'} no mapa.`
              : 'Nenhuma loja parceira com endereço localizável no momento.',
          );
          setToastKey((k) => k + 1);
          setShowToast(true);
        } catch {
          if (!isStale()) {
            Alert.alert('Erro', 'Não foi possível carregar as lojas parceiras.');
          }
        } finally {
          if (!isStale()) {
            setFilterLoading(false);
          }
        }
        return;
      }

      const placeType = FILTER_CHIP_TO_PLACE_TYPE[chipId];
      if (!placeType) return;

      setFilterLoading(true);
      try {
        const pos: [number, number] = [searchOrigin.longitude, searchOrigin.latitude];
        const radius = city.placesSearchRadiusMeters || NEARBY_PLACES_RADIUS_METERS;
        const places = await searchNearbyPlaces(placeType, pos, radius, 20);
        if (isStale()) return;
        const partnerSegment =
          placeType === 'restaurant' ||
          placeType === 'bakery' ||
          placeType === 'pharmacy' ||
          placeType === 'market'
            ? placeType
            : undefined;
        const partners = partnerSegment
          ? await loadPartnerStoresForMap(partnerSegment).catch(() => [])
          : [];
        if (isStale()) return;
        const basePontos = [...partners, ...places.map((p) => placeToPonto(p, placeType))].slice(
          0,
          EXPLORE_MAP_MAX_MARKERS,
        );
        setPontos(basePontos);
        publishMapPontos(basePontos);
        setCategoriaSelecionada(chipId);
        const label = CHIP_LABELS[chipId] ?? chipId;
        setToastType(places.length > 0 ? 'success' : 'info');
        setToastMessage(
          basePontos.length > 0
            ? `${basePontos.length} ${label.toLowerCase()} encontrados.`
            : `Nenhum ${label.toLowerCase()} encontrado por perto.`,
        );
        setToastKey((k) => k + 1);
        setShowToast(true);
      } catch (err) {
        if (isStale()) return;
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'UNSUPPORTED_CATEGORY') {
          Alert.alert('Em breve', 'Essa categoria ainda não está disponível.');
        } else {
          Alert.alert(
            'Erro',
            msg
              ? `Não foi possível buscar locais próximos.\n${msg}`
              : 'Não foi possível buscar locais próximos.',
          );
        }
      } finally {
        if (!isStale()) {
          setFilterLoading(false);
        }
      }
    },
    [
      categoriaSelecionada,
      city.placesSearchRadiusMeters,
      publishMapPontos,
      searchOrigin.latitude,
      searchOrigin.longitude,
    ],
  );

  useEffect(() => {
    if (loading || Platform.OS === 'web' || !locationReady) return;
    if (!category || typeof category !== 'string') return;
    const chip = routeParamToChipId(category);
    if (!chip || appliedCategoryFromRoute.current === category) return;
    appliedCategoryFromRoute.current = category;
    void applyFilterChip(chip);
  }, [loading, locationReady, category, applyFilterChip]);

  useEffect(() => {
    if (loading) return;
    if (typeof focusLat !== 'string' || typeof focusLng !== 'string') return;

    const lat = Number(focusLat);
    const lng = Number(focusLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const focusKey = `${focusLat}|${focusLng}`;
    if (appliedFocusKeyRef.current === focusKey) return;
    appliedFocusKeyRef.current = focusKey;

    const label = typeof focusLabel === 'string' && focusLabel.trim() ? focusLabel.trim() : 'Local encontrado';
    const address =
      typeof focusAddress === 'string' && focusAddress.trim() ? focusAddress.trim() : undefined;

    const focusPonto: PontoInteresse = {
      id: `focus-${focusKey}`,
      titulo: label,
      descricao: address ?? 'Endereço selecionado na busca',
      latitude: lat,
      longitude: lng,
      tipo: 'turismo',
      formattedAddress: address,
    };

    setCategoriaSelecionada(undefined);
    setPontos([focusPonto]);
    publishMapPontos([focusPonto]);
    setMarkersLayerKey((k) => k + 1);

    const region: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: EXPLORE_MAP_3D_ZOOM_DELTA,
      longitudeDelta: EXPLORE_MAP_3D_ZOOM_DELTA,
    };
    setLocalizacao(region);
    setMapRegion(region);
    if (traceRoute !== '1') {
      setSelectedPontoDetail(focusPonto);
    }

    const id = setTimeout(() => {
      mapRef.current?.animateToRegion(region, 600);
    }, 200);
    return () => clearTimeout(id);
  }, [loading, focusLat, focusLng, focusLabel, focusAddress, publishMapPontos, traceRoute]);

  useEffect(() => {
    if (loading || Platform.OS === 'web' || !locationReady) return;
    if (!pendingInitialGpsCenterRef.current) return;
    pendingInitialGpsCenterRef.current = false;
    const id = setTimeout(() => {
      mapRef.current?.animateToRegion(
        {
          latitude: localizacao.latitude,
          longitude: localizacao.longitude,
          latitudeDelta: localizacao.latitudeDelta,
          longitudeDelta: localizacao.longitudeDelta,
        },
        420,
      );
    }, 180);
    return () => clearTimeout(id);
  }, [
    loading,
    locationReady,
    localizacao.latitude,
    localizacao.longitude,
    localizacao.latitudeDelta,
    localizacao.longitudeDelta,
  ]);

  const getMarkerColor = (tipo: PontoInteresse['tipo']): string => {
    if (categoriaSelecionada === EXPLORE_COMMUNITIES_CHIP_ID) {
      return '#0891b2';
    }
    if (categoriaSelecionada === EXPLORE_PARTNER_STORES_CHIP_ID) {
      return '#b45309';
    }
    return AppColors.categoria[tipo] || AppColors.primary;
  };

  const clearActiveRoute = useCallback(() => {
    setActiveRoute(null);
    setRouteDestName('');
    setRouteLoading(false);
    mapRef.current?.clearRoute();
  }, []);

  const handleRequestDirections = useCallback(
    async (ponto: PontoInteresse) => {
      setRouteLoading(true);
      setRouteDestName(ponto.titulo);
      setActiveRoute(null);
      try {
        const origin = {
          latitude: searchOrigin.latitude,
          longitude: searchOrigin.longitude,
        };
        const result = await getDirectionsRoute(
          [origin.longitude, origin.latitude],
          [ponto.longitude, ponto.latitude],
          'driving',
        );
        setActiveRoute(result);
        mapRef.current?.setRoute({
          coordinates: result.coordinates,
          origin,
          destination: {
            latitude: ponto.latitude,
            longitude: ponto.longitude,
            title: ponto.titulo,
          },
        });
        const region = regionFromRouteCoordinates(result.coordinates);
        mapRef.current?.animateToRegion(region, 650);
      } catch {
        Alert.alert(
          'Rota',
          'Não foi possível traçar o caminho agora. Tente novamente em instantes.',
        );
        clearActiveRoute();
      } finally {
        setRouteLoading(false);
      }
    },
    [clearActiveRoute, searchOrigin.latitude, searchOrigin.longitude],
  );

  useEffect(() => {
    if (loading || traceRoute !== '1') return;
    if (typeof focusLat !== 'string' || typeof focusLng !== 'string') return;
    const lat = Number(focusLat);
    const lng = Number(focusLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (Platform.OS !== 'web' && !locationReady) return;

    const key = typeof routeKey === 'string' && routeKey.trim() ? routeKey : `${focusLat}|${focusLng}`;
    if (appliedRouteKeyRef.current === key) return;
    appliedRouteKeyRef.current = key;

    const label =
      typeof focusLabel === 'string' && focusLabel.trim() ? focusLabel.trim() : 'Destino';
    const address =
      typeof focusAddress === 'string' && focusAddress.trim()
        ? focusAddress.trim()
        : 'Endereço selecionado';

    void handleRequestDirections({
      id: `focus-${focusLat}|${focusLng}`,
      titulo: label,
      descricao: address,
      latitude: lat,
      longitude: lng,
      tipo: 'turismo',
      formattedAddress: address,
    });
  }, [
    loading,
    locationReady,
    traceRoute,
    routeKey,
    focusLat,
    focusLng,
    focusLabel,
    focusAddress,
    handleRequestDirections,
  ]);

  const handleMarkerPress = useCallback((ponto: PontoInteresse) => {
    setSelectedPontoDetail(ponto);
    if (ponto.id.startsWith('cnes-') || ponto.photoUrl?.trim()) return;
    void enrichPontosWithPhotos([ponto]).then((enriched) => {
      const withPhoto = enriched[0];
      if (!withPhoto?.photoUrl?.trim()) return;
      setSelectedPontoDetail((current) =>
        current?.id === withPhoto.id
          ? {
              ...current,
              photoUrl: withPhoto.photoUrl,
              photoUrls: withPhoto.photoUrl
                ? Array.from(new Set([...(current.photoUrls ?? []), withPhoto.photoUrl]))
                : current.photoUrls,
            }
          : current,
      );
      setPontos((prev) =>
        prev.map((item) =>
          item.id === withPhoto.id
            ? {
                ...item,
                photoUrl: withPhoto.photoUrl,
                photoUrls: withPhoto.photoUrl
                  ? Array.from(new Set([...(item.photoUrls ?? []), withPhoto.photoUrl]))
                  : item.photoUrls,
              }
            : item,
        ),
      );
    });
  }, []);

  const handleRegionComplete = useCallback((region: Region) => {
    const clamp = (d: number) => Math.min(45, Math.max(0.0003, d));
    setMapRegion({
      ...region,
      latitudeDelta: clamp(region.latitudeDelta),
      longitudeDelta: clamp(region.longitudeDelta),
    });
  }, []);

  const markerVariant = useMemo((): MapMarkerVariant => {
    return mapRegion.latitudeDelta <= EXPLORE_CARD_MAX_LAT_DELTA ? 'card' : 'dot';
  }, [mapRegion.latitudeDelta]);

  useEffect(() => {
    if (healthLayer === '1') setHealthLayerOn(true);
  }, [healthLayer]);

  useEffect(() => {
    if (!healthLayerOn) return;
    let active = true;
    const loadHealthPontos = async () => {
      const items: CnesEstablishment[] = [];
      let offset = 0;
      let total = Number.POSITIVE_INFINITY;
      let sourceNote = '';
      while (offset < total && offset < 1000) {
        const page = await getCnesEstablishments({ limit: 50, offset });
        sourceNote = page.sourceNote;
        items.push(...page.items);
        total = page.total;
        if (page.items.length === 0) break;
        offset += page.items.length;
      }
      return { items, sourceNote };
    };
    loadHealthPontos()
      .then(({ items, sourceNote }) => {
        if (!active) return;
        setHealthPontos(
          items
            .filter((item) => item.latitude != null && item.longitude != null)
            .map((item) => ({
              id: `cnes-${item.cnes}`,
              titulo: item.name,
              descricao: `${item.typeName}. Dados abertos do Ministério da Saúde. Este ponto não é agendamento do ROTA.`,
              latitude: item.latitude as number,
              longitude: item.longitude as number,
              tipo: 'saude' as const,
              formattedAddress: item.address ?? undefined,
              telefone: item.phone ?? undefined,
              markerColor: cnesMarkerColor(item.kind),
              about: sourceNote,
            })),
        );
      })
      .catch(() => {
        if (active) setHealthPontos([]);
      });
    return () => {
      active = false;
    };
  }, [healthLayerOn]);

  useEffect(() => {
    if (Platform.OS === 'web' || !locationReady || catalogStartedRef.current) return;
    catalogStartedRef.current = true;
    let active = true;
    const origin = searchOrigin;
    const radius = city.placesSearchRadiusMeters || NEARBY_PLACES_RADIUS_METERS;
    const pos: [number, number] = [origin.longitude, origin.latitude];
    const buckets: PontoInteresse[][] = [[], [], [], [], []];
    const publish = () => {
      if (!active) return;
      setCatalogPontos(dedupePontos(buckets.flat()));
    };

    async function loadPlaces(): Promise<PontoInteresse[]> {
      const types = Object.keys(FILTER_CHIP_TO_PLACE_TYPE);
      const groups: PontoInteresse[][] = [];
      for (let index = 0; index < types.length; index += 2) {
        const chunk = types.slice(index, index + 2);
        const loaded = await Promise.all(
          chunk.map(async (type) => {
            try {
              const places = await searchNearbyPlaces(type, pos, radius, ALL_MAP_PER_CATEGORY);
              return places.map((place) => paintMarker(placeToPonto(place, type), type));
            } catch {
              return [];
            }
          }),
        );
        groups.push(...loaded);
        buckets[0] = groups.flat();
        publish();
      }
      return groups.flat();
    }

    void Promise.all([
      loadPlaces(),
      listPublicServiceProviders({ init: 0, end: 200 })
        .then((rows) =>
          nearestMapPontos(
            rows
              .map(serviceProviderToMapPonto)
              .filter((ponto): ponto is PontoInteresse => ponto != null),
            origin,
            radius,
            ALL_MAP_PER_CATEGORY,
            false,
          ),
        )
        .then((rows) => {
          buckets[1] = rows;
          publish();
          return rows;
        })
        .catch(() => [] as PontoInteresse[]),
      loadPartnerStoresForMap()
        .then((rows) =>
          nearestMapPontos(
            rows.map((ponto) => paintMarker(ponto, EXPLORE_PARTNER_STORES_CHIP_ID)),
            origin,
            radius,
            ALL_MAP_PER_CATEGORY,
            false,
          ),
        )
        .then((rows) => {
          buckets[2] = rows;
          publish();
          return rows;
        })
        .catch(() => [] as PontoInteresse[]),
      listForumCommunities(undefined, { init: 0, end: 200 })
        .then((rows) =>
          nearestMapPontos(
            rows
              .map(communityToExplorePonto)
              .filter((ponto): ponto is PontoInteresse => ponto != null)
              .map((ponto) => paintMarker(ponto, EXPLORE_COMMUNITIES_CHIP_ID)),
            origin,
            radius,
            ALL_MAP_PER_CATEGORY,
            false,
          ),
        )
        .then((rows) => {
          buckets[3] = rows;
          publish();
          return rows;
        })
        .catch(() => [] as PontoInteresse[]),
      getEvents({ status: 'published', init: 0, end: 100 })
        .then((rows) =>
          nearestMapPontos(
            rows
              .map(eventToMapPonto)
              .filter((ponto): ponto is PontoInteresse => ponto != null),
            origin,
            radius,
            ALL_MAP_PER_CATEGORY,
            false,
          ),
        )
        .then((rows) => {
          buckets[4] = rows;
          publish();
          return rows;
        })
        .catch(() => [] as PontoInteresse[]),
    ]).then(([places, providers, partners, communities, events]) => {
      if (!active) return;
      buckets[0] = places;
      buckets[1] = providers;
      buckets[2] = partners;
      buckets[3] = communities;
      buckets[4] = events;
      publish();
    });

    return () => {
      active = false;
    };
    // A carga inicial usa a posição do momento em que o GPS fica pronto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationReady]);

  const pontosForMap = useMemo(() => {
    const filtered = categoriaSelecionada != null;
    const base = filtered ? (filterLoading ? [] : mapPontosForView) : catalogPontos;
    if (!healthLayerOn) return base;
    const ids = new Set(base.map((ponto) => ponto.id));
    return [...base, ...healthPontos.filter((ponto) => !ids.has(ponto.id))];
  }, [
    catalogPontos,
    categoriaSelecionada,
    filterLoading,
    healthLayerOn,
    healthPontos,
    mapPontosForView,
  ]);

  const handleUserDragMap = useCallback(() => {
    setShowDragHint(false);
  }, []);

  const handleCenterUser = useCallback(async () => {
    if (city.fixedMapCenter) {
      const region: Region = {
        latitude: city.latitude,
        longitude: city.longitude,
        latitudeDelta: mapRegion.latitudeDelta,
        longitudeDelta: mapRegion.longitudeDelta,
      };
      setLocalizacao(region);
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 500);
      return;
    }

    try {
      const ok = await ensureForegroundLocationPermission();
      if (!ok) {
        Alert.alert('Localização', 'Permita o acesso à localização para centralizar o mapa.');
        return;
      }
      const pos = await getCurrentPositionWithRetry({
        accuracy: Location.Accuracy.Highest,
      });
      const region: Region = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: mapRegion.latitudeDelta,
        longitudeDelta: mapRegion.longitudeDelta,
      };
      const nextLoc: Localizacao = {
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };
      setLocalizacao(nextLoc);
      setMapRegion(region);
      setLocationReady(true);
      setLocationError(null);
      hadLocationErrorRef.current = false;
      lastGpsAtRef.current = Date.now();
      mapRef.current?.animateToRegion(region, 500);
    } catch {
      Alert.alert('Mapa', 'Não foi possível obter sua localização.');
    }
  }, [city.fixedMapCenter, city.latitude, city.longitude, mapRegion.latitudeDelta, mapRegion.longitudeDelta]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomBy(1, 220);
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomBy(-1, 220);
  }, []);

  const handleReport = useCallback((type: ReportType) => {
    setPrefeituraAssuntoInicial(REPORT_SUBJECT_BY_TYPE[type]);
    setPrefeituraModalVisible(true);
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: AppColors.background.default }]}>
        <ScrollView style={[styles.webContainer, { backgroundColor: AppColors.background.default }]}>
          <View style={styles.webHeader}>
            <Ionicons name="compass-outline" size={32} color={AppColors.primary} />
            <Text style={styles.webTitle}>Pontos de Interesse - {city.cityName}</Text>
            <Text style={styles.webSubtitle}>
              {traceRoute === '1' && typeof focusLat === 'string' && typeof focusLng === 'string'
                ? 'A rota abriu aqui no Explorar. No celular, o caminho aparece traçado no mapa.'
                : typeof focusLat === 'string' && typeof focusLng === 'string'
                  ? 'A localização abriu aqui no Explorar. No celular, o mapa centraliza neste ponto.'
                  : 'O mapa interativo está disponível apenas em dispositivos móveis. Use o app no celular para visualizar o mapa completo.'}
            </Text>
          </View>
          {traceRoute === '1' && (routeLoading || activeRoute) ? (
            <View style={styles.webRouteCard}>
              {routeLoading ? (
                <View style={styles.routeLoadingRow}>
                  <ActivityIndicator color={AppColors.tab.active} />
                  <Text style={styles.routeLoadingText}>Traçando caminho…</Text>
                </View>
              ) : activeRoute ? (
                <>
                  <Text style={styles.routeTitle} numberOfLines={1}>
                    {routeDestName || 'Destino'}
                  </Text>
                  <View style={styles.routeMetaRow}>
                    <View style={styles.routeMetaItem}>
                      <Ionicons name="time-outline" size={16} color="#6d28d9" />
                      <Text style={styles.routeMetaValue}>
                        {formatRouteDuration(activeRoute.durationSeconds)}
                      </Text>
                    </View>
                    <View style={styles.routeMetaItem}>
                      <Ionicons name="navigate-outline" size={16} color="#6d28d9" />
                      <Text style={styles.routeMetaValue}>
                        {formatRouteDistance(activeRoute.distanceMeters)}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
          <View style={styles.pontosList}>
            {pontos.map((ponto) => (
              <View key={ponto.id} style={styles.pontoCard}>
                <View style={[styles.pontoIndicator, { backgroundColor: getMarkerColor(ponto.tipo) }]} />
                <View style={styles.pontoContent}>
                  <Text style={styles.pontoTitulo}>{ponto.titulo}</Text>
                  <Text style={styles.pontoDescricao}>{ponto.descricao}</Text>
                  <View style={styles.pontoCoords}>
                  <Ionicons name="location-outline" size={14} color={AppColors.text.tertiary} />
                    <Text style={styles.pontoCoordText}>
                      {ponto.latitude.toFixed(4)}, {ponto.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: AppColors.background.default }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Obtendo sua localização…</Text>
      </View>
    );
  }

  if (!locationReady && locationError != null && !city.fixedMapCenter) {
    const msg =
      locationError === 'denied'
        ? 'Ative a localização nas configurações para ver o mapa na sua posição.'
        : 'Não foi possível obter sua posição. Verifique o GPS ou tente novamente.';
    return (
      <View style={[styles.centerContainer, { backgroundColor: AppColors.background.default, paddingHorizontal: 24 }]}>
        <Ionicons name="location-outline" size={48} color={AppColors.primary} />
        <Text style={styles.locationErrorTitle}>Localização necessária</Text>
        <Text style={styles.locationErrorText}>{msg}</Text>
        <Pressable
          style={styles.locationRetryBtn}
          onPress={() => void solicitarPermissaoLocalizacao({ force: true })}
        >
          <Text style={styles.locationRetryBtnText}>Tentar novamente</Text>
        </Pressable>
        <Pressable style={styles.locationSettingsBtn} onPress={() => void Linking.openSettings()}>
          <Text style={styles.locationSettingsBtnText}>Abrir configurações</Text>
        </Pressable>
      </View>
    );
  }

  const hasRouteUi = routeLoading || activeRoute != null;
  const mapControlsBottom = tabBarHeight + 12 + (hasRouteUi ? 96 : 0);
  const reportButtonBottom = 20 + (hasRouteUi ? 96 : 0);

  return (
    <View style={[styles.container, { backgroundColor: AppColors.background.default }]}>
      <MapLibreMapaView
        ref={mapRef}
        localizacao={localizacao}
        pontos={pontosForMap}
        boundary={null}
        viewMode="3d"
        markerVariant={markerVariant}
        markersLayerKey={markersLayerKey}
        getMarkerColor={getMarkerColor}
        onRegionChangeComplete={handleRegionComplete}
        onUserDragMap={handleUserDragMap}
        onMarkerPress={handleMarkerPress}
      />
      {showDragHint && !hasRouteUi && (
        <View
          pointerEvents="none"
          style={[styles.dragHintWrap, { bottom: mapControlsBottom + 68 }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.dragHintPill}>
            <Ionicons name="hand-left-outline" size={22} color={AppColors.text.white} />
            <Text style={styles.dragHintText}>Arraste para mover o mapa</Text>
          </View>
        </View>
      )}
      <View
        pointerEvents="box-none"
        style={[styles.overlay, { paddingTop: insets.top + 8 }]}
      >
        <ExploreFloatingCard
          activeItemId={categoriaSelecionada}
          onSelectQuickAccess={(id) => {
            clearActiveRoute();
            void applyFilterChip(id);
          }}
          filterLoading={filterLoading || routeLoading}
          hasNotifications={unreadCount > 0}
        />
      </View>
      <ExploreMapControls
        bottomOffset={mapControlsBottom}
        onCenterUser={handleCenterUser}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
      <ReportButton onReport={handleReport} bottomOffset={reportButtonBottom} />
      {hasRouteUi ? (
        <View
          style={[
            styles.routePanel,
            { paddingBottom: Math.max(insets.bottom, 12) + tabBarHeight * 0.15 },
          ]}
        >
          {routeLoading ? (
            <View style={styles.routeLoadingRow}>
              <ActivityIndicator color={AppColors.tab.active} />
              <Text style={styles.routeLoadingText}>Traçando caminho…</Text>
            </View>
          ) : activeRoute ? (
            <>
              <Text style={styles.routeTitle} numberOfLines={1}>
                {routeDestName || 'Destino'}
              </Text>
              <View style={styles.routeMetaRow}>
                <View style={styles.routeMetaItem}>
                  <Ionicons name="time-outline" size={16} color="#6d28d9" />
                  <Text style={styles.routeMetaValue}>
                    {formatRouteDuration(activeRoute.durationSeconds)}
                  </Text>
                </View>
                <View style={styles.routeMetaItem}>
                  <Ionicons name="navigate-outline" size={16} color="#6d28d9" />
                  <Text style={styles.routeMetaValue}>
                    {formatRouteDistance(activeRoute.distanceMeters)}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
          <TouchableOpacity style={styles.routeClearBtn} onPress={clearActiveRoute} activeOpacity={0.85}>
            <Text style={styles.routeClearText}>Limpar rota</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <ModalReportPrefeitura
        visible={prefeituraModalVisible}
        initialAssunto={prefeituraAssuntoInicial}
        onClose={() => {
          setPrefeituraModalVisible(false);
          setPrefeituraAssuntoInicial(undefined);
        }}
      />
      <PlaceDetailsSheet
        visible={selectedPontoDetail != null}
        ponto={selectedPontoDetail}
        userLng={searchOrigin.longitude}
        userLat={searchOrigin.latitude}
        bottomOffset={tabBarHeight}
        onClose={() => setSelectedPontoDetail(null)}
        onRequestDirections={(ponto) => void handleRequestDirections(ponto)}
      />
      <Toast
        key={toastKey}
        message={toastMessage}
        visible={showToast}
        type={toastType}
        duration={3000}
        onHide={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  dragHintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  dragHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  dragHintText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.text.tertiary,
  },
  locationErrorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  locationErrorText: {
    marginTop: 10,
    fontSize: 15,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  locationRetryBtn: {
    marginTop: 24,
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  locationRetryBtnText: {
    color: AppColors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  locationSettingsBtn: {
    marginTop: 12,
    paddingVertical: 12,
  },
  locationSettingsBtnText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  routePanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 60,
  },
  routeLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeLoadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  routeMetaRow: {
    flexDirection: 'row',
    gap: 18,
  },
  routeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeMetaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4c1d95',
  },
  routeClearBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  routeClearText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.tab.active,
  },
  webContainer: {
    flex: 1,
  },
  webHeader: {
    backgroundColor: AppColors.background.default,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  webSubtitle: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  webRouteCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pontosList: {
    padding: 16,
  },
  pontoCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pontoIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  pontoContent: {
    flex: 1,
  },
  pontoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginBottom: 4,
  },
  pontoDescricao: {
    fontSize: 14,
    color: AppColors.text.tertiary,
    marginBottom: 8,
  },
  pontoCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pontoCoordText: {
    fontSize: 12,
    color: AppColors.text.quaternary,
  },
  controles: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 12,
  },
  botaoControle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  botaoTexto: {
    color: AppColors.text.white,
    fontSize: 14,
    fontWeight: '600',
  },
  legenda: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    backgroundColor: AppColors.background.default,
    padding: 12,
    borderRadius: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  legendaTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginBottom: 8,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  legendaCor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendaTexto: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
});