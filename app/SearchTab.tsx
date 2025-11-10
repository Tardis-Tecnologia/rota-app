import { AppColors } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SearchTab() {
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => [
      { id: 'restaurant', label: 'Restaurantes', iconSet: 'ion', iconName: 'restaurant-outline', iconColor: '#dc2626', backgroundColor: '#dc262620' },
      { id: 'gas_station', label: 'Postos', iconSet: 'material', iconName: 'local-gas-station', iconColor: '#6b7280', backgroundColor: '#6b728020' },
      { id: 'hospital', label: 'Hospital', iconSet: 'material', iconName: 'local-hospital', iconColor: '#db2777', backgroundColor: '#db277720' },
      { id: 'shopping_mall', label: 'Shopping', iconSet: 'mci', iconName: 'shopping-outline', iconColor: '#ea580c', backgroundColor: '#ea580c20' },
      { id: 'bank', label: 'Bancos', iconSet: 'material', iconName: 'account-balance', iconColor: '#2563eb', backgroundColor: '#2563eb20' },
      { id: 'pharmacy', label: 'Farmácias', iconSet: 'material', iconName: 'vaccines', iconColor: '#16a34a', backgroundColor: '#16a34a20' },
      { id: 'cafe', label: 'Cafés', iconSet: 'ion', iconName: 'cafe-outline', iconColor: '#92400e', backgroundColor: '#92400e20' },
      { id: 'gym', label: 'Academias', iconSet: 'ion', iconName: 'barbell-outline', iconColor: '#7c3aed', backgroundColor: '#7c3aed20' },
      { id: 'park', label: 'Parques', iconSet: 'ion', iconName: 'leaf-outline', iconColor: '#15803d', backgroundColor: '#15803d20' },
      { id: 'school', label: 'Escolas', iconSet: 'ion', iconName: 'school-outline', iconColor: '#1e40af', backgroundColor: '#1e40af20' },
      { id: 'hotel', label: 'Hotéis', iconSet: 'ion', iconName: 'bed-outline', iconColor: '#c026d3', backgroundColor: '#c026d320' },
      { id: 'atm', label: 'Caixas', iconSet: 'ion', iconName: 'card-outline', iconColor: '#059669', backgroundColor: '#05966920' },
      { id: 'supermarket', label: 'Mercados', iconSet: 'ion', iconName: 'cart-outline', iconColor: '#d97706', backgroundColor: '#d9770620' },
      { id: 'bakery', label: 'Padarias', iconSet: 'ion', iconName: 'ice-cream-outline', iconColor: '#b45309', backgroundColor: '#b4530920' },
      { id: 'bar', label: 'Bares', iconSet: 'ion', iconName: 'beer-outline', iconColor: '#dc2626', backgroundColor: '#dc262620' },
    ],
    []
  );

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    router.replace({
      pathname: '/(tabs)/explore',
      params: { category: categoryId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
        >

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