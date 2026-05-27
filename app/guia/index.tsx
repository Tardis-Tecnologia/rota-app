import GuiaProviderCard from '@/components/guia/GuiaProviderCard';
import MapLibreMapaView, { type MapLibreMapaViewRef } from '@/components/MapLibreMapaView';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  filterAndSortGuia,
  guiaProfileToPonto,
  type GuiaListItem,
  type GuiaTab,
} from '@/services/guiaCatalog';
import {
  listGuiaProviderRegistrations,
  type StoredGuiaProviderRegistration,
} from '@/services/guiaPendingProvidersStore';
import { ensureForegroundLocationPermission } from '@/services/locationPermission';
import type { Localizacao, PontoInteresse } from '@/types';
import { GUIA_DEFAULT_CENTER } from '@/utils/guiaGeo';
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuiaIndexScreen() {
  const { user } = useAuth();
  const { cadastroStatus } = useLocalSearchParams<{ cadastroStatus?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<GuiaTab>('prestadores');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [mapRegion, setMapRegion] = useState<Localizacao>(GUIA_DEFAULT_CENTER);
  const [registrations, setRegistrations] = useState<StoredGuiaProviderRegistration[]>([]);
  const mapRef = useRef<MapLibreMapaViewRef | null>(null);

  const loadRegistrations = useCallback(async () => {
    const items = await listGuiaProviderRegistrations();
    setRegistrations(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRegistrations();
    }, [loadRegistrations]),
  );

  const results = useMemo(
    () =>
      filterAndSortGuia(activeTab, searchQuery, userCoords, {
        currentUserId: user?.id,
        registrations,
      }),
    [activeTab, searchQuery, userCoords, user?.id, registrations],
  );

  const mapPoints: PontoInteresse[] = useMemo(
    () => results.map(guiaProfileToPonto).filter((p): p is PontoInteresse => p != null),
    [results],
  );

  const loadUserLocation = useCallback(async () => {
    setLocating(true);
    try {
      const ok = await ensureForegroundLocationPermission();
      if (!ok) return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setUserCoords({ latitude, longitude });
      const region: Localizacao = {
        latitude,
        longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 400);
    } catch {
      // mantém centro padrão
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    void loadUserLocation();
  }, [loadUserLocation]);

  useEffect(() => {
    if (cadastroStatus !== 'enviado') return;
    Alert.alert(
      'Cadastro efetivado com sucesso',
      'Aguarde retorno de aprovação do administrativo da Rota.',
      [{ text: 'OK', onPress: () => router.replace('/guia') }],
    );
  }, [cadastroStatus]);

  const handleMyLocation = () => {
    if (userCoords) {
      mapRef.current?.animateToRegion(
        {
          ...userCoords,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        320,
      );
      return;
    }
    void loadUserLocation();
  };

  const openDetail = (item: GuiaListItem) => {
    router.push({
      pathname: '/guia/[id]',
      params: { id: item.id },
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

  const MapContent =
    Platform.OS === 'web' ? (
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={40} color={AppColors.gray[400]} />
        <Text style={styles.mapPlaceholderText}>Mapa disponível no app mobile</Text>
      </View>
    ) : (
      <MapLibreMapaView
        ref={mapRef}
        localizacao={mapRegion}
        pontos={mapPoints}
        getMarkerColor={() => '#7C3AED'}
        onMarkerPress={handleMarkerPress}
      />
    );

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {MapContent}
        <SafeAreaView style={styles.mapOverlay} edges={['top']}>
          <View style={styles.mapControls}>
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
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.panel}>
        <View style={styles.dragHandleRow}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.panelHeaderRow}>
          <Text style={styles.panelTitle}>Guia da Cidade</Text>
          <TouchableOpacity
            onPress={handleMyLocation}
            activeOpacity={0.8}
            style={styles.nearMeBtn}
          >
            <Ionicons name="locate-outline" size={14} color="#7C3AED" />
            <Text style={styles.nearMeText}>Perto de mim</Text>
          </TouchableOpacity>
        </View>

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
            <Ionicons name="navigate-outline" size={18} color={AppColors.gray[600]} />
            <Text style={styles.sortText}>Mais próximos primeiro</Text>
          </View>
          <Text style={styles.resultsCount}>
            {results.length} encontrado{results.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          {results.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={48} color={AppColors.gray[400]} />
              <Text style={styles.emptyTitle}>Nenhum resultado</Text>
              <Text style={styles.emptyDescription}>
                Tente outro termo ou alterne entre Prestadores e Empresas.
              </Text>
            </View>
          ) : (
            results.map((item) => (
              <GuiaProviderCard key={item.id} item={item} onPress={() => openDetail(item)} />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.min(SCREEN_HEIGHT * 0.28, 220);
const PANEL_TOP_RADIUS = 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: AppColors.gray[200],
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
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 16,
    paddingTop: 8,
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
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: PANEL_TOP_RADIUS,
    borderTopRightRadius: PANEL_TOP_RADIUS,
    marginTop: -PANEL_TOP_RADIUS,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  dragHandleRow: { alignItems: 'center', marginBottom: 4 },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.gray[300],
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
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
    marginBottom: 8,
  },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortText: { fontSize: 12, fontWeight: '600', color: AppColors.gray[600] },
  resultsCount: { fontSize: 12, fontWeight: '700', color: AppColors.gray[500] },
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
});
