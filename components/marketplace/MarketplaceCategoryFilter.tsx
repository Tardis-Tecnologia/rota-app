import { MARKETPLACE_FILTER_OPTIONS } from '@/constants/marketplaceCategories';
import { AppColors } from '@/constants/theme';
import type { MarketplaceListFilter } from '@/types/marketplace';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

interface MarketplaceCategoryFilterProps {
  active: MarketplaceListFilter;
  onSelect: (key: MarketplaceListFilter) => void;
}

export default function MarketplaceCategoryFilter({
  active,
  onSelect,
}: MarketplaceCategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {MARKETPLACE_FILTER_OPTIONS.map(({ key, label }) => {
        const selected = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={[styles.chip, selected && styles.chipActive]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: 12,
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
