import ExploreFloatingCard from '@/components/ExploreFloatingCard';
import ExploreMapControls from '@/components/ExploreMapControls';
import MapaView from '@/components/MapaView';
import { ModalReportPrefeitura } from '@/components/ModalReportPrefeitura';
import PlaceDetailsSheet from '@/components/PlaceDetailsSheet';
import ReportButton, { REPORT_SUBJECT_BY_TYPE, type ReportType } from '@/components/ReportButton';
import Toast from '@/components/Toast';
import { AppColors } from '@/constants/theme';
import { placeToPonto } from '@/services/mapPlaceToPonto';
import { searchNearbyPlaces } from '@/services/placesService';
import type { Localizacao, PontoInteresse, Region } from '@/types';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MapLibreMapaViewRef } from '@/components/MapLibreMapaView';

// Coordenadas de Maricá, RJ
const MARICA_CENTER = {
  latitude: -22.9189,
  longitude: -42.8186,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/** Chip da UI → tipo Places (mock igual ao protótipo ROTA / MainScreen) */
const FILTER_CHIP_TO_PLACE_TYPE: Record<string, string> = {
  restaurant: 'restaurant',
  prestador: 'gas_station',
  hospital: 'hospital',
  shopping_mall: 'shopping_mall',
  bank: 'bank',
};

const CHIP_LABELS: Record<string, string> = {
  restaurant: 'Restaurantes',
  prestador: 'Prestadores',
  hospital: 'Hospital',
  shopping_mall: 'Shopping',
  bank: 'Bancos',
};

function routeParamToChipId(raw: string): string | undefined {
  const alias: Record<string, string> = {
    gas_station: 'prestador',
  };
  const chip = alias[raw] ?? raw;
  return FILTER_CHIP_TO_PLACE_TYPE[chip] ? chip : undefined;
}

const PONTOS_PADRAO_MARICA: PontoInteresse[] = [
  {
    id: '1',
    titulo: 'Prefeitura Municipal de Maricá',
    descricao: 'Sede da administração municipal',
    latitude: -22.9189,
    longitude: -42.8186,
    tipo: 'governo',
  },
  {
    id: '2',
    titulo: 'Hospital Municipal de Maricá',
    descricao: 'Hospital público da cidade',
    latitude: -22.915,
    longitude: -42.815,
    tipo: 'saude',
  },
  {
    id: '3',
    titulo: 'Praia de Itaipuaçu',
    descricao: 'Uma das praias mais famosas de Maricá',
    latitude: -22.93,
    longitude: -42.83,
    tipo: 'turismo',
  },
  {
    id: '4',
    titulo: 'Lagoa de Araçatiba',
    descricao: 'Lagoa para atividades de lazer e esportes',
    latitude: -22.91,
    longitude: -42.81,
    tipo: 'lazer',
  },
  {
    id: '5',
    titulo: 'Centro Cultural de Maricá',
    descricao: 'Espaço para eventos e exposições culturais',
    latitude: -22.92,
    longitude: -42.82,
    tipo: 'cultura',
  },
  {
    id: '6',
    titulo: 'Escola Municipal',
    descricao: 'Escola pública de ensino fundamental',
    latitude: -22.918,
    longitude: -42.818,
    tipo: 'educacao',
  },
  {
    id: '7',
    titulo: 'Lagoa da Barra',
    descricao: 'Lagoa com área de lazer e pesca',
    latitude: -22.925,
    longitude: -42.825,
    tipo: 'turismo',
  },
  {
    id: '8',
    titulo: 'Praia de Ponta Negra',
    descricao: 'Praia paradisíaca de Maricá',
    latitude: -22.935,
    longitude: -42.835,
    tipo: 'turismo',
  },
];

export default function ExplorarScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const mapRef = useRef<MapLibreMapaViewRef | null>(null);
  const [localizacao, setLocalizacao] = useState<Localizacao>(MARICA_CENTER);
  const [mapRegion, setMapRegion] = useState<Region>(() => ({
    ...MARICA_CENTER,
  }));
  const [loading, setLoading] = useState<boolean>(true);
  const tipoMapa: 'standard' | 'satellite' | 'hybrid' = 'standard';
  const [pontos, setPontos] = useState<PontoInteresse[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | undefined>(undefined);
  const [filterLoading, setFilterLoading] = useState(false);
  const [selectedPontoDetail, setSelectedPontoDetail] = useState<PontoInteresse | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info' | 'error' | 'warning'>('success');
  const [prefeituraModalVisible, setPrefeituraModalVisible] = useState(false);
  const [prefeituraAssuntoInicial, setPrefeituraAssuntoInicial] = useState<string | undefined>();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const appliedCategoryFromRoute = useRef(false);

  useEffect(() => {
    carregarPontos();
    if (Platform.OS !== 'web') {
      solicitarPermissaoLocalizacao();
    } else {
      setLoading(false);
    }
  }, []);

  const solicitarPermissaoLocalizacao = async (): Promise<void> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'A permissão de localização é necessária para mostrar sua posição no mapa.'
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const next: Localizacao = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setLocalizacao(next);
      setMapRegion(next);
    } catch {
      setLocalizacao(MARICA_CENTER);
      setMapRegion({ ...MARICA_CENTER });
    } finally {
      setLoading(false);
    }
  };

  const carregarPontos = (): void => {
    setPontos([...PONTOS_PADRAO_MARICA]);
  };

  const applyFilterChip = useCallback(
    async (chipId: string) => {
      if (chipId === categoriaSelecionada) {
        setCategoriaSelecionada(undefined);
        setPontos([...PONTOS_PADRAO_MARICA]);
        setSelectedPontoDetail(null);
        return;
      }
      const placeType = FILTER_CHIP_TO_PLACE_TYPE[chipId];
      if (!placeType) return;

      setFilterLoading(true);
      try {
        const pos: [number, number] = [localizacao.longitude, localizacao.latitude];
        const places = await searchNearbyPlaces(placeType, pos);
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
      } catch {
        Alert.alert('Erro', 'Não foi possível buscar locais.');
      } finally {
        setFilterLoading(false);
      }
    },
    [categoriaSelecionada, localizacao.latitude, localizacao.longitude],
  );

  useEffect(() => {
    if (loading || Platform.OS === 'web') return;
    if (!category || typeof category !== 'string') return;
    const chip = routeParamToChipId(category);
    if (!chip || appliedCategoryFromRoute.current) return;
    appliedCategoryFromRoute.current = true;
    void applyFilterChip(chip);
  }, [loading, category, applyFilterChip]);

  const getMarkerColor = (tipo: PontoInteresse['tipo']): string => {
    return AppColors.categoria[tipo] || AppColors.primary;
  };

  const handleMarkerPress = useCallback((ponto: PontoInteresse) => {
    setSelectedPontoDetail(ponto);
  }, []);

  const handleRegionComplete = useCallback((region: Region) => {
    setMapRegion(region);
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
      const pos = await Location.getCurrentPositionAsync({});
      const region: Region = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: mapRegion.latitudeDelta,
        longitudeDelta: mapRegion.longitudeDelta,
      };
      mapRef.current?.animateToRegion(region, 500);
    } catch {
      Alert.alert('Mapa', 'Não foi possível obter sua localização.');
    }
  }, [mapRegion.latitudeDelta, mapRegion.longitudeDelta]);

  const handleZoomIn = useCallback(() => {
    const next: Region = {
      ...mapRegion,
      latitudeDelta: Math.max(mapRegion.latitudeDelta * 0.55, 0.0004),
      longitudeDelta: Math.max(mapRegion.longitudeDelta * 0.55, 0.0004),
    };
    mapRef.current?.animateToRegion(next, 220);
  }, [mapRegion]);

  const handleZoomOut = useCallback(() => {
    const next: Region = {
      ...mapRegion,
      latitudeDelta: Math.min(mapRegion.latitudeDelta * 1.85, 0.35),
      longitudeDelta: Math.min(mapRegion.longitudeDelta * 1.85, 0.35),
    };
    mapRef.current?.animateToRegion(next, 220);
  }, [mapRegion]);

  const handleAccessibility = useCallback(() => {
    Alert.alert(
      'Acessibilidade',
      'Em breve você poderá ajustar contraste, tamanho de texto e outras opções por aqui.',
    );
  }, []);

  const handleReport = useCallback((type: ReportType) => {
    setPrefeituraAssuntoInicial(REPORT_SUBJECT_BY_TYPE[type]);
    setPrefeituraModalVisible(true);
  }, []);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: AppColors.background.default }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Carregando mapa de Maricá...</Text>
      </View>
    );
  }

  // Na web, mostrar uma lista de pontos de interesse
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

  const mapControlsBottom = tabBarHeight + 12;

  return (
    <View style={[styles.container, { backgroundColor: AppColors.background.default }]}>
      <MapaView
        localizacao={localizacao}
        tipoMapa={tipoMapa}
        pontos={pontos}
        getMarkerColor={getMarkerColor}
        mapRef={mapRef}
        onRegionChangeComplete={handleRegionComplete}
        onMarkerPress={handleMarkerPress}
      />
      <View
        pointerEvents="box-none"
        style={[styles.overlay, { paddingTop: insets.top + 8 }]}
      >
        <ExploreFloatingCard
          activeItemId={categoriaSelecionada}
          onSelectQuickAccess={(id) => void applyFilterChip(id)}
          filterLoading={filterLoading}
        />
      </View>
      <ExploreMapControls
        bottomOffset={mapControlsBottom}
        onCenterUser={handleCenterUser}
        onAccessibility={handleAccessibility}
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

