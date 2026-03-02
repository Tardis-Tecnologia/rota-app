import {
  CATEGORIAS_EMPRESAS,
  CATEGORIES_WITH_ALL,
} from '@/constants/providerCategories';
import { AppColors } from '@/constants/theme';
import { COMPANIES } from '@/data/companies';
import { PROVIDERS } from '@/data/providers';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
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

const MapView = Platform.OS === 'web' ? View : require('react-native-maps').default;
const PROVIDER_GOOGLE = Platform.OS === 'web' ? undefined : require('react-native-maps').PROVIDER_GOOGLE;
const mapStyle = Platform.OS === 'web' ? [] : require('@/styles/mapStyle.json');

const INITIAL_REGION = {
  latitude: -22.9189,
  longitude: -42.8186,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

type MapCamera = { center?: { latitude: number; longitude: number }; zoom?: number };
type TabFilter = 'prestadores' | 'empresas';

export default function ServicesAndProfessionalsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<TabFilter>('prestadores');
  const [hasSearched, setHasSearched] = useState(true);
  const mapRef = useRef<any>(null);

  const handleSearch = () => {
    setHasSearched(true);
    setAppliedQuery(searchQuery.trim());
    setSearchQuery('');
  };

  const query = appliedQuery.toLowerCase();
  const filteredPrestadores = query
    ? PROVIDERS.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const categoryLabel =
          CATEGORIES_WITH_ALL.find((c) => c.id === p.categoryId)?.label?.toLowerCase() ?? '';
        const categoryMatch = categoryLabel && categoryLabel.includes(query);
        return nameMatch || categoryMatch;
      })
    : PROVIDERS;
  const filteredEmpresas = query
    ? COMPANIES.filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(query);
        const categoryLabel =
          CATEGORIAS_EMPRESAS.find((cat) => cat.id === c.categoryId)?.label?.toLowerCase() ?? '';
        const categoryMatch = categoryLabel && categoryLabel.includes(query);
        const categoryIdMatch = c.categoryId.toLowerCase().includes(query);
        return nameMatch || categoryMatch || categoryIdMatch;
      })
    : COMPANIES;
  const resultsCount =
    activeFilter === 'prestadores' ? filteredPrestadores.length : filteredEmpresas.length;
  const showEmptyState = !hasSearched;
  const showList = hasSearched;

  const handleMyLocation = () => {
    mapRef.current?.getCamera?.().then?.((camera: MapCamera) => {
      if (camera?.center) {
        mapRef.current?.animateCamera?.({ center: camera.center, zoom: 15 }, { duration: 300 });
      }
    });
  };

  const handleZoomIn = () => {
    mapRef.current?.getCamera?.().then?.((camera: MapCamera) => {
      if (camera?.zoom != null) {
        mapRef.current?.animateCamera?.(
          { center: camera.center, zoom: Math.min((camera.zoom ?? 15) + 1, 20) },
          { duration: 200 }
        );
      }
    });
  };

  const handleZoomOut = () => {
    mapRef.current?.getCamera?.().then?.((camera: MapCamera) => {
      if (camera?.zoom != null) {
        mapRef.current?.animateCamera?.(
          { center: camera.center, zoom: Math.max((camera.zoom ?? 15) - 1, 3) },
          { duration: 200 }
        );
      }
    });
  };

  const MapContent =
    Platform.OS === 'web' ? (
      <View style={styles.mapPlaceholder} />
    ) : (
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION}
        mapType="standard"
        customMapStyle={mapStyle}
        showsUserLocation
        showsMyLocationButton={false}
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
                  <Ionicons name="locate-outline" size={20} color={AppColors.text.secondary} />
                </Pressable>
                <Pressable
                  onPress={handleZoomIn}
                  style={({ pressed }) => [styles.mapButtonSmall, pressed && styles.mapButtonPressed]}
                >
                  <Ionicons name="add-outline" size={22} color={AppColors.text.secondary} />
                </Pressable>
                <Pressable
                  onPress={handleZoomOut}
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
          <Text style={styles.dragHandleText}>Arraste para baixo para ver o mapa</Text>
        </View>

        <Text style={styles.panelTitle}>Guia da Cidade</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={20} color={AppColors.gray[500]} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ex: encanador, eletricista..."
              placeholderTextColor={AppColors.gray[500]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.85}>
            <Text style={styles.searchButtonText}>BUSCAR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'prestadores' && styles.filterTabActive]}
            onPress={() => setActiveFilter('prestadores')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flash-outline"
              size={18}
              color={activeFilter === 'prestadores' ? '#fff' : AppColors.gray[600]}
            />
            <Text
              style={[styles.filterTabText, activeFilter === 'prestadores' && styles.filterTabTextActive]}
            >
              PRESTADORES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'empresas' && styles.filterTabActive]}
            onPress={() => setActiveFilter('empresas')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="business-outline"
              size={18}
              color={activeFilter === 'empresas' ? '#fff' : AppColors.gray[600]}
            />
            <Text style={[styles.filterTabText, activeFilter === 'empresas' && styles.filterTabTextActive]}>
              EMPRESAS
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsHeader}>
          <View style={styles.sortRow}>
            <Ionicons name="reorder-three-outline" size={20} color={AppColors.gray[600]} />
            <Text style={styles.sortText}>MAIS PRÓXIMOS PRIMEIRO</Text>
          </View>
          <Text style={styles.resultsCount}>
            {resultsCount} Encontrado{resultsCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {showEmptyState && (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={56} color={AppColors.gray[400]} />
              <Text style={styles.emptyTitle}>Busque por profissão</Text>
              <Text style={styles.emptyDescription}>
                Digite profissão, nome do profissional ou empresa e clique em Buscar para filtrar os
                resultados (prestadores ou empresas).
              </Text>
            </View>
          )}

          {showList && activeFilter === 'prestadores' &&
            filteredPrestadores.map((provider) => {
              const categoryLabel =
                CATEGORIES_WITH_ALL.find((c) => c.id === provider.categoryId)?.label ?? '';
              return (
                <TouchableOpacity
                  key={provider.id}
                  style={styles.profCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/ProfileProviderTab',
                      params: { provider: JSON.stringify(provider) },
                    })
                  }
                >
                  <View style={styles.profAvatar}>
                    {provider.image ? (
                      <Image
                        source={{ uri: provider.image }}
                        style={styles.profAvatarImage}
                      />
                    ) : (
                      <View style={styles.profAvatarPlaceholder}>
                        <Text style={styles.profAvatarLetter}>{provider.name.charAt(0)}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.profInfo}>
                    <Text style={styles.profName}>{provider.name}</Text>
                    <View style={styles.profRatingRow}>
                      <Ionicons name="star" size={14} color="#EAB308" />
                      <Text style={styles.profRating}>{provider.rating}</Text>
                    </View>
                    <Text style={styles.profProfession} numberOfLines={1}>
                      {categoryLabel}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={AppColors.gray[400]} />
                </TouchableOpacity>
              );
            })}

          {showList && activeFilter === 'empresas' &&
            filteredEmpresas.map((company) => {
              const categoryLabel =
                CATEGORIAS_EMPRESAS.find((c) => c.id === company.categoryId)?.label ?? '';
              return (
                <TouchableOpacity
                  key={company.id}
                  style={styles.profCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/ProfileProviderTab',
                      params: { provider: JSON.stringify(company) },
                    })
                  }
                >
                  <View style={styles.profAvatar}>
                    {company.image ? (
                      <Image
                        source={{ uri: company.image }}
                        style={styles.profAvatarImage}
                      />
                    ) : (
                      <View style={styles.profAvatarPlaceholder}>
                        <Text style={styles.profAvatarLetter}>{company.name.charAt(0)}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.profInfo}>
                    <Text style={styles.profName}>{company.name}</Text>
                    <View style={styles.profRatingRow}>
                      <Ionicons name="star" size={14} color="#EAB308" />
                      <Text style={styles.profRating}>{company.rating}</Text>
                    </View>
                    <Text style={styles.profProfession} numberOfLines={1}>
                      {categoryLabel}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={AppColors.gray[400]} />
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>
    </View>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.min(SCREEN_HEIGHT * 0.42, 320);
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
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapButtonPressed: {
    opacity: 0.9,
  },
  mapControls: {
    gap: 8,
  },
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    minHeight: 400,
  },
  dragHandleRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.gray[300],
    marginBottom: 6,
  },
  dragHandleText: {
    fontSize: 12,
    color: AppColors.gray[500],
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    paddingRight: 14,
    fontSize: 16,
    color: AppColors.text.primary,
  },
  searchButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
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
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.gray[600],
  },
  filterTabTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.gray[600],
  },
  resultsCount: {
    fontSize: 12,
    color: AppColors.gray[500],
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
  },
  emptyCard: {
    backgroundColor: AppColors.gray[100],
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: AppColors.gray[300],
    padding: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: AppColors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  profCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  profAvatar: {
    marginRight: 12,
  },
  profAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.palette.indigo.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profAvatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.palette.indigo.base,
  },
  profInfo: {
    flex: 1,
  },
  profName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  profRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  profRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  profProfession: {
    fontSize: 13,
    color: AppColors.gray[500],
    marginTop: 2,
  },
});
