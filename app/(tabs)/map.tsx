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
import { EXPLORE_MAP_MAX_MARKERS } from '@/constants/exploreMap';
import { AppColors } from '@/constants/theme';
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
import { enrichPontosWithPhotos } from '@/services/placePhotoService';
import { searchNearbyPlaces } from '@/services/placesService';
import type { Region } from '@/types';
import { Localizacao, PontoInteresse } from '@/types';
import { EXPLORE_GPS_STALE_MS } from '@/utils/appRefreshPolicy';
import {
    EXPLORE_PARTNER_STORES_CHIP_ID,
    loadPartnerStoresForMap,
} from '@/utils/commercialStoreMap';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
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
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MARICA_CENTER = {
  latitude: -22.9189,
  longitude: -42.8186,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MAP_LOCATION_WATCH_DISTANCE_METERS = 15;
const MAP_LOCATION_WATCH_TIME_MS = 5000;
/** Cards até zoom de bairro/rua; acima disso usa dots leves (estáveis no Fabric). */
const EXPLORE_CARD_MAX_LAT_DELTA = 0.058;

const FILTER_CHIP_TO_PLACE_TYPE: Record<string, string> = {
  restaurant: 'restaurant',
  fast_food: 'fast_food',
  bakery: 'bakery',
  bar: 'bar',
  cafe: 'cafe',
  pharmacy: 'pharmacy',
  atm: 'atm',
  market: 'market',
  supermarket: 'supermarket',
  prestador: 'gas_station',
  gym: 'gym',
  park: 'park',
  school: 'school',
  hotel: 'hotel',
  hospital: 'hospital',
  shopping_center: 'shopping_center',
  bank: 'bank',
};

const CHIP_LABELS: Record<string, string> = {
  restaurant: 'Restaurantes',
  fast_food: 'Fast-food',
  bakery: 'Padarias',
  bar: 'Bares',
  cafe: 'Cafés',
  pharmacy: 'Farmácias',
  atm: 'Caixas',
  market: 'Mercados',
  supermarket: 'Supermercados',
  prestador: 'Prestadores',
  gym: 'Academias',
  park: 'Parques',
  school: 'Escolas',
  hotel: 'Hotéis',
  hospital: 'Hospital',
  shopping_center: 'Shopping Center',
  bank: 'Bancos',
  communities: 'Comunidades',
  partner_stores: 'Lojas parceiras',
};

function routeParamToChipId(raw: string): string | undefined {
  const alias: Record<string, string> = {
    gas_station: 'prestador',
    shopping: 'shopping_center',
    shopping_mall: 'shopping_center',
  };
  const chip = alias[raw] ?? raw;
  if (chip === EXPLORE_COMMUNITIES_CHIP_ID) return chip;
  if (chip === EXPLORE_PARTNER_STORES_CHIP_ID) return chip;
  return FILTER_CHIP_TO_PLACE_TYPE[chip] ? chip : undefined;
}

export default function MapScreen() {
  const { unreadCount } = useNotificationUnreadCount();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const mapRef = useRef<MapLibreMapaViewRef | null>(null);
  const [localizacao, setLocalizacao] = useState<Localizacao>(MARICA_CENTER);
  const [mapRegion, setMapRegion] = useState<Region>(() => ({
    ...MARICA_CENTER,
  }));
  const [loading, setLoading] = useState<boolean>(true);
  const [locationReady, setLocationReady] = useState(false);
  const [locationError, setLocationError] = useState<'denied' | 'error' | null>(null);
  const [pontos, setPontos] = useState<PontoInteresse[]>([]);
  const [mapPontosForView, setMapPontosForView] = useState<PontoInteresse[]>([]);
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
  const { category } = useLocalSearchParams<{ category?: string }>();
  const appliedCategoryFromRoute = useRef(false);
  const pendingInitialGpsCenterRef = useRef(false);
  const lastGpsAtRef = useRef(0);
  const locationReadyRef = useRef(false);
  const hadLocationErrorRef = useRef(false);
  const filterRequestSeqRef = useRef(0);

  useEffect(() => {
    locationReadyRef.current = locationReady;
  }, [locationReady]);

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
              latitudeDelta: 0.018,
              longitudeDelta: 0.018,
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
    [applyGpsCoords, shouldSkipGpsRefresh],
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        setLoading(false);
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
    }, [applyGpsCoords, solicitarPermissaoLocalizacao]),
  );

  const publishMapPontos = useCallback((items: PontoInteresse[]) => {
    setMapPontosForView(items.slice(0, EXPLORE_MAP_MAX_MARKERS));
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
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
        const pos: [number, number] = [localizacao.longitude, localizacao.latitude];
        const places = await searchNearbyPlaces(placeType, pos, undefined, 20);
        if (isStale()) return;
        const basePontos = places.map((p) => placeToPonto(p, placeType));
        setPontos(basePontos);
        publishMapPontos(basePontos);
        setCategoriaSelecionada(chipId);
        const label = CHIP_LABELS[chipId] ?? chipId;
        setToastType(places.length > 0 ? 'success' : 'info');
        setToastMessage(
          places.length > 0
            ? `${places.length} ${label.toLowerCase()} encontrados.`
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
          Alert.alert('Erro', 'Não foi possível buscar locais próximos.');
        }
      } finally {
        if (!isStale()) {
          setFilterLoading(false);
        }
      }
    },
    [categoriaSelecionada, localizacao.latitude, localizacao.longitude, publishMapPontos],
  );

  useEffect(() => {
    if (loading || Platform.OS === 'web' || !locationReady) return;
    if (!category || typeof category !== 'string') return;
    const chip = routeParamToChipId(category);
    if (!chip || appliedCategoryFromRoute.current) return;
    appliedCategoryFromRoute.current = true;
    void applyFilterChip(chip);
  }, [loading, locationReady, category, applyFilterChip]);

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

  const handleMarkerPress = useCallback((ponto: PontoInteresse) => {
    setSelectedPontoDetail(ponto);
    if (ponto.photoUrl?.trim()) return;
    void enrichPontosWithPhotos([ponto]).then((enriched) => {
      const withPhoto = enriched[0];
      if (!withPhoto?.photoUrl?.trim()) return;
      setSelectedPontoDetail((current) =>
        current?.id === withPhoto.id ? { ...current, photoUrl: withPhoto.photoUrl } : current,
      );
      setPontos((prev) =>
        prev.map((item) =>
          item.id === withPhoto.id ? { ...item, photoUrl: withPhoto.photoUrl } : item,
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

  const pontosForMap = filterLoading ? [] : mapPontosForView;

  const handleUserDragMap = useCallback(() => {
    setShowDragHint(false);
  }, []);

  const handleCenterUser = useCallback(async () => {
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
  }, [mapRegion.latitudeDelta, mapRegion.longitudeDelta]);

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
            <Text style={styles.webTitle}>Pontos de Interesse - Maricá</Text>
            <Text style={styles.webSubtitle}>
              O mapa interativo está disponível apenas em dispositivos móveis.
              Use o app no celular para visualizar o mapa completo.
            </Text>
          </View>
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

  if (!locationReady && locationError != null) {
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

  const mapControlsBottom = tabBarHeight + 12;
  const reportButtonBottom = 20;

  return (
    <View style={[styles.container, { backgroundColor: AppColors.background.default }]}>
      <MapLibreMapaView
        ref={mapRef}
        localizacao={localizacao}
        pontos={pontosForMap}
        markerVariant={markerVariant}
        markersLayerKey={markersLayerKey}
        getMarkerColor={getMarkerColor}
        onRegionChangeComplete={handleRegionComplete}
        onUserDragMap={handleUserDragMap}
        onMarkerPress={handleMarkerPress}
      />
      {showDragHint && (
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
          onSelectQuickAccess={(id) => void applyFilterChip(id)}
          filterLoading={filterLoading}
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
        userLng={localizacao.longitude}
        userLat={localizacao.latitude}
        onClose={() => setSelectedPontoDetail(null)}
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