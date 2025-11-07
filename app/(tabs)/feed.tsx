import NewsPosts from '@/components/NewsPosts';
import { AppColors } from '@/constants/theme';
import { FeedFilter } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const FILTERS: Array<{ key: FeedFilter; label: string }> = [
  { key: 'todos', label: 'Todos' },
  { key: 'noticias', label: 'Notícias' },
  { key: 'obras', label: 'Obras' },
  { key: 'lazer', label: 'Lazer' },
];

export default function FeedScreen() {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('todos');

  const handleSelectFilter = (filter: FeedFilter) => {
    setActiveFilter(filter);
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.filtersWrapper}>
          <View style={styles.filtersContainerBg}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            >
              {FILTERS.map(({ key, label }) => {
                const isActive = key === activeFilter;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.filterButton, isActive && styles.filterButtonActive]}
                    onPress={() => handleSelectFilter(key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

          <NewsPosts filter={activeFilter} />
        </ScrollView>
      </View>
      <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={() => {}}>
        <MaterialIcons name="add-circle-outline" size={28} color={AppColors.text.white} />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },

  filtersWrapper: {
    paddingBottom: 12,
  },
  filtersContainerBg: {
    backgroundColor: AppColors.feed.filterBackground,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  filtersContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    backgroundColor: AppColors.feed.filterButton,
  },
  filterButtonActive: {
    backgroundColor: AppColors.feed.filterActive,
    borderColor: AppColors.feed.filterActive,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.feed.filterText,
  },
  filterLabelActive: {
    color: AppColors.text.white,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});

