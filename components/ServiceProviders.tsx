import { CATEGORIES_WITH_ALL } from '@/constants/providerCategories';
import { AppColors } from '@/constants/theme';
import { PROVIDERS } from '@/data/providers';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';

import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const categories = CATEGORIES_WITH_ALL;
const providers = PROVIDERS;

export default function ServiceProviders() {
  const [activeCategory, setActiveCategory] = useState('todos');
  

  const filteredProviders =
    activeCategory === 'todos'
      ? providers
      : providers.filter((provider) => provider.categoryId === activeCategory);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Encontre Prestadores de Serviço</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => {
          const isActive = item.id === activeCategory;
          return (
            <Pressable
              onPress={() => setActiveCategory(item.id)}
              style={[
                styles.filterButton,
                isActive && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  isActive && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      <View style={styles.listContainer}>
        {filteredProviders.map((provider) => {
          const categoryLabel =
            categories.find((c) => c.id === provider.categoryId)?.label || '';
          return (
            <View key={provider.id} style={styles.providerCard}>
              <Image source={{ uri: provider.image }} style={styles.avatar} />
              <View style={styles.providerContent}>
                <Text style={styles.providerName} numberOfLines={1}>
                  {provider.name}
                </Text>

                <Text style={styles.categoryText}>{categoryLabel}</Text>

                <View style={styles.ratingRow}>
                  <Ionicons
                    name="star"
                    size={14}
                    color={AppColors.palette.amber.base}
                  />
                  <Text style={styles.ratingValue}>{provider.rating.toFixed(1)}</Text>
                </View>

                <Pressable
                  style={styles.profileButton}
                  onPress={() =>
                    router.push({
                      pathname: '/ProfileProviderTab',
                      params: {
                        provider: JSON.stringify(provider),
                      },
                    })
                  }
                >
                  <Text style={styles.profileButtonText}>Ver Perfil</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  filtersContainer: {
    gap: 10,
    paddingBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.background.muted,
  },
  filterButtonActive: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accent,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  filterButtonTextActive: {
    color: AppColors.text.white,
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: AppColors.background.default,
    borderRadius: 24,
    padding: 15,
    width: '48%',
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border.muted,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.background.input,
    borderWidth: 4,
    borderColor: AppColors.background.default,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  providerContent: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
  },
  categoryText: {
    fontSize: 11,
    color: AppColors.text.tertiary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.palette.amber.base,
  },
  profileButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  profileButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.accent,
  },
});