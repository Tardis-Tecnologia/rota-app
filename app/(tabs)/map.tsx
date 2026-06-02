import ExploreFloatingCard from '@/components/ExploreFloatingCard';
import ExploreMapControls from '@/components/ExploreMapControls';
import MapLibreMapaView, { type MapLibreMapaViewRef } from '@/components/MapLibreMapaView';
import { ModalReportPrefeitura } from '@/components/ModalReportPrefeitura';
import PlaceDetailsSheet from '@/components/PlaceDetailsSheet';
import ReportButton, { REPORT_SUBJECT_BY_TYPE, type ReportType } from '@/components/ReportButton';
import Toast from '@/components/Toast';
import { AppColors } from '@/constants/theme';
import { useNotificationUnreadCount } from '@/hooks/useNotificationUnreadCount';
import { ensureForegroundLocationPermission } from '@/services/locationPermission';
import {
  communityToExplorePonto,
  EXPLORE_COMMUNITIES_CHIP_ID,
  listForumCommunities,
} from '@/services/forumCommunityApi';
import {
  EXPLORE_PARTNER_STORES_CHIP_ID,
  loadPartnerStoresForMap,
} from '@/utils/commercialStoreMap';
import { placeToPonto } from '@/services/mapPlaceToPonto';
import { searchNearbyPlaces } from '@/services/placesService';
import { Localizacao, PontoInteresse } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import type { Region } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MARICA_CENTER = {
  latitude: -22.9189,
  longitude: -42.8186,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

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

  const solicitarPermissaoLocalizacao = useCallback(async (): Promise<void> => {
    setLocationError(null);
    setLocationReady(false);
    setLoading(true);
    try {
      const ok = await ensureForegroundLocationPermission();
      if (!ok) {
        setLocationError('denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const next: Localizacao = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.018,
        longitudeDelta: 0.018,
      };
      pendingInitialGpsCenterRef.current = true;
      setLocalizacao(next);
      setMapRegion(next);
      setLocationReady(true);
    } catch {
      setLocationError('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        setLoading(false);
        return;
      }
      void solicitarPermissaoLocalizacao();
    }, [solicitarPermissaoLocalizacao]),
  );

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const t = setTimeout(() => setShowDragHint(false), 12000);
    return () => clearTimeout(t);
  }, []);

  const applyFilterChip = useCallback(
    async (chipId: string) => {
      if (chipId === categoriaSelecionada) {
        setCategoriaSelecionada(undefined);
        setPontos([]);
        setSelectedPontoDetail(null);
        return;
      }
      if (chipId === EXPLORE_COMMUNITIES_CHIP_ID) {
        setFilterLoading(true);
        try {
          const rows = await listForumCommunities(undefined, { init: 0, end: 200 });
          const mapped = rows
            .map(communityToExplorePonto)
            .filter((p): p is PontoInteresse => p != null);
          setPontos(mapped);
          setCategoriaSelecionada(chipId);
          setSelectedPontoDetail(null);
          setToastType(mapped.length > 0 ? 'success' : 'info');
          setToastMessage(
            mapped.length > 0
              ? `${mapped.length} comunidade${mapped.length === 1 ? '' : 's'} com local no mapa.`
              : 'Nenhuma comunidade com localização cadastrada.',
          );
          setToastKey((k) => k + 1);
          setShowToast(true);
        } catch {
          Alert.alert('Erro', 'Não foi possível carregar as comunidades.');
        } finally {
          setFilterLoading(false);
        }
        return;
      }

      if (chipId === EXPLORE_PARTNER_STORES_CHIP_ID) {
        setFilterLoading(true);
        try {
          const mapped = await loadPartnerStoresForMap();
          setPontos(mapped);
          setCategoriaSelecionada(chipId);
          setSelectedPontoDetail(null);
          setToastType(mapped.length > 0 ? 'success' : 'info');
          setToastMessage(
            mapped.length > 0
              ? `${mapped.length} loja${mapped.length === 1 ? '' : 's'} parceira${mapped.length === 1 ? '' : 's'} no mapa.`
              : 'Nenhuma loja parceira com endereço localizável no momento.',
          );
          setToastKey((k) => k + 1);
          setShowToast(true);
        } catch {
          Alert.alert('Erro', 'Não foi possível carregar as lojas parceiras.');
        } finally {
          setFilterLoading(false);
        }
        return;
      }

      const placeType = FILTER_CHIP_TO_PLACE_TYPE[chipId];
      if (!placeType) return;

      setFilterLoading(true);
      try {
        const pos: [number, number] = [localizacao.longitude, localizacao.latitude];
        const places = await searchNearbyPlaces(placeType, pos, undefined, 20);
        setPontos(places.map((p) => placeToPonto(p, placeType)));
        setCategoriaSelecionada(chipId);
        setSelectedPontoDetail(null);
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
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'UNSUPPORTED_CATEGORY') {
          Alert.alert('Em breve', 'Essa categoria ainda não está disponível.');
        } else {
          Alert.alert('Erro', 'Não foi possível buscar locais próximos.');
        }
      } finally {
        setFilterLoading(false);
      }
    },
    [categoriaSelecionada, localizacao.latitude, localizacao.longitude],
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
  }, []);

  const handleRegionComplete = useCallback((region: Region) => {
    const clamp = (d: number) => Math.min(45, Math.max(0.0003, d));
    setMapRegion({
      ...region,
      latitudeDelta: clamp(region.latitudeDelta),
      longitudeDelta: clamp(region.longitudeDelta),
    });
  }, []);

  const handleUserDragMap = useCallback(() => {
    setShowDragHint(false);
  }, []);

  const handleCenterUser = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== 'granted') {
          Alert.alert('Localização', 'Permita o acesso à localização para centralizar o mapa.');
          return;
        }
      }
      const pos = await Location.getCurrentPositionAsync({
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
        <Pressable style={styles.locationRetryBtn} onPress={() => void solicitarPermissaoLocalizacao()}>
          <Text style={styles.locationRetryBtnText}>Tentar novamente</Text>
        </Pressable>
        <Pressable style={styles.locationSettingsBtn} onPress={() => void Linking.openSettings()}>
          <Text style={styles.locationSettingsBtnText}>Abrir configurações</Text>
        </Pressable>
      </View>
    );
  }

  const mapControlsBottom = tabBarHeight + 12;

  return (
    <View style={[styles.container, { backgroundColor: AppColors.background.default }]}>
      <MapLibreMapaView
        ref={mapRef}
        localizacao={localizacao}
        pontos={pontos}
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
      <ReportButton onReport={handleReport} bottomOffset={mapControlsBottom} />
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