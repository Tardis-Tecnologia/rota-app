import { AppColors } from '@/constants/theme';
import { buildCityGeocodeQuery } from '@/constants/whitelabelCity';
import { useWhitelabelCity } from '@/hooks/useWhitelabelCity';
import { searchAddresses, type AddressSearchResult } from '@/services/placesService';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchTab() {
  const city = useWhitelabelCity();
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const trimmedQuery = search.trim();
  const showResults = trimmedQuery.length >= 3;

  useEffect(() => {
    if (trimmedQuery.length < 3) {
      setResults([]);
      setSearching(false);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setSearchError(null);

    const handle = setTimeout(async () => {
      try {
        const query = buildCityGeocodeQuery(trimmedQuery, city);
        const found = await searchAddresses(query, {
          proximity: [city.longitude, city.latitude],
          cityName: city.cityName,
          limit: 15,
          signal: controller.signal,
        });
        setResults(found);
        setHasSearched(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        setResults([]);
        setHasSearched(true);
        setSearchError('Não foi possível buscar endereços agora.');
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 450);

    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [trimmedQuery, city]);

  const handleSelectAddress = (item: AddressSearchResult) => {
    router.replace({
      pathname: '/(tabs)/map',
      params: {
        focusLat: String(item.latitude),
        focusLng: String(item.longitude),
        focusLabel: item.title,
        focusAddress: item.subtitle ?? '',
      },
    });
  };

  const categories = useMemo(
    () => [
      { id: 'hospital', label: 'Hospitais', iconSet: 'material', iconName: 'local-hospital', iconColor: '#db2777', backgroundColor: '#db277720' },
      { id: 'school', label: 'Escolas', iconSet: 'ion', iconName: 'school-outline', iconColor: '#1e40af', backgroundColor: '#1e40af20' },
      { id: 'restaurant', label: 'Restaurantes', iconSet: 'ion', iconName: 'restaurant-outline', iconColor: '#dc2626', backgroundColor: '#dc262620' },
      { id: 'pharmacy', label: 'Farmácias', iconSet: 'material', iconName: 'vaccines', iconColor: '#16a34a', backgroundColor: '#16a34a20' },
      { id: 'market', label: 'Mercados', iconSet: 'ion', iconName: 'basket-outline', iconColor: '#d97706', backgroundColor: '#d9770620' },
      { id: 'prestador', label: 'Prestadores', iconSet: 'ion', iconName: 'construct-outline', iconColor: '#0d9488', backgroundColor: '#0d948820' },
      { id: 'partner_stores', label: 'Parceiros', iconSet: 'ion', iconName: 'storefront-outline', iconColor: '#b45309', backgroundColor: '#b4530920' },
      { id: 'communities', label: 'Comunidades', iconSet: 'ion', iconName: 'people-outline', iconColor: '#0891b2', backgroundColor: '#0891b220' },
      { id: 'bakery', label: 'Padarias', iconSet: 'ion', iconName: 'pizza-outline', iconColor: '#b45309', backgroundColor: '#b4530920' },
      { id: 'gas_station', label: 'Postos', iconSet: 'material', iconName: 'local-gas-station', iconColor: '#6b7280', backgroundColor: '#6b728020' },
    ],
    []
  );

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    router.replace({
      pathname: '/(tabs)/map',
      params: { category: categoryId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons name="arrow-back-outline" size={24} color={AppColors.text.tertiary} />
          </Pressable>

          <Text style={styles.headerTitle}>O que você procura?</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color={AppColors.text.quaternary}
            style={styles.searchIcon}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Pesquisar por nome ou endereço..."
            placeholderTextColor={AppColors.text.quaternary}
            style={[styles.searchInput, isFocused && styles.searchInputFocused]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {showResults ? (
            <View style={styles.resultsBlock}>
              <Text style={styles.categoriesTitle}>Endereços e locais</Text>

              {searching ? (
                <View style={styles.resultsStatusRow}>
                  <ActivityIndicator size="small" color={AppColors.accent} />
                  <Text style={styles.resultsStatusText}>Buscando endereços…</Text>
                </View>
              ) : searchError ? (
                <View style={styles.resultsStatusRow}>
                  <Ionicons name="alert-circle-outline" size={18} color={AppColors.status.error} />
                  <Text style={styles.resultsStatusText}>{searchError}</Text>
                </View>
              ) : results.length === 0 && hasSearched ? (
                <View style={styles.resultsStatusRow}>
                  <Ionicons name="search-outline" size={18} color={AppColors.text.quaternary} />
                  <Text style={styles.resultsStatusText}>
                    Nenhum endereço encontrado para “{trimmedQuery}”.
                  </Text>
                </View>
              ) : (
                <View style={styles.resultsList}>
                  {results.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.resultRow}
                      activeOpacity={0.85}
                      onPress={() => handleSelectAddress(item)}
                    >
                      <View style={styles.resultIconWrapper}>
                        <Ionicons name="location-outline" size={20} color={AppColors.accent} />
                      </View>
                      <View style={styles.resultTextWrapper}>
                        <Text style={styles.resultTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.subtitle ? (
                          <Text style={styles.resultSubtitle} numberOfLines={2}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={AppColors.text.quaternary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesTitle}>Categorias</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((item) => {
                const isActive = selectedCategory === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.categoryCard,
                      isActive && styles.categoryCardActive,
                    ]}
                    activeOpacity={0.92}
                    onPress={() => handleCategoryPress(item.id)}
                  >
                    <View
                      style={[
                        styles.categoryIconWrapper,
                        { backgroundColor: item.backgroundColor },
                      ]}
                    >
                      {(() => {
                        if (item.iconSet === 'material') {
                          return (
                            <MaterialIcons
                              name={item.iconName as keyof typeof MaterialIcons.glyphMap}
                              size={24}
                              color={item.iconColor}
                            />
                          );
                        }
                        if (item.iconSet === 'mci') {
                          return (
                            <MaterialCommunityIcons
                              name={item.iconName as keyof typeof MaterialCommunityIcons.glyphMap}
                              size={24}
                              color={item.iconColor}
                            />
                          );
                        }
                        return (
                          <Ionicons
                            name={item.iconName as keyof typeof Ionicons.glyphMap}
                            size={24}
                            color={item.iconColor}
                          />
                        );
                      })()}
                    </View>
                    <Text
                      style={[
                        styles.categoryLabel,
                        isActive && styles.categoryLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
    borderRadius: 20,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(226, 232, 240, 0.6)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  searchContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingVertical: 12,
    paddingLeft: 44,
    paddingRight: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    color: AppColors.text.secondary,
  },
  searchInputFocused: {
    borderColor: AppColors.accent,
    backgroundColor: AppColors.background.default,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 16,
  },
  resultsContainer: {
    minHeight: 40,
  },
  customResultsPlaceholder: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    minHeight: 8,
  },
  resultsBlock: {
    paddingTop: 8,
  },
  resultsStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  resultsStatusText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
  resultsList: {
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppColors.background.default,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  resultIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
  },
  resultTextWrapper: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  resultSubtitle: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  categoriesContainer: {
    paddingTop: 8,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text.secondary,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  categoryCard: {
    width: '31%',
    marginBottom: 12,
    backgroundColor: AppColors.background.default,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    gap: 10,
  },
  categoryCardActive: {
    borderColor: AppColors.accent,
    backgroundColor: '#e0f2fe',
  },
  
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.text.secondary,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: AppColors.accent,
  },


});