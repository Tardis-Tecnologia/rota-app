import GuiaProviderCard from '@/components/guia/GuiaProviderCard';
import MapLibreMapaView, { type MapLibreMapaViewRef } from '@/components/MapLibreMapaView';
import { GUIA_MAP_MAX_MARKERS } from '@/constants/guiaMap';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useGuiaCompanies } from '@/hooks/useGuiaCompanies';
import { useGuiaProviders } from '@/hooks/useGuiaProviders';
import {
    filterAndSortGuia,
    guiaProfileToPonto,
    type GuiaListItem,
    type GuiaTab,
} from '@/services/guiaCatalog';
import {
    ensureForegroundLocationPermission,
    getCurrentPositionWithRetry,
} from '@/services/locationPermission';
import type { Localizacao, PontoInteresse } from '@/types';
import { EXPLORE_GPS_STALE_MS } from '@/utils/appRefreshPolicy';
import { useWhitelabelCity, useWhitelabelMapCenter } from '@/hooks/useWhitelabelCity';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    type LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAP_LOCATION_WATCH_DISTANCE_METERS = 15;
const MAP_LOCATION_WATCH_TIME_MS = 5000;
const GUIA_MAP_ZOOM_DELTA = 0.04;
/** Faixa de mapa que continua visível quando a lista está aberta. */
const MAP_STRIP = 96;
const SHEET_SPRING = {
  damping: 26,
  stiffness: 280,
  mass: 0.72,
  overshootClamping: false as const,
  restDisplacementThreshold: 0.4,
  restSpeedThreshold: 0.4,
};

function sheetSnaps(height: number) {
  const travel = Math.max(height - MAP_STRIP, 320);
  const mapSheet = Math.min(340, Math.max(250, Math.round(height * 0.4)));
  const splitSheet = Math.min(
    travel - 24,
    Math.max(mapSheet + 96, Math.round(height * 0.72)),
  );
  return {
    travel,
    mapTranslate: Math.max(0, travel - mapSheet),
    splitTranslate: Math.max(0, Math.min(travel - mapSheet, travel - splitSheet)),
  };
}

function clampSheet(next: number, max: number) {
  'worklet';
  if (next < 0) return next * 0.2;
  if (next > max) return max + (next - max) * 0.2;
  return next;
}

function pickSnap(
  current: number,
  velocityY: number,
  split: number,
  map: number,
  origin: number,
) {
  'worklet';
  const points = [0, split, map];
  const delta = current - origin;
  if (velocityY < -1100) return 0;
  if (velocityY > 1100) return map;
  if (delta < -28 || velocityY < -420) {
    for (let i = points.length - 1; i >= 0; i -= 1) {
      if (points[i] < origin - 4) return points[i];
    }
    return 0;
  }
  if (delta > 28 || velocityY > 420) {
    for (let i = 0; i < points.length; i += 1) {
      if (points[i] > origin + 4) return points[i];
    }
    return map;
  }
  let best = points[0];
  let bestDist = Math.abs(origin - best);
  for (let i = 1; i < points.length; i += 1) {
    const dist = Math.abs(origin - points[i]);
    if (dist < bestDist) {
      best = points[i];
      bestDist = dist;
    }
  }
  return best;
}

const INITIAL_SNAPS = sheetSnaps(Math.max(Dimensions.get('window').height - 160, 520));

export default function GuiaIndexScreen() {
  const { user } = useAuth();
  const { cadastroStatus } = useLocalSearchParams<{ cadastroStatus?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<GuiaTab>('prestadores');
  const city = useWhitelabelCity();
  const cityMapCenter = useWhitelabelMapCenter();
  const [localizacao, setLocalizacao] = useState<Localizacao>(() => ({
    ...cityMapCenter,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  }));
  const [mapRegion, setMapRegion] = useState<Localizacao>(() => ({
    ...cityMapCenter,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  }));
  const [locationReady, setLocationReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(INITIAL_SNAPS.travel);
  const [showAreaSearch, setShowAreaSearch] = useState(false);
  const [controlsInteractive, setControlsInteractive] = useState(true);
  const mapRef = useRef<MapLibreMapaViewRef | null>(null);
  const pendingInitialGpsCenterRef = useRef(false);
  const lastGpsAtRef = useRef(0);
  const locationReadyRef = useRef(false);
  const hadLocationErrorRef = useRef(false);
  const placedRef = useRef(false);
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(INITIAL_SNAPS.splitTranslate);
  const mapSnap = useSharedValue(INITIAL_SNAPS.mapTranslate);
  const splitSnap = useSharedValue(INITIAL_SNAPS.splitTranslate);
  const sheetTravel = useSharedValue(INITIAL_SNAPS.travel);
  const dragOrigin = useSharedValue(0);
  const dragging = useSharedValue(0);
  const areaDirty = useSharedValue(0);

  const sheetPan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .failOffsetX([-24, 24])
        .onStart(() => {
          'worklet';
          dragOrigin.value = translateY.value;
          dragging.value = 1;
        })
        .onUpdate((event) => {
          'worklet';
          translateY.value = clampSheet(dragOrigin.value + event.translationY, mapSnap.value);
        })
        .onEnd((event) => {
          'worklet';
          dragging.value = 0;
          const dest = pickSnap(
            translateY.value,
            event.velocityY,
            splitSnap.value,
            mapSnap.value,
            dragOrigin.value,
          );
          translateY.value = withSpring(dest, SHEET_SPRING);
        }),
    [dragOrigin, dragging, mapSnap, splitSnap, translateY],
  );

  useAnimatedReaction(
    () => areaDirty.value === 1 && translateY.value > splitSnap.value + 28,
    (show, prev) => {
      if (show !== prev) runOnJS(setShowAreaSearch)(show);
    },
  );

  useAnimatedReaction(
    () => translateY.value > 64,
    (show, prev) => {
      if (show !== prev) runOnJS(setControlsInteractive)(show);
    },
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [36, 120], [0, 1], Extrapolation.CLAMP),
  }));

  const searchPillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [splitSnap.value + 8, splitSnap.value + 56],
      [0, areaDirty.value],
      Extrapolation.CLAMP,
    ),
    bottom: sheetTravel.value - translateY.value + 14,
  }));

  const onStageLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (height < 240) return;
      const snaps = sheetSnaps(height);
      const prevMap = mapSnap.value;
      const prevSplit = splitSnap.value;
      const current = translateY.value;
      mapSnap.value = snaps.mapTranslate;
      splitSnap.value = snaps.splitTranslate;
      sheetTravel.value = snaps.travel;
      setSheetHeight((prev) => (prev === snaps.travel ? prev : snaps.travel));
      if (!placedRef.current) {
        placedRef.current = true;
        translateY.value = snaps.splitTranslate;
        return;
      }
      if (dragging.value === 1) return;
      const candidates = [
        { prev: 0, next: 0 },
        { prev: prevSplit, next: snaps.splitTranslate },
        { prev: prevMap, next: snaps.mapTranslate },
      ];
      let best = candidates[0];
      let bestDist = Math.abs(current - best.prev);
      for (const candidate of candidates) {
        const dist = Math.abs(current - candidate.prev);
        if (dist < bestDist) {
          best = candidate;
          bestDist = dist;
        }
      }
      if (Math.abs(current - best.next) > 0.5) translateY.value = best.next;
    },
    [dragging, mapSnap, sheetTravel, splitSnap, translateY],
  );

  const companiesEnabled = activeTab === 'empresas';

  const {
    items: providerItems,
    loading: providersLoading,
    error: providersError,
    reloadIfStale: reloadProvidersIfStale,
  } = useGuiaProviders(true, user?.id);

  const {
    items: companyItems,
    loading: companiesLoading,
    loadingMore,
    loadingCategoryLabel,
    error: companiesError,
    hasMore: companiesHasMore,
    loadMore: loadMoreCompanies,
    reloadIfStale: reloadCompaniesIfStale,
  } = useGuiaCompanies(companiesEnabled, mapRegion, searchQuery);

  const individualItems = useMemo(
    () => providerItems.filter((item) => item.type !== 'COMPANY'),
    [providerItems],
  );
  const registeredCompanies = useMemo(
    () => providerItems.filter((item) => item.type === 'COMPANY'),
    [providerItems],
  );
  const catalogItems =
    activeTab === 'prestadores'
      ? individualItems
      : [...registeredCompanies, ...companyItems];
  const listLoading =
    activeTab === 'prestadores'
      ? providersLoading
      : companiesLoading && registeredCompanies.length === 0 && companyItems.length === 0;
  const listError = activeTab === 'prestadores' ? providersError : companiesError;
  const userCoords = useMemo(
    () => {
      if (city.fixedMapCenter) {
        return { latitude: city.latitude, longitude: city.longitude };
      }
      return locationReady
        ? { latitude: localizacao.latitude, longitude: localizacao.longitude }
        : null;
    },
    [city.fixedMapCenter, city.latitude, city.longitude, locationReady, localizacao.latitude, localizacao.longitude],
  );
  const searchOrigin = useMemo((): { latitude: number; longitude: number } | null => {
    // Centra busca/ordenação no mapa (permite arrastar e pesquisar a região).
    if (mapRegion?.latitude != null && mapRegion?.longitude != null) {
      return { latitude: mapRegion.latitude, longitude: mapRegion.longitude };
    }
    return userCoords;
  }, [mapRegion.latitude, mapRegion.longitude, userCoords]);

  useEffect(() => {
    locationReadyRef.current = locationReady;
  }, [locationReady]);

  const applyCityAnchor = useCallback(() => {
    const next: Localizacao = {
      latitude: city.latitude,
      longitude: city.longitude,
      latitudeDelta: GUIA_MAP_ZOOM_DELTA,
      longitudeDelta: GUIA_MAP_ZOOM_DELTA,
    };
    setLocalizacao(next);
    setMapRegion(next);
    pendingInitialGpsCenterRef.current = true;
    setLocationReady(true);
    hadLocationErrorRef.current = false;
    lastGpsAtRef.current = Date.now();
    setLocating(false);
  }, [city.latitude, city.longitude]);

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
      const next: Localizacao = {
        latitude,
        longitude,
        latitudeDelta: GUIA_MAP_ZOOM_DELTA,
        longitudeDelta: GUIA_MAP_ZOOM_DELTA,
      };
      setLocalizacao(next);
      if (centerMap) {
        pendingInitialGpsCenterRef.current = true;
        setMapRegion(next);
      }
      setLocationReady(true);
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
        setLocating(false);
        return;
      }

      const showBlockingLoader = !locationReadyRef.current;
      if (showBlockingLoader) {
        setLocating(true);
      }

      try {
        const ok = await ensureForegroundLocationPermission();
        if (!ok) {
          hadLocationErrorRef.current = true;
          return;
        }

        const location = await getCurrentPositionWithRetry({
          accuracy: Location.Accuracy.Balanced,
        });
        applyGpsCoords(location.coords.latitude, location.coords.longitude, { centerMap: true });
      } catch {
        hadLocationErrorRef.current = true;
      } finally {
        setLocating(false);
      }
    },
    [applyCityAnchor, applyGpsCoords, city.fixedMapCenter, shouldSkipGpsRefresh],
  );

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'prestadores') void reloadProvidersIfStale();
      else void reloadCompaniesIfStale();
    }, [activeTab, reloadProvidersIfStale, reloadCompaniesIfStale]),
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;

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

  useEffect(() => {
    if (Platform.OS === 'web' || !locationReady) return;
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
    locationReady,
    localizacao.latitude,
    localizacao.longitude,
    localizacao.latitudeDelta,
    localizacao.longitudeDelta,
  ]);

  const results = useMemo(
    () => filterAndSortGuia(activeTab, searchQuery, searchOrigin, catalogItems),
    [activeTab, searchQuery, searchOrigin, catalogItems],
  );

  const computedMapPoints = useMemo(
    () =>
      results
        .map(guiaProfileToPonto)
        .filter((p): p is PontoInteresse => p != null)
        .slice(0, GUIA_MAP_MAX_MARKERS),
    [results],
  );

  const [mapPointsForView, setMapPointsForView] = useState<PontoInteresse[]>([]);
  const mapPointsSignature = useMemo(
    () => computedMapPoints.map((ponto) => ponto.id).join('\u0001'),
    [computedMapPoints],
  );

  useEffect(() => {
    setMapPointsForView([]);
  }, [activeTab]);

  useEffect(() => {
    if (listLoading) return;
    let cancelled = false;
    const schedule =
      typeof requestIdleCallback === 'function'
        ? (cb: () => void) => {
            const id = requestIdleCallback(() => cb());
            return () => cancelIdleCallback(id);
          }
        : (cb: () => void) => {
            const id = setTimeout(cb, 0);
            return () => clearTimeout(id);
          };
    const cancel = schedule(() => {
      if (cancelled) return;
      setMapPointsForView((prev) => {
        const prevSignature = prev.map((ponto) => ponto.id).join('\u0001');
        if (prevSignature === mapPointsSignature) return prev;
        return computedMapPoints;
      });
    });
    return () => {
      cancelled = true;
      cancel();
    };
  }, [listLoading, mapPointsSignature, computedMapPoints]);

  useEffect(() => {
    if (cadastroStatus !== 'enviado') return;
    Alert.alert(
      'Cadastro efetivado com sucesso',
      'Aguarde retorno de aprovação do administrativo da Rota.',
      [{ text: 'OK', onPress: () => router.replace('/guia') }],
    );
  }, [cadastroStatus]);

  const handleMyLocation = useCallback(() => {
    if (locationReady) {
      const region: Localizacao = {
        latitude: localizacao.latitude,
        longitude: localizacao.longitude,
        latitudeDelta: GUIA_MAP_ZOOM_DELTA,
        longitudeDelta: GUIA_MAP_ZOOM_DELTA,
      };
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 320);
      return;
    }
    void solicitarPermissaoLocalizacao({ force: true });
  }, [
    locationReady,
    localizacao.latitude,
    localizacao.longitude,
    solicitarPermissaoLocalizacao,
  ]);

  const handleMapRegionChangeComplete = useCallback((region: Localizacao) => {
    setMapRegion((current) => {
      const moved =
        Math.abs(current.latitude - region.latitude) > 0.0001 ||
        Math.abs(current.longitude - region.longitude) > 0.0001 ||
        Math.abs(current.latitudeDelta - region.latitudeDelta) > 0.0001 ||
        Math.abs(current.longitudeDelta - region.longitudeDelta) > 0.0001;
      return moved ? region : current;
    });
  }, []);

  const openDetail = (item: GuiaListItem) => {
    router.push({
      pathname: '/guia/[id]',
      params: {
        id: item.id,
        ...(userCoords
          ? {
              originLat: String(userCoords.latitude),
              originLng: String(userCoords.longitude),
            }
          : {}),
      },
    });
  };

  const handleMarkerPress = (ponto: PontoInteresse) => {
    const item = results.find((r) => r.id === ponto.id);
    if (item) openDetail(item);
  };

  const goCadastroPrestador = () => {
    if (!user) {
      Alert.alert('Login necessário', 'Para se cadastrar como prestador, faça login no app.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Entrar', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (user.profile === 'VISITANTE') {
      Alert.alert(
        'Conta necessária',
        'Visitantes não podem enviar cadastro de prestador. Use uma conta cadastrada (cidadão).',
      );
      return;
    }
    router.push('/guia/cadastro-prestador');
  };

  const focusMap = useCallback(() => {
    if (dragging.value === 1) return;
    areaDirty.value = 1;
    if (Math.abs(translateY.value - mapSnap.value) < 12) return;
    translateY.value = withSpring(mapSnap.value, SHEET_SPRING);
  }, [areaDirty, dragging, mapSnap, translateY]);

  const focusList = useCallback(() => {
    if (dragging.value === 1) return;
    translateY.value = withSpring(0, SHEET_SPRING);
  }, [dragging, translateY]);

  const searchThisMapArea = useCallback(() => {
    areaDirty.value = 0;
    setShowAreaSearch(false);
    if (activeTab === 'empresas') {
      void reloadCompaniesIfStale(true);
      return;
    }
    void reloadProvidersIfStale(true);
  }, [activeTab, areaDirty, reloadCompaniesIfStale, reloadProvidersIfStale]);

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onStageLayout}>
      <View style={styles.mapStage} pointerEvents="box-none">
        {Platform.OS === 'web' ? (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={40} color={AppColors.gray[400]} />
            <Text style={styles.mapPlaceholderText}>Mapa disponível no app mobile</Text>
          </View>
        ) : (
          <MapLibreMapaView
            ref={mapRef}
            localizacao={mapRegion}
            pontos={mapPointsForView}
            markerVariant="card"
            getMarkerColor={() => '#7C3AED'}
            onRegionChangeComplete={handleMapRegionChangeComplete}
            onUserGestureStart={focusMap}
            onMarkerPress={handleMarkerPress}
          />
        )}
        <View style={styles.mapOverlay} pointerEvents="box-none">
          <Animated.View
            style={[styles.mapControls, controlsStyle]}
            pointerEvents={controlsInteractive ? 'box-none' : 'none'}
          >
            {Platform.OS !== 'web' && (
              <>
                <Pressable
                  onPress={handleMyLocation}
                  style={({ pressed }) => [styles.mapButtonSmall, pressed && styles.mapButtonPressed]}
                >
                  {locating ? (
                    <ActivityIndicator size="small" color={AppColors.text.secondary} />
                  ) : (
                    <Ionicons name="locate-outline" size={20} color={AppColors.text.secondary} />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => mapRef.current?.zoomBy(1, 200)}
                  style={({ pressed }) => [styles.mapButtonSmall, pressed && styles.mapButtonPressed]}
                >
                  <Ionicons name="add-outline" size={22} color={AppColors.text.secondary} />
                </Pressable>
                <Pressable
                  onPress={() => mapRef.current?.zoomBy(-1, 200)}
                  style={({ pressed }) => [styles.mapButtonSmall, pressed && styles.mapButtonPressed]}
                >
                  <Ionicons name="remove-outline" size={22} color={AppColors.text.secondary} />
                </Pressable>
              </>
            )}
          </Animated.View>
        </View>
      </View>

      <Animated.View
        pointerEvents={showAreaSearch ? 'box-none' : 'none'}
        style={[styles.searchAreaWrap, searchPillStyle]}
      >
        <Pressable
          onPress={searchThisMapArea}
          style={({ pressed }) => [styles.searchAreaBtn, pressed && styles.mapButtonPressed]}
        >
          <Ionicons name="search-outline" size={16} color="#fff" />
          <Text style={styles.searchAreaBtnText}>Buscar nesta área</Text>
        </Pressable>
      </Animated.View>

      <Animated.View collapsable={false} style={[styles.panel, { height: sheetHeight }, sheetStyle]}>
        <GestureDetector gesture={sheetPan}>
          <View
            collapsable={false}
            style={styles.dragHandleRow}
            accessibilityLabel="Arraste para ampliar o mapa ou a lista"
          >
            <View style={styles.dragHandle} />
          </View>
        </GestureDetector>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons
              name="search-outline"
              size={20}
              color={AppColors.gray[500]}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Serviço, profissão, empresa ou palavra-chave"
              placeholderTextColor={AppColors.gray[500]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={focusList}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color={AppColors.gray[400]} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'prestadores' && styles.filterTabActive]}
            onPress={() => setActiveTab('prestadores')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flash-outline"
              size={18}
              color={activeTab === 'prestadores' ? '#fff' : AppColors.gray[600]}
            />
            <Text
              style={[styles.filterTabText, activeTab === 'prestadores' && styles.filterTabTextActive]}
            >
              Prestadores
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'empresas' && styles.filterTabActive]}
            onPress={() => setActiveTab('empresas')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="business-outline"
              size={18}
              color={activeTab === 'empresas' ? '#fff' : AppColors.gray[600]}
            />
            <Text style={[styles.filterTabText, activeTab === 'empresas' && styles.filterTabTextActive]}>
              Empresas
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'prestadores' ? (
          <Pressable
            onPress={goCadastroPrestador}
            style={({ pressed }) => [styles.cadastroBanner, pressed && styles.cadastroBannerPressed]}
          >
            <Ionicons name="person-add-outline" size={18} color="#7C3AED" />
            <Text style={styles.cadastroBannerTitle}>Sou prestador de serviço</Text>
            <Ionicons name="chevron-forward" size={18} color={AppColors.gray[400]} />
          </Pressable>
        ) : null}

        <View style={styles.resultsHeader}>
            <View style={styles.sortRow}>
              <Ionicons name="navigate-outline" size={16} color={AppColors.gray[600]} />
              <Text style={styles.sortText}>
                Mais próximos · {results.length}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleMyLocation}
              activeOpacity={0.8}
              style={styles.nearMeBtn}
            >
              <Ionicons name="locate-outline" size={14} color="#7C3AED" />
              <Text style={styles.nearMeText}>Perto de mim</Text>
            </TouchableOpacity>
        </View>

        <Animated.ScrollView
          style={styles.listScroll}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 28 }]}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {listLoading && results.length === 0 ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>
                {activeTab === 'empresas' && loadingCategoryLabel
                  ? `Buscando ${loadingCategoryLabel.toLowerCase()}…`
                  : 'Carregando…'}
              </Text>
            </View>
          ) : listError && results.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cloud-offline-outline" size={48} color={AppColors.gray[400]} />
              <Text style={styles.emptyTitle}>Não foi possível carregar</Text>
              <Text style={styles.emptyDescription}>{listError}</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={48} color={AppColors.gray[400]} />
              <Text style={styles.emptyTitle}>Nenhum resultado</Text>
              <Text style={styles.emptyDescription}>
                Tente outro termo ou alterne entre Prestadores e Empresas.
              </Text>
            </View>
          ) : (
            <>
              {results.map((item) => (
                <GuiaProviderCard key={item.id} item={item} onPress={() => openDetail(item)} />
              ))}
              {activeTab === 'empresas' && companiesHasMore ? (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => void loadMoreCompanies()}
                  disabled={loadingMore}
                  activeOpacity={0.8}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#7C3AED" />
                  ) : (
                    <Text style={styles.loadMoreText}>Carregar mais</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </Animated.ScrollView>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const PANEL_TOP_RADIUS = 22;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
    overflow: 'hidden',
  },
  mapStage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: AppColors.gray[200],
  },
  searchAreaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 3,
    alignItems: 'center',
  },
  searchAreaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchAreaBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: AppColors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: AppColors.gray[500],
    fontWeight: '600',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  mapButtonPressed: { opacity: 0.9 },
  mapControls: { gap: 8 },
  mapButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  panel: {
    position: 'absolute',
    top: MAP_STRIP,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: '#fff',
    borderTopLeftRadius: PANEL_TOP_RADIUS,
    borderTopRightRadius: PANEL_TOP_RADIUS,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 18,
  },
  dragHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: AppColors.gray[300],
  },
  nearMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  nearMeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6d28d9',
  },
  searchRow: { marginBottom: 8 },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  searchIcon: { marginLeft: 12 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 15,
    color: AppColors.text.primary,
  },
  clearBtn: { paddingRight: 12 },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: AppColors.background.light,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  filterTabActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.gray[600],
  },
  filterTabTextActive: { color: '#fff' },
  cadastroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    justifyContent: 'space-between',
  },
  cadastroBannerPressed: { opacity: 0.92 },
  cadastroBannerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#4c1d95',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  sortText: { fontSize: 12, fontWeight: '600', color: AppColors.gray[600] },
  listScroll: { flex: 1 },
  listContent: { paddingBottom: 10 },
  emptyCard: {
    backgroundColor: AppColors.gray[100],
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: AppColors.gray[300],
    padding: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 14,
    color: AppColors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingCard: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.gray[500],
    textAlign: 'center',
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    backgroundColor: '#faf5ff',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6d28d9',
  },
});
